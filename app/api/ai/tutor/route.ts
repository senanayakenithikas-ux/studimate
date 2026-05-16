import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { chatCompletion } from "@/lib/minimax";
import type { TutorMessage } from "@/types";

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await request.json()) as { message?: string };
  if (!body.message?.trim()) {
    return jsonError("message is required");
  }

  const content = await chatCompletion([
    { role: "user", content: body.message.trim() },
  ]);

  const reply: TutorMessage = {
    id: `a-${Date.now()}`,
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };

  return jsonOk(reply);
}
