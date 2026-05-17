/** Local calendar date as YYYY-MM-DD (matches planner schedule inserts). */
export function getTodayDateString(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().slice(0, 10);
}

/** Inclusive 7-day window: today through today + 6. */
export function getRollingPlanRange(): { start: string; end: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endRange = new Date(today);
  endRange.setDate(today.getDate() + 6);

  return {
    start: today.toISOString().slice(0, 10),
    end: endRange.toISOString().slice(0, 10),
  };
}
