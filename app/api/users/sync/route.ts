import { jsonError, jsonOk } from "@/lib/api";
import { displayNameFromAuthUser } from "@/lib/auth-credentials";
import { createServerClient } from "@/lib/supabase-server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

  return jsonOk({ id: user.id, username });
}
