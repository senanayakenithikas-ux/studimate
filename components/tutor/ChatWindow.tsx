"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TutorMessageBody } from "@/components/tutor/TutorMessageBody";
import { unlockAudioPlayback } from "@/lib/tutor-voice";
import type { TutorMessage } from "@/types";
import { Send, Sparkles, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TutorSpeechCache {
  audioBase64: string | null;
  spokenText: string;
}

interface ChatWindowProps {
  messages: TutorMessage[];
  input: string;
  isTyping: boolean;
  selectedMaterialId: string;
  speechByMessageId?: Record<string, TutorSpeechCache>;
  speakingId?: string | null;
  readAloudEnabled: boolean;
  onReadAloudToggle: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onReplay?: (messageId: string) => void;
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
            {onReplay ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-indigo-400 hover:text-indigo-300"
                disabled={isSpeaking}
                onClick={() => {
                  unlockAudioPlayback();
                  onReplay();
                }}
              >
                <Volume2 className="h-3.5 w-3.5" />
                {isSpeaking ? "Playing…" : speech ? "Listen again" : "Listen"}
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
  selectedMaterialId,
  speechByMessageId = {},
  speakingId = null,
  readAloudEnabled,
  onReadAloudToggle,
  onInputChange,
  onSend,
  onReplay,
}: ChatWindowProps) {
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
    <div className="h-[calc(100vh-14rem)] md:h-[calc(100vh-10rem)] flex flex-col">
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
                  Ask about your study materials. For a spoken back-and-forth
                  tutor, use the Voice bot tab — the speaker button here only
                  reads text replies aloud.
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
                  message.role === "assistant"
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
              title={
                readAloudEnabled
                  ? "Turn off read-aloud (text-to-speech only)"
                  : "Read tutor replies aloud (not voice chat)"
              }
              aria-label={
                readAloudEnabled ? "Turn off read aloud" : "Turn on read aloud"
              }
              aria-pressed={readAloudEnabled}
              className={cn(
                "h-11 shrink-0 gap-1.5 px-3",
                readAloudEnabled
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400/50"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Volume2 className="h-4 w-4 shrink-0" />
              <span className="hidden text-xs font-medium sm:inline">
                {readAloudEnabled ? "Aloud on" : "Read aloud"}
              </span>
            </Button>
            <Button
              onClick={() => {
                if (readAloudEnabled) {
                  unlockAudioPlayback();
                }
                onSend();
              }}
              disabled={!input.trim() || isTyping || !selectedMaterialId}
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
