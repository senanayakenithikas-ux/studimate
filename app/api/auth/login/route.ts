import { jsonError, jsonOk } from "@/lib/api";
import { createServerClient } from "@/lib/supabase-server";
import type { LoginBody, User } from "@/types";

export async function POST(request: Request) {
  try {
    let body: LoginBody;
    try {
      body = (await request.json()) as LoginBody;
    } catch {
      return jsonError("Invalid request body", 400);
    }

    if (!body.username?.trim()) {
      return jsonError("Username is required");
    }

    const username = body.username.trim();
    const supabase = createServerClient();

    const { data: profile, error: profileLookupError } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (profileLookupError) {
      return jsonError(profileLookupError.message, 500);
    }

    if (!profile) {
      return jsonError("You have not signed up yet.", 401);
    }

    const user: User = {
      id: profile.id,
      username: profile.username,
    };

    return jsonOk({ user, token: profile.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return jsonError(message, 500);
  }
}
