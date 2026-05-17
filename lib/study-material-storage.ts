import type { SupabaseClient } from "@supabase/supabase-js";
import { isUsableStudyText } from "@/lib/minimax";

export const STUDY_MATERIALS_BUCKET = "study-materials";

export interface StudyMaterialStorageRow {
  id: string;
  user_id: string;
  filename: string;
  storage_url: string;
  extracted_text: string;
  file_path?: string | null;
}

export function storagePathFromPublicUrl(storageUrl: string): string | null {
  const trimmed = storageUrl.trim();
  if (!trimmed) return null;

  const marker = `/storage/v1/object/public/${STUDY_MATERIALS_BUCKET}/`;
  const publicIdx = trimmed.indexOf(marker);
  if (publicIdx !== -1) {
    return decodeURIComponent(trimmed.slice(publicIdx + marker.length));
  }

  const signMarker = `/storage/v1/object/sign/${STUDY_MATERIALS_BUCKET}/`;
  const signIdx = trimmed.indexOf(signMarker);
  if (signIdx !== -1) {
    const rest = trimmed.slice(signIdx + signMarker.length);
    const pathOnly = rest.split("?")[0];
    return decodeURIComponent(pathOnly);
  }

  return null;
}

export function resolveStoragePath(row: StudyMaterialStorageRow): string | null {
  const explicit = row.file_path?.trim();
  if (explicit) return explicit;

  return storagePathFromPublicUrl(row.storage_url);
}

async function bufferFromBlob(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const { extractPdfText } = await import("@/lib/pdf-parse-server");
    return extractPdfText(buffer);
  }

  if (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv")
  ) {
    return buffer.toString("utf-8");
  }

  return buffer.toString("utf-8");
}

export async function downloadStudyMaterialText(
  supabase: SupabaseClient,
  row: StudyMaterialStorageRow,
  options?: { cacheExtractedText?: boolean },
): Promise<string> {
  const cached = row.extracted_text?.trim() ?? "";
  if (isUsableStudyText(cached)) {
    return cached;
  }

  const objectPath = resolveStoragePath(row);
  if (!objectPath) {
    throw new Error("Could not resolve storage path for study material");
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .download(objectPath);

  if (downloadError || !fileBlob) {
    throw new Error(
      downloadError?.message ?? "Failed to download study material from storage",
    );
  }

  const buffer = await bufferFromBlob(fileBlob);
  const extracted = (await extractTextFromBuffer(buffer, row.filename)).trim();

  if (options?.cacheExtractedText !== false && isUsableStudyText(extracted)) {
    await supabase
      .from("study_materials")
      .update({ extracted_text: extracted })
      .eq("id", row.id)
      .eq("user_id", row.user_id);
  }

  return extracted;
}

export type DeleteStudyMaterialResult =
  | { ok: true; id: string }
  | { ok: false; message: string; status: number };

/** Removes storage object, related quizzes/sessions, and the study_materials row. */
export async function deleteStudyMaterialById(
  supabase: SupabaseClient,
  userId: string,
  materialId: string,
): Promise<DeleteStudyMaterialResult> {
  const { data: row, error: fetchError } = await supabase
    .from("study_materials")
    .select("id, user_id, filename, storage_url, extracted_text, file_path")
    .eq("id", materialId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message, status: 500 };
  }

  if (!row) {
    return { ok: false, message: "Material not found", status: 404 };
  }

  const storageRow = mapStudyMaterialStorageRow(
    row as Record<string, unknown>,
  );
  const objectPath = resolveStoragePath(storageRow);

  if (objectPath) {
    const { error: storageError } = await supabase.storage
      .from(STUDY_MATERIALS_BUCKET)
      .remove([objectPath]);

    if (storageError) {
      console.warn(
        `[deleteStudyMaterial] storage remove failed for ${materialId}:`,
        storageError.message,
      );
    }
  }

  const { error: quizzesError } = await supabase
    .from("quizzes")
    .delete()
    .eq("material_id", materialId)
    .eq("user_id", userId);

  if (quizzesError) {
    return { ok: false, message: quizzesError.message, status: 500 };
  }

  const { error: sessionsError } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("material_id", materialId)
    .eq("user_id", userId);

  if (sessionsError) {
    return { ok: false, message: sessionsError.message, status: 500 };
  }

  const { error: deleteError } = await supabase
    .from("study_materials")
    .delete()
    .eq("id", materialId)
    .eq("user_id", userId);

  if (deleteError) {
    return { ok: false, message: deleteError.message, status: 500 };
  }

  return { ok: true, id: materialId };
}

export function mapStudyMaterialStorageRow(
  row: Record<string, unknown>,
): StudyMaterialStorageRow {
  const filePath = row.file_path;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    filename: String(row.filename ?? ""),
    storage_url: String(row.storage_url ?? ""),
    extracted_text: String(row.extracted_text ?? ""),
    file_path:
      filePath === null || filePath === undefined
        ? null
        : String(filePath),
  };
}
