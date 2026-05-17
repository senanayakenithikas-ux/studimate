import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { getMiniMaxErrorMessage, MiniMaxError } from "@/lib/minimax";
import { buildTutorSpeechPayload } from "@/lib/tutor-tts";
import { getAuthedSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

interface SpeechBody {
  text?: string;
}

/**
 * On-demand MiniMax TTS for an existing tutor reply (replay / late read-aloud).
 */
export async function POST(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  let body: SpeechBody;
  try {
    body = (await request.json()) as SpeechBody;
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const text = body.text?.trim();
  if (!text) {
    return jsonError("text is required", 400);
  }

  try {
    const speech = await buildTutorSpeechPayload(text, "hd");
    return jsonOk(speech);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Speech synthesis failed";
    if (error instanceof MiniMaxError || errMessage.includes("MiniMax")) {
      return jsonError(getMiniMaxErrorMessage(error), 502);
    }
    return jsonError(errMessage, 500);
  }
}
