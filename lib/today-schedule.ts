import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getTodayDateString } from "@/lib/planner-dates";
import type {
  CreateScheduleInput,
  DbSubject,
  ScheduleWithSubject,
} from "@/types/schedule";
import type { TodayScheduleTask } from "@/types";

const SUBJECTS_TABLE = "subjects";
const SCHEDULES_TABLE = "schedules";
const DEFAULT_SESSION_TYPE = "Study";

function subjectNameFromJoin(
  subjects: ScheduleWithSubject["subjects"],
): string {
  if (Array.isArray(subjects)) {
    return subjects[0]?.name ?? "Subject";
  }
  return subjects?.name ?? "Subject";
}

export function scheduleRowToTask(row: ScheduleWithSubject): TodayScheduleTask {
  return {
    id: row.id,
    subject: subjectNameFromJoin(row.subjects),
    topic: row.topics,
    duration: row.duration_mins,
    completed: row.completed,
  };
}

export async function getAuthenticatedSupabase(): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Please sign in to manage your schedule");
  }

  return { supabase, user };
}

export async function fetchUserSubjects(): Promise<DbSubject[]> {
  const { supabase, user } = await getAuthenticatedSupabase();

  const { data, error } = await supabase
    .from(SUBJECTS_TABLE)
    .select("id, user_id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbSubject[];
}

function defaultExamDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export async function createSubject(name: string): Promise<DbSubject> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Subject name is required");
  }

  const { supabase, user } = await getAuthenticatedSupabase();

  const { data, error } = await supabase
    .from(SUBJECTS_TABLE)
    .insert({
      user_id: user.id,
      name: trimmed,
      exam_date: defaultExamDate(),
      confidence_level: 5,
    })
    .select("id, user_id, name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DbSubject;
}

export async function fetchSchedulesForDate(
  date: string,
): Promise<TodayScheduleTask[]> {
  const { supabase, user } = await getAuthenticatedSupabase();

  const { data, error } = await supabase
    .from(SCHEDULES_TABLE)
    .select(
      "id, user_id, subject_id, date, duration_mins, topics, completed, subjects(name)",
    )
    .eq("user_id", user.id)
    .eq("date", date)
    .order("duration_mins", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    scheduleRowToTask(row as ScheduleWithSubject),
  );
}

export async function fetchTodayScheduleTasks(): Promise<TodayScheduleTask[]> {
  return fetchSchedulesForDate(getTodayDateString());
}

export async function insertScheduleTask(
  input: CreateScheduleInput,
): Promise<TodayScheduleTask> {
  const topics = input.topics.trim();
  if (!topics) {
    throw new Error("Topic is required");
  }
  if (!Number.isFinite(input.durationMins) || input.durationMins < 1) {
    throw new Error("Duration must be at least 1 minute");
  }

  const { supabase, user } = await getAuthenticatedSupabase();

  const { data, error } = await supabase
    .from(SCHEDULES_TABLE)
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      date: input.date,
      duration_mins: Math.round(input.durationMins),
      topics,
      session_type: DEFAULT_SESSION_TYPE,
      completed: false,
    })
    .select(
      "id, user_id, subject_id, date, duration_mins, topics, completed, subjects(name)",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return scheduleRowToTask(data as ScheduleWithSubject);
}

export async function updateScheduleTaskCompleted(
  taskId: string,
  completed: boolean,
): Promise<void> {
  const { supabase, user } = await getAuthenticatedSupabase();

  const { error } = await supabase
    .from(SCHEDULES_TABLE)
    .update({ completed })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function resolveSubjectId(
  existingSubjectId: string | null,
  newSubjectName: string | null,
): Promise<string> {
  if (existingSubjectId) {
    return existingSubjectId;
  }

  if (newSubjectName?.trim()) {
    const created = await createSubject(newSubjectName);
    return created.id;
  }

  throw new Error("Select a subject or enter a new one");
}
