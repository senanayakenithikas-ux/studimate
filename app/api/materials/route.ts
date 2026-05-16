import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { rowToMaterial, type StudyMaterialRow } from "@/lib/materials";
import { getAuthedSupabase } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    return jsonError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const subjectId = (
    searchParams.get("subject_id") ?? searchParams.get("subjectId") ?? ""
  ).trim();
  const listAll =
    searchParams.get("all") === "true" || searchParams.get("all") === "1";

  if (!listAll && !subjectId) {
    return jsonError("subject_id is required");
  }

  let query = ctx.supabase
    .from("study_materials")
    .select("id, user_id, subject_id, filename, storage_url, extracted_text")
    .eq("user_id", ctx.userId)
    .order("filename", { ascending: true });

  if (!listAll) {
    query = query.eq("subject_id", subjectId);
  }

  const { data, error } = await query;

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk(
    (data ?? []).map((row) => rowToMaterial(row as StudyMaterialRow)),
  );
}
