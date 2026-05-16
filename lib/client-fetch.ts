import { getAuthToken } from "@/lib/auth";
import type { ApiResponse } from "@/types";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...options, headers });
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || json.error) {
    throw new Error(json.error ?? "Request failed");
  }

  return json.data as T;
}
