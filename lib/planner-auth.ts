import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PLANNER_FALLBACK_USER_ID =
  process.env.PLANNER_FALLBACK_USER_ID ??
  "00000000-0000-0000-0000-000000000000";

/** Service-role client for planner API only (bypasses RLS). */
export function createPlannerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for planner generation",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function decodeJwtSub(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(
      Buffer.from(padded, "base64").toString("utf8"),
    ) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

async function lookupUserIdByUuid(
  supabase: SupabaseClient,
  id: string,
): Promise<string | null> {
  if (!UUID_RE.test(id)) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  return profile?.id ?? null;
}

/**
 * Resolves user id for planner routes: verified JWT, JWT sub decode, UUID lookup,
 * then hackathon fallback UUID.
 */
export async function resolvePlannerUserId(
  supabase: SupabaseClient,
  token: string,
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (user?.id && !userError) {
    return user.id;
  }

  if (userError) {
    console.warn(
      "[planner-auth] getUser failed, trying fallbacks:",
      userError.message,
    );
  }

  const sub = decodeJwtSub(token);
  if (sub) {
    const fromSub = await lookupUserIdByUuid(supabase, sub);
    if (fromSub) return fromSub;
    if (UUID_RE.test(sub)) {
      console.warn("[planner-auth] using JWT sub without users row:", sub);
      return sub;
    }
  }

  const fromToken = await lookupUserIdByUuid(supabase, token);
  if (fromToken) return fromToken;

  console.warn(
    "[planner-auth] using fallback user id:",
    PLANNER_FALLBACK_USER_ID,
  );
  return PLANNER_FALLBACK_USER_ID;
}

/** Ensures a users row exists (for fallback / anonymous hackathon ids). */
export async function ensurePlannerUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return { error: null };
  }

  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      username: userId === PLANNER_FALLBACK_USER_ID ? "demo" : `user_${userId.slice(0, 8)}`,
    },
    { onConflict: "id" },
  );

  return { error: error?.message ?? null };
}
