"use client";

import { useState } from "react";
import type { TutorMessage } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface ChatWindowProps {
  onSend: (message: string) => Promise<TutorMessage>;
}

export function ChatWindow({ onSend }: ChatWindowProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: TutorMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await onSend(userMsg.content);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-[32rem] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Ask a question about your uploaded material.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "ml-auto bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {loading ? <Spinner /> : null}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the tutor..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
        />
        <Button type="submit" disabled={loading}>
          Send
        </Button>
      </form>
    </Card>
  );
}
