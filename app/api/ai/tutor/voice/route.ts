import { jsonError, jsonOk } from "@/lib/api";
import { getMiniMaxErrorMessage, tutorChat, type Message } from "@/lib/minimax";
import { getAuthedSupabase } from "@/lib/supabase-server";
import { buildTutorSpeechPayload } from "@/lib/tutor-tts";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TutorMessage } from "@/types";

interface VoiceTutorBody {
  message?: string;
  history?: Message[];
  material_id?: string;
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    (row.role === "user" || row.role === "assistant") &&
    typeof row.content === "string"
  );
}

function parseHistory(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isMessage).slice(-10);
}

async function fetchMaterialContext(
  supabase: SupabaseClient,
  userId: string,
  materialId?: string,
): Promise<string> {
  if (materialId?.trim()) {
    const { data } = await supabase
      .from("study_materials")
      .select("extracted_text")
      .eq("id", materialId.trim())
      .eq("user_id", userId)
      .single();

    const text = (data as Record<string, unknown> | null)?.extracted_text;
    return typeof text === "string" ? text : "";
  }

  const { data } = await supabase
    .from("study_materials")
    .select("extracted_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const text = (data as Record<string, unknown> | null)?.extracted_text;
  return typeof text === "string" ? text : "";
}

/**
 * Ephemeral tutor turn: no chat_sessions read or write. History stays on the client only.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return jsonError("Unauthorized", 401);
    }

    const ctx = await getAuthedSupabase(token);
    if (!ctx) {
      return jsonError("Unauthorized", 401);
    }

    const { supabase, userId } = ctx;
    const body = (await request.json().catch(() => ({}))) as VoiceTutorBody;

    const message = body.message?.trim();
    if (!message) {
      return jsonError("message is required", 400);
    }

    const history = parseHistory(body.history);
    const context = await fetchMaterialContext(
      supabase,
      userId,
      body.material_id,
    );

    const aiReply = await tutorChat(context, history, message, { voice: true });

    const updatedHistory: Message[] = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: aiReply },
    ];

    const assistantMessage: TutorMessage = {
      id: `voice-${Date.now()}`,
      role: "assistant",
      content: aiReply,
      createdAt: new Date().toISOString(),
    };

    const speech = await buildTutorSpeechPayload(aiReply, "hd");

    return jsonOk({
      message: assistantMessage,
      history: updatedHistory,
      ephemeral: true,
      ...speech,
    });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Internal server error";
    if (errMessage === "Unauthorized") {
      return jsonError("Unauthorized", 401);
    }
    if (errMessage.includes("MiniMax")) {
      return jsonError(getMiniMaxErrorMessage(error), 502);
    }
    return jsonError(errMessage, 500);
  }
}
