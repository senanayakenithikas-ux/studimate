import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { getAuthedSupabase } from "@/lib/supabase-server";

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

  const { error: materialsError } = await supabase
    .from("study_materials")
    .delete()
    .eq("subject_id", id)
    .eq("user_id", userId);

  if (materialsError) {
    return jsonError(materialsError.message, 500);
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
