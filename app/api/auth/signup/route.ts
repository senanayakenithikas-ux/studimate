import { jsonError, jsonOk } from "@/lib/api";
import type { SignupBody, User } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as SignupBody;

  if (!body.username?.trim() || !body.password) {
    return jsonError("Username and password are required");
  }

  if (body.password.length < 6) {
    return jsonError("Password must be at least 6 characters");
  }

  const user: User = {
    id: "user-1",
    username: body.username.trim(),
  };

  return jsonOk({ user, token: "stub-token" });
}
