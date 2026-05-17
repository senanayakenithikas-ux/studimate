"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { apiFetch } from "@/lib/client-fetch";
import type { Message } from "@/lib/minimax";
import {
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
  playTutorSpeech,
  stopSpeaking,
  stripForSpeech,
  unlockAudioPlayback,
  VOICE_SILENCE_MS,
} from "@/lib/tutor-voice";
import type { TutorVoicePostResponse } from "@/types";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceStatus =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error"
  | "unsupported";

interface TranscriptLine {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface VoiceChatProps {
  materialId?: string;
  materialName?: string;
}

function buildTranscriptFromResults(
  results: SpeechRecognitionResultList,
): string {
  let text = "";
  for (let i = 0; i < results.length; i++) {
    text += results[i][0]?.transcript ?? "";
  }
  return text.trim();
}

export function VoiceChat({ materialId, materialName }: VoiceChatProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [interim, setInterim] = useState("");
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  const historyRef = useRef<Message[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const busyRef = useRef(false);
  const transcriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningRef = useRef(false);

  const supported = isSpeechRecognitionSupported();

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!supported) {
      setStatus("unsupported");
    }
    return () => {
      clearSilenceTimer();
      listeningRef.current = false;
      recognitionRef.current?.abort();
      stopSpeaking();
    };
  }, [supported, clearSilenceTimer]);

  const sendToTutor = useCallback(
    async (userText: string) => {
      const body: Record<string, unknown> = {
        message: userText,
        history: historyRef.current,
      };
      if (materialId) {
        body.material_id = materialId;
      }

      const data = await apiFetch<TutorVoicePostResponse>("/api/ai/tutor/voice", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!data?.message?.content) {
        throw new Error("Invalid voice tutor response");
      }

      historyRef.current = data.history ?? [
        ...historyRef.current,
        { role: "user", content: userText },
        { role: "assistant", content: data.message.content },
      ];

      return data;
    },
    [materialId],
  );

  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      const text = transcript.trim();
      if (!text || busyRef.current) return;

      listeningRef.current = false;
      clearSilenceTimer();
      recognitionRef.current?.stop();
      busyRef.current = true;
      setInterim("");
      transcriptRef.current = "";
      setLines((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", text },
      ]);
      setStatus("processing");
      setError(null);

      try {
        const data = await sendToTutor(text);
        const reply = data.message.content;
        setLines((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", text: reply },
        ]);

        const spoken = data.spokenText?.trim() || stripForSpeech(reply);
        if (!spoken) {
          setStatus("idle");
          busyRef.current = false;
          return;
        }

        setStatus("speaking");
        await playTutorSpeech(
          spoken,
          data.audioBase64,
          data.audioMime ?? "audio/mpeg",
        );
        setStatus("idle");
        busyRef.current = false;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not reach the tutor";
        setError(msg);
        setStatus("error");
        busyRef.current = false;
      }
    },
    [sendToTutor, clearSilenceTimer],
  );

  const scheduleSilenceFinalize = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      if (!listeningRef.current || busyRef.current) return;
      const text = transcriptRef.current.trim();
      if (text) {
        void handleFinalTranscript(text);
      }
    }, VOICE_SILENCE_MS);
  }, [clearSilenceTimer, handleFinalTranscript]);

  const startListening = useCallback(() => {
    if (!supported || busyRef.current) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }

    unlockAudioPlayback();
    stopSpeaking();
    recognitionRef.current?.abort();
    clearSilenceTimer();
    transcriptRef.current = "";

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listeningRef.current = true;
      setStatus("listening");
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const full = buildTranscriptFromResults(event.results);
      transcriptRef.current = full;
      setInterim(full);
      scheduleSilenceFinalize();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      if (event.error === "no-speech" && listeningRef.current) {
        scheduleSilenceFinalize();
        return;
      }
      setError(`Microphone error: ${event.error}`);
      setStatus("error");
      listeningRef.current = false;
      busyRef.current = false;
      clearSilenceTimer();
    };

    recognition.onend = () => {
      if (listeningRef.current && !busyRef.current) {
        try {
          recognition.start();
        } catch {
          scheduleSilenceFinalize();
        }
      } else if (!busyRef.current) {
        setStatus((s) => (s === "listening" ? "idle" : s));
        setInterim("");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, scheduleSilenceFinalize, clearSilenceTimer]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    clearSilenceTimer();
    recognitionRef.current?.stop();

    const text = transcriptRef.current.trim();
    if (text && !busyRef.current) {
      void handleFinalTranscript(text);
    } else {
      setInterim("");
      if (!busyRef.current) setStatus("idle");
    }
  }, [clearSilenceTimer, handleFinalTranscript]);

  const endSession = useCallback(() => {
    listeningRef.current = false;
    clearSilenceTimer();
    recognitionRef.current?.abort();
    stopSpeaking();
    historyRef.current = [];
    transcriptRef.current = "";
    setLines([]);
    setInterim("");
    setError(null);
    busyRef.current = false;
    setStatus("idle");
  }, [clearSilenceTimer]);

  const statusLabel: Record<VoiceStatus, string> = {
    idle: "Tap the microphone and ask your question",
    listening: `Listening… (pauses up to ${VOICE_SILENCE_MS / 1000}s are OK)`,
    processing: "Thinking…",
    speaking: "Speaking…",
    error: "Something went wrong",
    unsupported: "Voice input is not supported in this browser",
  };

  const micDisabled =
    status === "processing" ||
    status === "speaking" ||
    status === "unsupported" ||
    !materialId;

  return (
    <Card className="flex h-[calc(100vh-14rem)] flex-col gap-4 border-border bg-card/50 py-4">
      <div className="flex items-center justify-between gap-2 px-4">
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
          Voice — not saved to chat history
        </span>
        {materialName ? (
          <span className="max-w-[140px] truncate text-xs text-muted-foreground">
            {materialName}
          </span>
        ) : null}
        {lines.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={endSession}>
            End session
          </Button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-4">
        <p className="text-center text-sm text-muted-foreground">
          {statusLabel[status]}
        </p>

        {interim ? (
          <p className="max-w-md text-center text-sm italic text-muted-foreground">
            {interim}
          </p>
        ) : null}

        {status === "processing" ? <LoadingSpinner size="md" /> : null}

        <button
          type="button"
          disabled={micDisabled}
          onClick={status === "listening" ? stopListening : startListening}
          aria-label={
            status === "listening" ? "Stop and send" : "Start voice input"
          }
          className={cn(
            "flex h-24 w-24 items-center justify-center rounded-full border-2 transition disabled:opacity-40",
            status === "listening"
              ? "border-red-500 bg-red-500/20 animate-pulse"
              : "border-indigo-500 bg-indigo-600/20 hover:bg-indigo-600/40",
          )}
        >
          {status === "listening" ? (
            <Square className="h-8 w-8 text-red-400" />
          ) : (
            <Mic className="h-10 w-10 text-indigo-300" />
          )}
        </button>

        {status === "speaking" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              stopSpeaking();
              setStatus("idle");
              busyRef.current = false;
            }}
          >
            Stop speaking
          </Button>
        ) : null}

        {!materialId ? (
          <p className="text-center text-xs text-amber-400/90">
            Select a study material in Text chat mode first, or upload a PDF.
          </p>
        ) : null}
      </div>

      <div className="mx-4 max-h-40 space-y-2 overflow-y-auto border-t border-border pt-3">
        {lines.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Speak naturally — we wait {VOICE_SILENCE_MS / 1000} seconds of
            silence before sending. Answers use MiniMax voice. Chrome or Edge
            recommended.
          </p>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className={cn(
                "text-sm",
                line.role === "user" ? "text-indigo-300" : "text-foreground",
              )}
            >
              <span className="font-medium text-muted-foreground">
                {line.role === "user" ? "You: " : "Tutor: "}
              </span>
              {line.role === "assistant"
                ? stripForSpeech(line.text)
                : line.text}
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="px-4 text-center text-xs text-destructive">{error}</p>
      ) : null}
    </Card>
  );
}
