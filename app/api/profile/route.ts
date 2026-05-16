import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { displayNameFromAuthUser } from "@/lib/auth-credentials";
import {
  createServerClient,
  resolveUserIdFromToken,
} from "@/lib/supabase-server";
import type { Profile } from "@/types";

/** Per-user onboarding flag until persisted in DB */
const onboardingByUserId = new Map<string, boolean>();

async function loadProfile(token: string): Promise<Profile | null> {
  const supabase = createServerClient();
  const userId = await resolveUserIdFromToken(supabase, token);
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", userId)
    .maybeSingle();

  if (!error && data) {
    return {
      id: data.id,
      username: data.username,
      displayName: data.username,
      onboardingComplete: onboardingByUserId.get(userId) ?? false,
    };
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser(token);

  if (!authUser) return null;

  const displayName = displayNameFromAuthUser(
    authUser.user_metadata as Record<string, unknown>,
    authUser.email ?? undefined,
  );

  return {
    id: authUser.id,
    username: displayName,
    displayName,
    onboardingComplete: onboardingByUserId.get(userId) ?? false,
  };
}

export async function GET(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const profile = await loadProfile(token);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  return jsonOk(profile);
}

export async function PATCH(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const existing = await loadProfile(token);
  if (!existing) {
    return jsonError("Profile not found", 404);
  }

  const body = (await request.json()) as Partial<Profile>;
  if (body.onboardingComplete !== undefined) {
    onboardingByUserId.set(existing.id, body.onboardingComplete);
  }

  const updated: Profile = {
    ...existing,
    ...body,
    displayName: existing.displayName,
    username: existing.username,
    onboardingComplete:
      body.onboardingComplete ?? existing.onboardingComplete,
  };

  return jsonOk(updated);
}
