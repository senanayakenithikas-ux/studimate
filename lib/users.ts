import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserProfileRow {
  id: string;
  username: string;
}

export async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ profile: UserProfileRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  if (!data) {
    return { profile: null, error: null };
  }

  return {
    profile: {
      id: String(data.id),
      username: String(data.username),
    },
    error: null,
  };
}
