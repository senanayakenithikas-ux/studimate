/** Local calendar date as YYYY-MM-DD (matches planner schedule inserts). */
export function getTodayDateString(): string {
  return formatDateString(new Date());
}

export function formatDateString(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endRange = new Date(today);
  endRange.setDate(today.getDate() + 6);

  return {
    start: formatDateString(today),
    end: formatDateString(endRange),
  };
}
