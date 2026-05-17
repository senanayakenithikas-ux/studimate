import { createClient } from "@/lib/supabase/client";
import type { ApiResponse } from "@/types";

async function resolveAccessToken(): Promise<string | null> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  const expiresAt = session.expires_at;
  if (expiresAt) {
    const expiresMs = expiresAt * 1000;
    const refreshThresholdMs = 60_000;
    if (expiresMs - Date.now() < refreshThresholdMs) {
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      if (!refreshError && refreshed.session?.access_token) {
        return refreshed.session.access_token;
      }
    }
  }

  return session.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = await resolveAccessToken();

  if (!accessToken) {
    throw new Error("Please sign in again");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...options, headers });
  const raw = await res.text();

  let json: ApiResponse<T>;
  try {
    json = raw ? (JSON.parse(raw) as ApiResponse<T>) : {};
  } catch {
    throw new Error(
      res.ok
        ? "Invalid server response"
        : `Request failed (${res.status})`,
    );
  }

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }

  return json.data as T;
}
