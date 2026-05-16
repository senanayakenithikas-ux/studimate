/** UTC calendar date key YYYY-MM-DD */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Whole calendar days from lastLogin to now (midnight-to-midnight, UTC). */
export function calendarDayDiff(lastLogin: Date, now: Date): number {
  const lastKey = toDateKey(lastLogin);
  const nowKey = toDateKey(now);
  const lastMs = Date.parse(`${lastKey}T00:00:00.000Z`);
  const nowMs = Date.parse(`${nowKey}T00:00:00.000Z`);
  return Math.round((nowMs - lastMs) / (24 * 60 * 60 * 1000));
}

export function computeLoginStreak(
  currentStreak: number,
  lastLoginDate: Date | null,
  now: Date = new Date(),
): { streakCount: number } {
  if (lastLoginDate === null) {
    return { streakCount: 1 };
  }

  const diff = calendarDayDiff(lastLoginDate, now);

  if (diff <= 0) {
    return { streakCount: currentStreak };
  }
  if (diff === 1) {
    return { streakCount: currentStreak + 1 };
  }
  return { streakCount: 1 };
}
