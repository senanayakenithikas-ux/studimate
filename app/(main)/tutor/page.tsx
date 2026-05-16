"use client";

import { TopBar } from "@/components/layout/TopBar";
import { ChatWindow } from "@/components/tutor/ChatWindow";
import { apiFetch } from "@/lib/client-fetch";
import type { TutorMessage } from "@/types";

export default function TutorPage() {
  async function handleSend(message: string): Promise<TutorMessage> {
    return apiFetch<TutorMessage>("/api/ai/tutor", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  return (
    <>
      <TopBar title="Tutor" />
      <div className="mx-auto max-w-3xl p-6">
        <ChatWindow onSend={handleSend} />
      </div>
    </>
  );
}
