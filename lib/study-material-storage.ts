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
