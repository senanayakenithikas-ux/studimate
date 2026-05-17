import { apiFetch } from "@/lib/client-fetch";
import type { TodayScheduleTask } from "@/types";

export async function fetchTodayScheduleTasks(): Promise<TodayScheduleTask[]> {
  return apiFetch<TodayScheduleTask[]>("/api/sessions");
}

export async function updateScheduleTaskCompleted(
  id: string,
  completed: boolean,
): Promise<void> {
  await apiFetch<{ completed: boolean; sessionId: string }>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ sessionId: id, completed }),
  });
}
