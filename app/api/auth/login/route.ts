import { jsonError, jsonOk } from "@/lib/api";
import type { LoginBody, User } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;

  if (!body.username?.trim() || !body.password) {
    return jsonError("Username and password are required");
  }

  const user: User = {
    id: "user-1",
    username: body.username.trim(),
  };

  return jsonOk({ user, token: "stub-token" });
}
