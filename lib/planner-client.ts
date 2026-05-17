import { apiFetch } from "@/lib/client-fetch";
import type { WeeklySchedule } from "@/types";

/** Load the user's saved schedule for the current plan window (read-only). */
export function fetchSavedPlannerSchedule(): Promise<WeeklySchedule> {
  return apiFetch<WeeklySchedule>("/api/ai/planner");
}

/** Generate a new schedule when none exists (no overwrite). */
export function generatePlannerSchedule(): Promise<WeeklySchedule> {
  return apiFetch<WeeklySchedule>("/api/ai/planner", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Regenerate / update the schedule (AI + DB replace of incomplete rows). */
export function updatePlannerSchedule(): Promise<WeeklySchedule> {
  return apiFetch<WeeklySchedule>("/api/ai/planner", {
    method: "POST",
    body: JSON.stringify({ regenerate: true }),
  });
}

/** Load saved sessions for a 7-day window starting on rangeStart (YYYY-MM-DD). */
export function fetchPlannerScheduleForWeek(
  weekStart: string,
): Promise<WeeklySchedule> {
  return apiFetch<WeeklySchedule>("/api/ai/planner", {
    method: "POST",
    body: JSON.stringify({ weekStart }),
  });
}

export function weeklyScheduleHasSessions(weekly: WeeklySchedule): boolean {
  return weekly.slots.length > 0;
}
