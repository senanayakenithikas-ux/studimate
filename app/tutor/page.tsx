"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { ChatWindow } from "@/components/tutor/ChatWindow";
import { mockMaterials } from "@/lib/mock-data";
import { apiFetch } from "@/lib/client-fetch";
import type { TutorMessage } from "@/types";

export default function TutorPage() {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(mockMaterials[0]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const content = input.trim();
    const userMessage: TutorMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const reply = await apiFetch<TutorMessage>("/api/ai/tutor", {
        method: "POST",
        body: JSON.stringify({ message: content }),
      });
      setMessages((prev) => [...prev, reply]);
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

  return (
    <AppLayout title="AI Tutor">
      <ChatWindow
        messages={messages}
        input={input}
        isTyping={isTyping}
        materials={mockMaterials}
        selectedMaterial={selectedMaterial}
        onInputChange={setInput}
        onSend={() => void handleSend()}
        onSelectMaterial={setSelectedMaterial}
      />
    </AppLayout>
  );
}
