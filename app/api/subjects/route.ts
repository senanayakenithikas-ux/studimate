import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { MOCK_SUBJECTS } from "@/lib/mock-data";
import type { Subject } from "@/types";

export async function GET(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }
  return jsonOk(MOCK_SUBJECTS);
}

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await request.json()) as Omit<Subject, "id">;
  if (!body.name?.trim()) {
    return jsonError("Subject name is required");
  }

  const subject: Subject = {
    id: `sub-${Date.now()}`,
    name: body.name.trim(),
    examDate: body.examDate ?? new Date().toISOString().slice(0, 10),
    confidence: body.confidence ?? 3,
  };

  return jsonOk(subject, 201);
}
