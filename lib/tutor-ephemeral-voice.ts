import { tutorChat, type Message } from "@/lib/minimax";
import {
  mapStudyMaterialStorageRow,
} from "@/lib/study-material-storage";
import {
  resolveStudyMaterialPromptText,
  TUTOR_PROMPT_MAX_CHARS,
} from "@/lib/study-material-prompt";
import { buildTutorSpeechPayload } from "@/lib/tutor-tts";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TutorMessage, TutorSpeechFields } from "@/types";

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    (row.role === "user" || row.role === "assistant") &&
    typeof row.content === "string"
  );
}

export function parseClientHistory(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isMessage).slice(-10);
}

async function fetchMaterialContext(
  supabase: SupabaseClient,
  userId: string,
  materialId?: string,
): Promise<string> {
  const loadRow = async (id: string) => {
    const { data, error } = await supabase
      .from("study_materials")
      .select("id, user_id, filename, storage_url, extracted_text, file_path")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) return "";
    const row = mapStudyMaterialStorageRow(data as Record<string, unknown>);
    try {
      return await resolveStudyMaterialPromptText(
        supabase,
        row,
        TUTOR_PROMPT_MAX_CHARS,
      );
    } catch {
      return row.extracted_text?.trim().slice(0, TUTOR_PROMPT_MAX_CHARS) ?? "";
    }
  };

  if (materialId?.trim()) {
    return loadRow(materialId.trim());
  }

  const { data } = await supabase
    .from("study_materials")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return "";
  return loadRow(String((data as Record<string, unknown>).id));
}

export interface EphemeralVoiceTurnInput {
  message: string;
  materialId?: string;
  history?: Message[];
}

export interface EphemeralVoiceTurnResult {
  message: TutorMessage;
  history: Message[];
  ephemeral: true;
}

/**
 * Voice bot turn: same MiniMax tutorChat as text chat (voice system prompt) + MiniMax TTS.
 * Does not persist to chat_sessions — separate from text read-aloud.
 */
export async function runEphemeralVoiceTutorTurn(
  supabase: SupabaseClient,
  userId: string,
  input: EphemeralVoiceTurnInput,
): Promise<EphemeralVoiceTurnResult & TutorSpeechFields> {
  const message = input.message.trim();
  const history = parseClientHistory(input.history);
  const context = await fetchMaterialContext(
    supabase,
    userId,
    input.materialId,
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

  return {
    message: assistantMessage,
    history: updatedHistory,
    ephemeral: true,
    ...speech,
  };
}
