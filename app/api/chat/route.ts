import type { SupabaseClient } from "@supabase/supabase-js";
import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { getAuthedSupabase } from "@/lib/supabase-server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatPostBody {
  materialId?: string;
  message?: ChatMessage;
  sessionId?: string;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ChatMessage =>
      typeof item === "object" &&
      item !== null &&
      ((item as ChatMessage).role === "user" ||
        (item as ChatMessage).role === "assistant") &&
      typeof (item as ChatMessage).content === "string",
  );
}

function parseMessage(raw: unknown): ChatMessage | null {
  if (typeof raw !== "object" || raw === null) return null;

  const { role, content } = raw as ChatMessage;
  if (role !== "user" && role !== "assistant") return null;

  const trimmed = typeof content === "string" ? content.trim() : "";
  if (!trimmed) return null;

  return { role, content: trimmed };
}

async function verifyMaterial(
  supabase: SupabaseClient,
  userId: string,
  materialId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("id")
    .eq("id", materialId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function GET(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();
  if (!sessionId || !isUuid(sessionId)) {
    return jsonError("Valid sessionId query parameter is required");
  }

  const { data, error } = await ctx.supabase
    .from("chat_sessions")
    .select("id, messages")
    .eq("id", sessionId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Session not found", 404);
  }

  return jsonOk({
    sessionId: data.id,
    messages: normalizeMessages(data.messages),
  });
}

export async function POST(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  let body: ChatPostBody;
  try {
    body = (await request.json()) as ChatPostBody;
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const message = parseMessage(body.message);
  if (!message) {
    return jsonError(
      "message with role (user|assistant) and content is required",
    );
  }

  const sessionId = body.sessionId?.trim();

  if (!sessionId) {
    const materialId = body.materialId?.trim();
    if (!materialId || !isUuid(materialId)) {
      return jsonError("Valid materialId is required for a new session");
    }

    const materialOk = await verifyMaterial(
      ctx.supabase,
      ctx.userId,
      materialId,
    );
    if (!materialOk) {
      return jsonError("Material not found", 404);
    }

    const { data, error } = await ctx.supabase
      .from("chat_sessions")
      .insert({
        user_id: ctx.userId,
        material_id: materialId,
        messages: [message],
      })
      .select("id, messages")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return jsonOk(
      {
        sessionId: data.id,
        messages: normalizeMessages(data.messages),
      },
      201,
    );
  }

  if (!isUuid(sessionId)) {
    return jsonError("Valid sessionId is required");
  }

  const { data: existing, error: fetchError } = await ctx.supabase
    .from("chat_sessions")
    .select("id, messages")
    .eq("id", sessionId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (fetchError) {
    return jsonError(fetchError.message, 500);
  }

  if (!existing) {
    return jsonError("Session not found", 404);
  }

  const nextMessages = [...normalizeMessages(existing.messages), message];

  const { data: updated, error: updateError } = await ctx.supabase
    .from("chat_sessions")
    .update({ messages: nextMessages })
    .eq("id", sessionId)
    .eq("user_id", ctx.userId)
    .select("id, messages")
    .single();

  if (updateError) {
    return jsonError(updateError.message, 500);
  }

  return jsonOk({
    sessionId: updated.id,
    messages: normalizeMessages(updated.messages),
  });
}
