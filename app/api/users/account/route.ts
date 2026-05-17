import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { deleteUserAccount } from "@/lib/delete-user-account";
import {
  createServerClient,
  resolveUserIdFromToken,
} from "@/lib/supabase-server";

export async function DELETE(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createServerClient();
  const userId = await resolveUserIdFromToken(admin, token);

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const result = await deleteUserAccount(admin, userId);

  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return jsonOk({ deleted: true, id: result.userId });
}
