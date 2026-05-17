import { jsonError, jsonOk, getBearerToken } from "@/lib/api";
import { displayNameFromAuthUser } from "@/lib/auth-credentials";
import { syncUserStreak } from "@/lib/user-streak-sync";
import { createServerClient } from "@/lib/supabase-server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

async function resolveAuthUser(request: Request): Promise<User | null> {
  const admin = createServerClient();
  const bearer = getBearerToken(request);

  if (bearer) {
    const {
      data: { user },
    } = await admin.auth.getUser(bearer);
    if (user) return user;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function POST(request: Request) {
  const user = await resolveAuthUser(request);

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const username =
    displayNameFromAuthUser(
      user.user_metadata as Record<string, unknown>,
      user.email ?? undefined,
    ) || `user_${user.id.slice(0, 8)}`;

  const admin = createServerClient();

  const { error: upsertError } = await admin.from("users").upsert(
    {
      id: user.id,
      username,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    return jsonError(upsertError.message, 500);
  }

  const { streakCount, error: streakError } = await syncUserStreak(
    admin,
    user.id,
  );

  if (streakError) {
    return jsonError(streakError, 500);
  }

  return jsonOk({ id: user.id, username, streak_count: streakCount });
}
