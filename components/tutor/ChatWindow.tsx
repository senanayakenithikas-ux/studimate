"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TutorMessageBody } from "@/components/tutor/TutorMessageBody";
import { unlockAudioPlayback } from "@/lib/tutor-voice";
import type { TutorMessage } from "@/types";
import { ChevronDown, FileText, Mic, Send, Sparkles, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialOption {
  id: string;
  name: string;
  subject: string;
}

export interface TutorSpeechCache {
  audioBase64: string | null;
  spokenText: string;
}

interface ChatWindowProps {
  messages: TutorMessage[];
  input: string;
  isTyping: boolean;
  materials: MaterialOption[];
  selectedMaterial: MaterialOption;
  speechByMessageId?: Record<string, TutorSpeechCache>;
  speakingId?: string | null;
  readAloudEnabled: boolean;
  onReadAloudToggle: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onReplay?: (messageId: string) => void;
  onSelectMaterial: (material: MaterialOption) => void;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

function MessageBubble({
  message,
  speech,
  isSpeaking,
  onReplay,
}: {
  message: TutorMessage;
  speech?: TutorSpeechCache;
  isSpeaking: boolean;
  onReplay?: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-card border border-border text-foreground",
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-2">
            <TutorMessageBody content={message.content} />
            {speech && onReplay ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-indigo-400 hover:text-indigo-300"
                disabled={isSpeaking}
                onClick={onReplay}
              >
                <Volume2 className="h-3.5 w-3.5" />
                {isSpeaking ? "Playing…" : "Listen again"}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatWindow({
  messages,
  input,
  isTyping,
  materials,
  selectedMaterial,
  speechByMessageId = {},
  speakingId = null,
  readAloudEnabled,
  onReadAloudToggle,
  onInputChange,
  onSend,
  onReplay,
  onSelectMaterial,
}: ChatWindowProps) {
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      unlockAudioPlayback();
      onSend();
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            AI Tutor
          </h1>
          <p className="text-sm text-muted-foreground">
            {readAloudEnabled
              ? "Read-aloud on — tutor replies use MiniMax voice"
              : "Tap the mic to hear tutor replies (MiniMax voice)"}
          </p>
        </div>

        <div className="relative shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowMaterialPicker(!showMaterialPicker)}
            className="border-border hover:border-indigo-500/50"
          >
            <FileText className="w-4 h-4 mr-2 text-indigo-400" />
            <span className="max-w-[120px] truncate">{selectedMaterial.name}</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>

          {showMaterialPicker && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card rounded-xl border border-border shadow-lg z-10">
              <div className="p-2">
                {materials.map((material) => (
                  <button
                    key={material.id || "empty"}
                    type="button"
                    onClick={() => {
                      onSelectMaterial(material);
                      setShowMaterialPicker(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      selectedMaterial.id === material.id
                        ? "bg-indigo-500/10"
                        : "hover:bg-secondary",
                    )}
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {material.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {material.subject}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Ask about your study materials. Turn on the mic below to hear
                  replies read aloud with MiniMax voice.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                speech={speechByMessageId[message.id]}
                isSpeaking={speakingId === message.id}
                onReplay={
                  readAloudEnabled &&
                  onReplay &&
                  speechByMessageId[message.id]
                    ? () => onReplay(message.id)
                    : undefined
                }
              />
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t border-border">
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-input rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              />
            </div>
            <Button
              type="button"
              variant={readAloudEnabled ? "default" : "outline"}
              onClick={() => {
                if (!readAloudEnabled) {
                  unlockAudioPlayback();
                }
                onReadAloudToggle();
              }}
              disabled={isTyping}
              aria-label={
                readAloudEnabled ? "Turn off read aloud" : "Turn on read aloud"
              }
              aria-pressed={readAloudEnabled}
              className={cn(
                "h-11 w-11 p-0 shrink-0",
                readAloudEnabled
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400/50"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                if (readAloudEnabled) {
                  unlockAudioPlayback();
                }
                onSend();
              }}
              disabled={!input.trim() || isTyping || !selectedMaterial.id}
              className="bg-indigo-600 hover:bg-indigo-500 h-11 w-11 p-0 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

