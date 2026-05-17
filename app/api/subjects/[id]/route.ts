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
    return jsonError("Subject id is required", 400);
  }

  const { supabase, userId } = ctx;

  const { data: subject, error: fetchError } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return jsonError(fetchError.message, 500);
  }

  if (!subject) {
    return jsonError("Subject not found", 404);
  }

  const { data: materials, error: materialsListError } = await supabase
    .from("study_materials")
    .select("id")
    .eq("subject_id", id)
    .eq("user_id", userId);

  if (materialsListError) {
    return jsonError(materialsListError.message, 500);
  }

  for (const material of materials ?? []) {
    const deleted = await deleteStudyMaterialById(
      supabase,
      userId,
      String(material.id),
    );
    if (!deleted.ok) {
      return jsonError(deleted.message, deleted.status);
    }
  }

  const { error: schedulesError } = await supabase
    .from("schedules")
    .delete()
    .eq("subject_id", id)
    .eq("user_id", userId);

  if (schedulesError) {
    return jsonError(schedulesError.message, 500);
  }

  const { error: deleteError } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (deleteError) {
    return jsonError(deleteError.message, 500);
  }

  return jsonOk({ id });
}
