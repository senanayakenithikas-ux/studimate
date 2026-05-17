import type { WeeklySchedule } from "@/types";

export interface PlannerSession {
  id: string;
  subject: string;
  topic: string;
  duration: number;
  startTime: string;
  completed: boolean;
}

export interface PlannerDaySchedule {
  day: string;
  date: string;
  sessions: PlannerSession[];
}

const DAY_NAME_TO_ABBREV: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun",
};

const WEEKDAY_INDEX_TO_ABBREV = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

function weekdayAbbrevFromDate(date: Date): string {
  return WEEKDAY_INDEX_TO_ABBREV[date.getDay()] ?? "Mon";
}

function formatLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Seven-day grid for a range starting on `rangeStart` (YYYY-MM-DD) with no sessions. */
export function emptyWeekDaySchedule(rangeStart: string): PlannerDaySchedule[] {
  return weeklyScheduleToDaySchedule({
    weekStart: rangeStart,
    slots: [],
  });
}

/** Seven consecutive days beginning at `weekly.weekStart` (today for the default plan). */
export function weeklyScheduleToDaySchedule(
  weekly: WeeklySchedule,
): PlannerDaySchedule[] {
  const [y, m, d] = weekly.weekStart.split("-").map(Number);
  const rangeStart = new Date(y, m - 1, d);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    const day = weekdayAbbrevFromDate(date);

    const sessions = weekly.slots
      .filter((slot) => {
        const abbrev =
          DAY_NAME_TO_ABBREV[slot.day] ?? slot.day.slice(0, 3);
        return abbrev === day;
      })
      .map((slot) => ({
        id: slot.scheduleId,
        subject: slot.subjectName,
        topic: slot.topic,
        duration: slot.durationMinutes,
        startTime: slot.time,
        completed: slot.completed,
      }));

    return {
      day,
      date: formatLocalDateString(date),
      sessions,
    };
  });
}
