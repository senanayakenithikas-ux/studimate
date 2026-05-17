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

const DAY_ABBREVS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

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

export function weeklyScheduleToDaySchedule(
  weekly: WeeklySchedule,
): PlannerDaySchedule[] {
  const [y, m, d] = weekly.weekStart.split("-").map(Number);
  const weekStart = new Date(y, m - 1, d);

  return DAY_ABBREVS.map((day, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

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
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      sessions,
    };
  });
}
