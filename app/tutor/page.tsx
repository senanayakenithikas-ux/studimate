"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { ChatWindow } from "@/components/tutor/ChatWindow";
import type { TutorSpeechCache } from "@/components/tutor/ChatWindow";
import { VoiceChat } from "@/components/tutor/VoiceChat";
import { apiFetch } from "@/lib/client-fetch";
import {
  playTutorSpeech,
  stopSpeaking,
  stripForSpeech,
  unlockAudioPlayback,
} from "@/lib/tutor-voice";
import { useToast } from "@/hooks/use-toast";
import type {
  Material,
  Subject,
  TutorMessage,
  TutorPostResponse,
  TutorSpeechFields,
} from "@/types";
import { cn } from "@/lib/utils";

const READ_ALOUD_STORAGE_KEY = "studimate-tutor-read-aloud";

function readAloudPreference(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(READ_ALOUD_STORAGE_KEY) !== "false";
}

type TutorMode = "text" | "voice";

interface TutorMaterialItem {
  id: string;
  name: string;
  subject: string;
}

const EMPTY_MATERIAL: TutorMaterialItem = {
  id: "",
  name: "No materials yet",
  subject: "Upload a PDF first",
};

export default function TutorPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<TutorMode>("text");
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<TutorMaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] =
    useState<TutorMaterialItem>(EMPTY_MATERIAL);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [speechByMessageId, setSpeechByMessageId] = useState<
    Record<string, TutorSpeechCache>
  >({});
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [readAloudEnabled, setReadAloudEnabled] = useState(readAloudPreference);
  const speakingIdRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadMaterials() {
      setMaterialsLoading(true);
      try {
        const [subjects, allMaterials] = await Promise.all([
          apiFetch<Subject[]>("/api/subjects"),
          apiFetch<Material[]>("/api/materials?all=true"),
        ]);

        const subjectNameById = new Map(
          subjects.map((s) => [s.id, s.name] as const),
        );

        const mapped: TutorMaterialItem[] = allMaterials.map((m) => ({
          id: m.id,
          name: m.title,
          subject: subjectNameById.get(m.subjectId) ?? "Subject",
        }));

        setMaterials(mapped);
        if (mapped.length > 0) {
          setSelectedMaterial((prev) =>
            prev.id && mapped.some((m) => m.id === prev.id) ? prev : mapped[0],
          );
        } else {
          setSelectedMaterial(EMPTY_MATERIAL);
        }
      } catch {
        setMaterials([]);
        setSelectedMaterial(EMPTY_MATERIAL);
      } finally {
        setMaterialsLoading(false);
      }
    }

    void loadMaterials();
  }, []);

  const playReply = useCallback(
    async (
      messageId: string,
      content: string,
      audioBase64: string | null | undefined,
      spokenText: string | undefined,
    ) => {
      stopSpeaking();
      speakingIdRef.current = messageId;
      setSpeakingId(messageId);
      try {
        await playTutorSpeech(
          spokenText ?? stripForSpeech(content),
          audioBase64 ?? null,
          "audio/mpeg",
        );
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Could not play audio",
          description:
            err instanceof Error ? err.message : "Try tapping Listen on the reply.",
        });
      } finally {
        if (speakingIdRef.current === messageId) {
          speakingIdRef.current = null;
          setSpeakingId(null);
        }
      }
    },
    [toast],
  );

  const handleReplay = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || message.role !== "assistant") return;

      unlockAudioPlayback();

      let speech = speechByMessageId[messageId];
      if (!speech) {
        try {
          const data = await apiFetch<TutorSpeechFields>("/api/ai/tutor/speech", {
            method: "POST",
            body: JSON.stringify({ text: message.content }),
          });
          const spoken =
            data.spokenText?.trim() || stripForSpeech(message.content);
          speech = {
            audioBase64: data.audioBase64 ?? null,
            spokenText: spoken,
          };
          setSpeechByMessageId((prev) => ({
            ...prev,
            [messageId]: speech!,
          }));
        } catch (err) {
          toast({
            variant: "destructive",
            title: "Could not load voice",
            description:
              err instanceof Error
                ? err.message
                : "MiniMax text-to-speech is unavailable.",
          });
          return;
        }
      }

      void playReply(
        messageId,
        message.content,
        speech.audioBase64,
        speech.spokenText,
      );
    },
    [messages, speechByMessageId, playReply, toast],
  );

  const handleReadAloudToggle = useCallback(() => {
    setReadAloudEnabled((on) => {
      const next = !on;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(READ_ALOUD_STORAGE_KEY, next ? "true" : "false");
      }
      if (!next) {
        stopSpeaking();
      } else {
        unlockAudioPlayback();
      }
      return next;
    });
  }, []);

  const handleSelectMaterial = (material: TutorMaterialItem) => {
    if (material.id === selectedMaterial.id) return;
    setSelectedMaterial(material);
    setSessionId(null);
    setMessages([]);
    setSpeechByMessageId({});
    stopSpeaking();
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping || materialsLoading) return;
    if (!selectedMaterial.id) return;

    const content = input.trim();
    const userMessage: TutorMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    if (readAloudEnabled) {
      unlockAudioPlayback();
    }
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const body: Record<string, string | boolean> = {
        message: content,
        include_speech: readAloudEnabled,
      };
      if (sessionId) {
        body.session_id = sessionId;
      } else if (selectedMaterial.id) {
        body.material_id = selectedMaterial.id;
      }

      const data = await apiFetch<TutorPostResponse>("/api/ai/tutor", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setSessionId(data.sessionId);
      setMessages((prev) => [...prev, data.message]);

      if (readAloudEnabled) {
        const spoken =
          data.spokenText?.trim() || stripForSpeech(data.message.content);
        setSpeechByMessageId((prev) => ({
          ...prev,
          [data.message.id]: {
            audioBase64: data.audioBase64 ?? null,
            spokenText: spoken,
          },
        }));
        if (spoken || data.audioBase64) {
          void playReply(
            data.message.id,
            data.message.content,
            data.audioBase64,
            data.spokenText,
          );
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Failed to send message. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const pickerMaterials =
    materials.length > 0 ? materials : [EMPTY_MATERIAL];

  return (
    <AppLayout title="AI Tutor">
      <div className="space-y-4">
        <div
          className="inline-flex rounded-lg border border-border bg-muted/30 p-1"
          role="tablist"
          aria-label="Tutor mode"
        >
          <ModeTab
            active={mode === "text"}
            onClick={() => setMode("text")}
            label="Text chat"
          />
          <ModeTab
            active={mode === "voice"}
            onClick={() => {
              stopSpeaking();
              setMode("voice");
            }}
            label="Voice chat"
          />
        </div>

        {mode === "text" ? (
          <ChatWindow
            messages={messages}
            input={input}
            isTyping={isTyping}
            materials={pickerMaterials}
            selectedMaterial={selectedMaterial}
            speechByMessageId={speechByMessageId}
            speakingId={speakingId}
            readAloudEnabled={readAloudEnabled}
            onReadAloudToggle={handleReadAloudToggle}
            onInputChange={setInput}
            onSend={() => void handleSend()}
            onReplay={
              readAloudEnabled ? (messageId) => void handleReplay(messageId) : undefined
            }
            onSelectMaterial={handleSelectMaterial}
          />
        ) : (
          <VoiceChat
            materialId={selectedMaterial.id || undefined}
            materialName={selectedMaterial.name}
          />
        )}
      </div>
    </AppLayout>
  );
}

function ModeTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
