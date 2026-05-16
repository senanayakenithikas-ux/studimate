import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars for anon client (URL and anon key)",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars for server client (URL and service role or anon key)",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Resolves user id from a Supabase JWT or a stored user id (username login). */
export async function resolveUserIdFromToken(
  supabase: SupabaseClient,
  token: string,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (user?.id) {
    return user.id;
  }

  if (!UUID_RE.test(token)) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", token)
    .maybeSingle();

  return profile?.id ?? null;
}

/** Server client + user id from Bearer token (service role bypasses RLS when configured). */
export async function getAuthedSupabase(
  token: string,
): Promise<{ supabase: SupabaseClient; userId: string } | null> {
  const supabase = createServerClient();
  const userId = await resolveUserIdFromToken(supabase, token);
  if (!userId) return null;
  return { supabase, userId };
}
