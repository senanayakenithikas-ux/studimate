"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TutorMessage } from "@/types";
import { ChevronDown, FileText, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialOption {
  id: number;
  name: string;
  subject: string;
}

interface ChatWindowProps {
  messages: TutorMessage[];
  input: string;
  isTyping: boolean;
  materials: MaterialOption[];
  selectedMaterial: MaterialOption;
  onInputChange: (value: string) => void;
  onSend: () => void;
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

function MessageBubble({ message }: { message: TutorMessage }) {
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
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
  onInputChange,
  onSend,
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
      onSend();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Tutor
          </h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about your study materials
          </p>
        </div>

        <div className="relative">
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
                    key={material.id}
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
                      <p className="text-xs text-muted-foreground">{material.subject}</p>
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
                  Ask me anything about your study materials. I can explain concepts,
                  answer questions, and help you prepare for exams.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
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
              onClick={onSend}
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-500 h-11 w-11 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
