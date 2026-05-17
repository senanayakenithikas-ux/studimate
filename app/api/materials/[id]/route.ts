import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { getAuthedSupabase } from "@/lib/supabase-server";
import { deleteStudyMaterialById } from "@/lib/study-material-storage";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return jsonError("Material id is required", 400);
  }

  const result = await deleteStudyMaterialById(ctx.supabase, ctx.userId, id);

  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return jsonOk({ id: result.id });
}
