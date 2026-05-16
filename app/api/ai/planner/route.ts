import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { mockWeeklySchedule } from "@/lib/minimax";

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }

  return jsonOk(mockWeeklySchedule());
}
