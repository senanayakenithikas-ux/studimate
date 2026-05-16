import { jsonError, jsonOk } from "@/lib/api";
import { usernameToEmail } from "@/lib/auth-credentials";
import { createAnonClient, createServerClient } from "@/lib/supabase-server";
import type { SignupBody, User } from "@/types";

const MIN_PASSWORD_LENGTH = 6;

export async function POST(request: Request) {
  try {
    let body: SignupBody;
    try {
      body = (await request.json()) as SignupBody;
    } catch {
      return jsonError("Invalid request body", 400);
    }

    if (!body.username?.trim()) {
      return jsonError("Username is required", 400);
    }

    if (!body.password || body.password.length < MIN_PASSWORD_LENGTH) {
      return jsonError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        400,
      );
    }

    const username = body.username.trim();
    const password = body.password;
    const email = usernameToEmail(username);
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

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });

    if (authError) {
      return jsonError(authError.message, 500);
    }

    if (!authData.user?.id) {
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

    const anon = createAnonClient();
    const { data: sessionData, error: signInError } =
      await anon.auth.signInWithPassword({ email, password });

    if (signInError || !sessionData.session?.access_token) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);
      const { error: deleteProfileError } = await admin
        .from("users")
        .delete()
        .eq("id", userId);
      if (deleteProfileError) {
        console.error("Failed to rollback user profile:", deleteProfileError.message);
      }
      return jsonError("Signup failed", 500);
    }

    const user: User = {
      id: userId,
      username,
    };

    return jsonOk(
      {
        user,
        token: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
      },
      201,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return jsonError(message, 500);
  }
}
