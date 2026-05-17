import { jsonError, jsonOk } from "@/lib/api";
import { usernameToEmail } from "@/lib/auth-credentials";
import { createAnonClient, createServerClient } from "@/lib/supabase-server";
import type { LoginBody, User } from "@/types";

const INVALID_CREDENTIALS = "Invalid username or password";

interface UserAuthRow {
  id: string;
  username: string;
}

export async function POST(request: Request) {
  try {
    let body: LoginBody;
    try {
      body = (await request.json()) as LoginBody;
    } catch {
      return jsonError("Invalid request body", 400);
    }

    if (!body.username?.trim()) {
      return jsonError("Username is required", 400);
    }

    if (!body.password) {
      return jsonError("Password is required", 400);
    }

    const username = body.username.trim();
    const password = body.password;

    const admin = createServerClient();

    const { data: profile, error: profileLookupError } = await admin
      .from("users")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (profileLookupError) {
      return jsonError(profileLookupError.message, 500);
    }

    const row = profile as UserAuthRow | null;
    if (!row) {
      return jsonError(INVALID_CREDENTIALS, 401);
    }

    const email = usernameToEmail(username);
    const anon = createAnonClient();
    const { data, error } = await anon.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session?.access_token) {
      return jsonError(INVALID_CREDENTIALS, 401);
    }

    const user: User = {
      id: row.id,
      username: row.username,
    };

    return jsonOk({
      user,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return jsonError(message, 500);
  }
}
