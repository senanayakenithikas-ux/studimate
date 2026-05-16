import type { SupabaseClient } from "@supabase/supabase-js";
import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { getAuthedSupabase } from "@/lib/supabase-server";
import type { Streak } from "@/types";

interface StreakRow {
  id: string;
  user_id: string;
  current_streak: number;
  last_study_date: string | null;
  total_days: number;
}

function rowToStreak(row: StreakRow): Streak {
  return {
    current: row.current_streak ?? 0,
    longest: row.total_days ?? 0,
    lastStudyDate: row.last_study_date
      ? String(row.last_study_date).slice(0, 10)
      : null,
  };
}

async function getOrCreateStreakRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ row: StreakRow | null; error: string | null }> {
  const { data: existing, error: fetchError } = await supabase
    .from("streaks")
    .select("id, user_id, current_streak, last_study_date, total_days")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return { row: null, error: fetchError.message };
  }

  if (existing) {
    return { row: existing as StreakRow, error: null };
  }

  const { data: created, error: insertError } = await supabase
    .from("streaks")
    .insert({ user_id: userId })
    .select("id, user_id, current_streak, last_study_date, total_days")
    .single();

  if (insertError) {
    return { row: null, error: insertError.message };
  }

  return { row: created as StreakRow, error: null };
}

export async function GET(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  const { row, error } = await getOrCreateStreakRow(ctx.supabase, ctx.userId);
  if (error || !row) {
    return jsonError(error ?? "Failed to load streak", 500);
  }

  return jsonOk(rowToStreak(row));
}

export async function PATCH(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  let body: Partial<Streak>;
  try {
    body = (await request.json()) as Partial<Streak>;
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const { row: existing, error: loadError } = await getOrCreateStreakRow(
    ctx.supabase,
    ctx.userId,
  );
  if (loadError || !existing) {
    return jsonError(loadError ?? "Failed to load streak", 500);
  }

  const updates: Record<string, number | string | null> = {};

  if (body.current !== undefined) {
    if (!Number.isInteger(body.current) || body.current < 0) {
      return jsonError("current must be a non-negative integer");
    }
    updates.current_streak = body.current;
  }

  if (body.longest !== undefined) {
    if (!Number.isInteger(body.longest) || body.longest < 0) {
      return jsonError("longest must be a non-negative integer");
    }
    updates.total_days = body.longest;
  }

  if (body.lastStudyDate !== undefined) {
    if (body.lastStudyDate === null) {
      updates.last_study_date = null;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(body.lastStudyDate)) {
      return jsonError("lastStudyDate must be YYYY-MM-DD or null");
    } else {
      updates.last_study_date = body.lastStudyDate;
    }
  }

  if (Object.keys(updates).length === 0) {
    return jsonOk(rowToStreak(existing));
  }

  const { data, error } = await ctx.supabase
    .from("streaks")
    .update(updates)
    .eq("user_id", ctx.userId)
    .select("id, user_id, current_streak, last_study_date, total_days")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk(rowToStreak(data as StreakRow));
}
