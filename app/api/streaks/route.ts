import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { MOCK_STREAK } from "@/lib/mock-data";
import type { Streak } from "@/types";

export async function GET(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }
  return jsonOk(MOCK_STREAK);
}

export async function PATCH(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await request.json()) as Partial<Streak>;
  const updated: Streak = { ...MOCK_STREAK, ...body };
  return jsonOk(updated);
}
