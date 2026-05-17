import { jsonError, jsonOk } from "@/lib/api";
import {
  getMiniMaxErrorMessage,
  MiniMaxError,
  type Message,
} from "@/lib/minimax";
import { runEphemeralVoiceTutorTurn } from "@/lib/tutor-ephemeral-voice";
import { getAuthedSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

interface VoiceTutorBody {
  message?: string;
  history?: Message[];
  material_id?: string;
}

/**
 * Voice bot endpoint — same MiniMax tutorChat + TTS as POST /api/ai/tutor with voice_mode.
 * Prefer /api/ai/tutor with voice_mode + ephemeral for new clients.
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

    const body = (await request.json().catch(() => ({}))) as VoiceTutorBody;
    const message = body.message?.trim();
    if (!message) {
      return jsonError("message is required", 400);
    }

    const result = await runEphemeralVoiceTutorTurn(ctx.supabase, ctx.userId, {
      message,
      materialId: body.material_id,
      history: body.history,
    });

    return jsonOk(result);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Internal server error";
    if (errMessage === "Unauthorized") {
      return jsonError("Unauthorized", 401);
    }
    if (error instanceof MiniMaxError || errMessage.includes("MiniMax")) {
      return jsonError(getMiniMaxErrorMessage(error), 502);
    }
    return jsonError(errMessage, 500);
  }
}
