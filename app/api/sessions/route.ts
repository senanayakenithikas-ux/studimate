import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { getAuthedSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  const { supabase, userId } = ctx;

  let body: { sessionId?: string };
  try {
    body = (await request.json()) as { sessionId?: string };
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return jsonError("sessionId is required");
  }

  const { data, error } = await supabase
    .from("schedules")
    .update({ completed: true })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("id, completed")
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Session not found", 404);
  }

  return jsonOk({ completed: true, sessionId: data.id });
}
