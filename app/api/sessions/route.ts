import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { getTodayDateString } from "@/lib/planner-dates";
import { getAuthedSupabase } from "@/lib/supabase-server";
import type { TodayScheduleTask } from "@/types";

interface ScheduleRow {
  id: string;
  topics: string;
  duration_mins: number;
  completed: boolean;
  subject_id: string;
  subjects: { name: string } | { name: string }[] | null;
}

function rowToTodayTask(row: ScheduleRow): TodayScheduleTask {
  const subjectRel = row.subjects;
  const subjectName = Array.isArray(subjectRel)
    ? subjectRel[0]?.name
    : subjectRel?.name;

  return {
    id: row.id,
    subject: subjectName ?? "Subject",
    topic: row.topics,
    duration: row.duration_mins,
    completed: row.completed,
  };
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

  const { supabase, userId } = ctx;
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("schedules")
    .select("id, topics, duration_mins, completed, subject_id, subjects(name)")
    .eq("user_id", userId)
    .eq("date", today)
    .order("duration_mins", { ascending: false });

  if (error) {
    return jsonError(error.message, 500);
  }

  const tasks = (data ?? []).map((row) =>
    rowToTodayTask(row as ScheduleRow),
  );

  return jsonOk(tasks);
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
