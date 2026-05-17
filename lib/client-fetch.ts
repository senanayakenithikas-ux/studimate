import { createClient } from "@/lib/supabase/client";
import type { ApiResponse } from "@/types";

const REFRESH_THRESHOLD_MS = 60_000;

let cachedToken: string | null = null;
let cachedExpiresAtMs: number | null = null;
let resolveInFlight: Promise<string | null> | null = null;

export function clearAccessTokenCache(): void {
  cachedToken = null;
  cachedExpiresAtMs = null;
  resolveInFlight = null;
}

function isCachedTokenValid(): boolean {
  if (!cachedToken || cachedExpiresAtMs === null) {
    return false;
  }
  return cachedExpiresAtMs - Date.now() > REFRESH_THRESHOLD_MS;
}

async function resolveAccessToken(): Promise<string | null> {
  if (isCachedTokenValid()) {
    return cachedToken;
  }

  if (resolveInFlight) {
    return resolveInFlight;
  }

  resolveInFlight = (async () => {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      clearAccessTokenCache();
      return null;
    }

    let accessToken = session.access_token;
    let expiresAt = session.expires_at;

    if (expiresAt) {
      const expiresMs = expiresAt * 1000;
      if (expiresMs - Date.now() < REFRESH_THRESHOLD_MS) {
        const { data: refreshed, error: refreshError } =
          await supabase.auth.refreshSession();
        if (!refreshError && refreshed.session?.access_token) {
          accessToken = refreshed.session.access_token;
          expiresAt = refreshed.session.expires_at ?? expiresAt;
        }
      }
    }

    cachedToken = accessToken;
    cachedExpiresAtMs = expiresAt ? expiresAt * 1000 : Date.now() + 3_600_000;

    return accessToken;
  })();

  try {
    return await resolveInFlight;
  } finally {
    resolveInFlight = null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return apiFetchWithRetry<T>(path, options, false);
}

async function apiFetchWithRetry<T>(
  path: string,
  options: RequestInit,
  isRetry: boolean,
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

  if (res.status === 401 && !isRetry) {
    clearAccessTokenCache();
    return apiFetchWithRetry<T>(path, options, true);
  }

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }

  return json.data as T;
}
