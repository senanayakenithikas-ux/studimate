import { jsonError, jsonOk } from "@/lib/api";
import { createAnonClient, createServerClient } from "@/lib/supabase-server";
import type { SignupBody, User } from "@/types";

export async function POST(request: Request) {
  try {
    let body: SignupBody;
    try {
      body = (await request.json()) as SignupBody;
    } catch {
      return jsonError("Invalid request body", 400);
    }

    if (!body.username?.trim()) {
      return jsonError("Username is required");
    }

    const username = body.username.trim();
    const admin = createServerClient();

    const { data: existing, error: existingLookupError } = await admin
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingLookupError) {
      return jsonError(existingLookupError.message, 500);
    }

    if (existing) {
      return jsonError("An account with this username already exists.");
    }

    const anon = createAnonClient();
    const { data: authData, error: authError } = await anon.auth.signInAnonymously({
      options: { data: { username } },
    });

    if (authError) {
      return jsonError(authError.message, 500);
    }

    if (!authData.user?.id || !authData.session?.access_token) {
      return jsonError("Signup failed", 500);
    }

    const userId = authData.user.id;

    const { error: profileError } = await admin.from("users").insert({
      id: userId,
      username,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);
      return jsonError(profileError.message, 500);
    }

    const user: User = {
      id: userId,
      username,
    };

    return jsonOk({ user, token: authData.session.access_token }, 201);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return jsonError(message, 500);
  }
}
