import { NextResponse } from "next/server";
import { jsonOk } from "@/lib/api";
import {
  getMiniMaxErrorMessage,
  MiniMaxError,
  tutorChat,
  type Message,
} from "@/lib/minimax";
import {
  mapStudyMaterialStorageRow,
} from "@/lib/study-material-storage";
import {
  resolveStudyMaterialPromptText,
  TUTOR_PROMPT_MAX_CHARS,
} from "@/lib/study-material-prompt";
import { runEphemeralVoiceTutorTurn } from "@/lib/tutor-ephemeral-voice";
import { buildTutorSpeechPayload } from "@/lib/tutor-tts";
import { getAuthedSupabase } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TutorMessage } from "@/types";

export const runtime = "nodejs";

interface PostTutorBody {
  session_id?: string;
  material_id?: string;
  message?: string;
  include_speech?: boolean;
  /** Voice bot: spoken replies via MiniMax tutorChat (voice prompt), not text read-aloud. */
  voice_mode?: boolean;
  /** Voice bot: in-memory turn only, no chat_sessions write. */
  ephemeral?: boolean;
  history?: Message[];
}

interface ChatSessionRecord {
  id: string;
  material_id: string | null;
  created_at: string;
  messages: Message[];
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    (row.role === "user" || row.role === "assistant") &&
    typeof row.content === "string"
  );
}

function parseMessages(value: unknown): Message[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value) || !value.every(isMessage)) {
    throw new Error("Invalid messages format in chat session");
  }
  return value;
}

function mapChatSession(row: Record<string, unknown>): ChatSessionRecord {
  return {
    id: String(row.id),
    material_id:
      row.material_id === null || row.material_id === undefined
        ? null
        : String(row.material_id),
    created_at: String(row.created_at ?? ""),
    messages: parseMessages(row.messages),
  };
}

/**
 * Validates authorization context and instantiates an authenticated client.
 */
async function authenticate(
  request: Request,
): Promise<{ supabase: SupabaseClient; userId: string }> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new Error("Unauthorized");
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    throw new Error("Unauthorized");
  }

  return ctx;
}

async function fetchMaterialContext(
  supabase: SupabaseClient,
  materialId: string,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("id, user_id, filename, storage_url, extracted_text, file_path")
    .eq("id", materialId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return "";
  }

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
}

/* --- HTTP METHOD HANDLERS --- */

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { supabase, userId } = await authenticate(request);
    const body = (await request.json().catch(() => ({}))) as PostTutorBody;

    const message = body.message?.trim();
    if (!message) {
      return errorResponse("message is required", 400);
    }

    if (body.voice_mode === true && body.ephemeral === true) {
      const voiceResult = await runEphemeralVoiceTutorTurn(supabase, userId, {
        message,
        materialId: body.material_id,
        history: body.history,
      });
      return jsonOk(voiceResult);
    }

    let sessionId: string;
    let history: Message[] = [];
    let context = "";

    const providedSessionId = body.session_id?.trim();

    if (providedSessionId) {
      // Lookup existing workspace chat context
      const { data: sessionRow, error: sessionError } = await supabase
        .from("chat_sessions")
        .select("id, user_id, material_id, messages")
        .eq("id", providedSessionId)
        .eq("user_id", userId)
        .single();

      if (sessionError || !sessionRow) {
        return errorResponse("Chat session not found", 404);
      }

      const session = sessionRow as Record<string, unknown>;
      sessionId = String(session.id);
      history = parseMessages(session.messages);

      const sessionMaterialId = session.material_id;
      if (
        sessionMaterialId !== null &&
        sessionMaterialId !== undefined &&
        String(sessionMaterialId).trim()
      ) {
        context = await fetchMaterialContext(
          supabase,
          String(sessionMaterialId),
          userId,
        );
      }
    } else {
      // Spin up a brand new workspace chat session channel
      const materialId = body.material_id?.trim() ?? null;

      if (materialId) {
        const { data: materialRow, error: materialError } = await supabase
          .from("study_materials")
          .select("id")
          .eq("id", materialId)
          .eq("user_id", userId)
          .single();

        if (materialError || !materialRow) {
          return errorResponse("Study material not found", 404);
        }

        context = await fetchMaterialContext(supabase, materialId, userId);
      }

      const { data: newSession, error: insertError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: userId,
          material_id: materialId,
          messages: [],
        })
        .select("id")
        .single();

      if (insertError || !newSession) {
        return errorResponse(
          insertError?.message ?? "Failed to create chat session",
          500,
        );
      }

      sessionId = String((newSession as Record<string, unknown>).id);
    }

    // Call out to MiniMax wrapper context handler
    const aiReply = await tutorChat(context, history, message);

    const updatedHistory: Message[] = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: aiReply },
    ];

    // Persist conversation updates safely into jsonb arrays
    const { error: updateError } = await supabase
      .from("chat_sessions")
      .update({ messages: updatedHistory })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (updateError) {
      return errorResponse(updateError.message, 500);
    }

    const assistantMessage: TutorMessage = {
      id: `a-${sessionId}-${Date.now()}`,
      role: "assistant",
      content: aiReply,
      createdAt: new Date().toISOString(),
    };

    const includeSpeech = body.include_speech === true;
    const speech = includeSpeech
      ? await buildTutorSpeechPayload(aiReply, "hd")
      : {
          spokenText: "",
          audioBase64: null,
          audioMime: "audio/mpeg",
        };

    return jsonOk({
      sessionId,
      message: assistantMessage,
      history: updatedHistory,
      ...speech,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Internal server error";
    if (errMessage === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof MiniMaxError || errMessage.includes("MiniMax")) {
      return errorResponse(getMiniMaxErrorMessage(error), 502);
    }
    return errorResponse(errMessage, 500);
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { supabase, userId } = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id")?.trim();

    if (!sessionId) {
      // List historical chat streams ordered by activity sequence
      const { data: sessions, error: listError } = await supabase
        .from("chat_sessions")
        .select("id, material_id, created_at, messages")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (listError) {
        return errorResponse(listError.message, 500);
      }

      return NextResponse.json({
        sessions: (sessions ?? []).map((row: Record<string, unknown>) =>
          mapChatSession(row),
        ),
      });
    }

    // Fetch isolated target message session block context
    const { data: sessionRow, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id, material_id, created_at, messages")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !sessionRow) {
      return errorResponse("Chat session not found", 404);
    }

    return NextResponse.json({
      session: mapChatSession(sessionRow as Record<string, unknown>),
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Internal server error";
    if (errMessage === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(errMessage, 500);
  }
}