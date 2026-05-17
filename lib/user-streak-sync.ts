import type { SupabaseClient } from "@supabase/supabase-js";
import { computeLoginStreak } from "@/lib/streak-login";

export interface StreaksRow {
  current_streak: number | null;
  last_study_date: string | null;
}

/** Ensures a row exists in `streaks` and updates login streak on each sync. */
export async function syncUserStreak(
  admin: SupabaseClient,
  userId: string,
): Promise<{ streakCount: number; error: string | null }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing, error: fetchError } = await admin
    .from("streaks")
    .select("current_streak, last_study_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return { streakCount: 0, error: fetchError.message };
  }

  if (!existing) {
    const { error: insertError } = await admin.from("streaks").insert({
      user_id: userId,
      current_streak: 1,
      last_study_date: today,
    });

    if (insertError) {
      return { streakCount: 0, error: insertError.message };
    }

    return { streakCount: 1, error: null };
  }

  const row = existing as StreaksRow;
  const currentStreak = row.current_streak ?? 0;
  const lastLogin = row.last_study_date
    ? new Date(`${String(row.last_study_date).slice(0, 10)}T00:00:00.000Z`)
    : null;
  const { streakCount } = computeLoginStreak(currentStreak, lastLogin);

  const { error: updateError } = await admin
    .from("streaks")
    .update({
      current_streak: streakCount,
      last_study_date: today,
    })
    .eq("user_id", userId);

  if (updateError) {
    return { streakCount: 0, error: updateError.message };
  }

  return { streakCount, error: null };
}
