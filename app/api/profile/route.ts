import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { MOCK_PROFILE } from "@/lib/mock-data";
import type { Profile } from "@/types";

export async function GET(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }
  return jsonOk(MOCK_PROFILE);
}

export async function PATCH(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await request.json()) as Partial<Profile>;
  const updated: Profile = {
    ...MOCK_PROFILE,
    ...body,
    onboardingComplete: body.onboardingComplete ?? true,
  };

  return jsonOk(updated);
}
