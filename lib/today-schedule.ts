import type { SupabaseClient } from "@supabase/supabase-js";
import { getTodayDateString } from "@/lib/planner-dates";
import type { TodayScheduleTask } from "@/types";

/** Production table: `schedules` (spec alias: `schedule`). */
const SCHEDULE_TABLE = "schedules";

interface ScheduleRow {
  id: string;
  topics: string;
  duration_mins: number;
  completed: boolean;
  subjects: { name: string } | { name: string }[] | null;
}

function rowToTask(row: ScheduleRow): TodayScheduleTask {
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

export async function fetchTodayScheduleTasks(
  supabase: SupabaseClient,
): Promise<TodayScheduleTask[]> {
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from(SCHEDULE_TABLE)
    .select("id, topics, duration_mins, completed, subjects(name)")
    .eq("date", today)
    .order("duration_mins", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => rowToTask(row as ScheduleRow));
}

export async function updateScheduleTaskCompleted(
  supabase: SupabaseClient,
  id: string,
  completed: boolean,
): Promise<void> {
  const { error } = await supabase
    .from(SCHEDULE_TABLE)
    .update({ completed })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
