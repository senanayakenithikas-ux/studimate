/** Local calendar date as YYYY-MM-DD (matches planner schedule inserts). */
export function getTodayDateString(): string {
  return formatDateString(new Date());
}

export function formatDateString(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday 00:00 local time for the week containing `date`. */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diff);
  return d;
}

export function parseLocalDateString(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function getMondayOfWeekString(dateStr: string): string {
  return formatDateString(getMondayOfWeek(parseLocalDateString(dateStr)));
}

/** Inclusive Mon–Sun range for a week that starts on the given Monday. */
export function getWeekRangeFromMonday(monday: Date): {
  start: string;
  end: string;
} {
  const start = getMondayOfWeek(monday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: formatDateString(start), end: formatDateString(end) };
}

/** Inclusive 7-day window: today through today + 6. */
export function getRollingPlanRange(): { start: string; end: string } {
  return getSevenDayRangeFromStart(new Date());
}

/** Inclusive 7-day window starting on `start` (local date or YYYY-MM-DD). */
export function getSevenDayRangeFromStart(start: Date | string): {
  start: string;
  end: string;
} {
  const startDate =
    typeof start === "string" ? parseLocalDateString(start) : new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    start: formatDateString(startDate),
    end: formatDateString(endDate),
  };
}
