import type { Material } from "@/types";

export interface StudyMaterialRow {
  id: string;
  user_id: string;
  subject_id: string;
  filename: string;
  storage_url: string;
  extracted_text: string | null;
}

export function rowToMaterial(row: StudyMaterialRow): Material {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.filename,
    storageUrl: row.storage_url,
    extractedText: row.extracted_text ?? "",
    createdAt: "",
  };
}
