import { jsonError, jsonOk, requireAuth } from "@/lib/api";

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await request.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return jsonError("sessionId is required");
  }

  return jsonOk({ completed: true, sessionId: body.sessionId });
}
