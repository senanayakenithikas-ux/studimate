import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data } satisfies ApiResponse<T>, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message } satisfies ApiResponse<never>, {
    status,
  });
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export function requireAuth(request: Request): string | null {
  const token = getBearerToken(request);
  if (!token) return null;
  return token;
}
