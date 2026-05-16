import { randomUUID } from "node:crypto";
import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { extractTextFromPdf } from "@/lib/pdf-parse";
import {
  createServerClient,
  resolveUserIdFromToken,
} from "@/lib/supabase-server";

export const runtime = "nodejs";

const BUCKET = "study-materials";

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, "");
  return base.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload.pdf";
}

function isPdf(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

export async function POST(request: Request) {
  const token = requireAuth(request);
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const supabase = createServerClient();
  const userId = await resolveUserIdFromToken(supabase, token);

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const subjectId = String(
    formData.get("subject_id") ?? formData.get("subjectId") ?? "",
  ).trim();

  if (!subjectId) {
    return jsonError("subject_id is required");
  }

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("file is required");
  }

  if (!isPdf(file)) {
    return jsonError("Only PDF files are supported");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let extractedText: string;
  try {
    extractedText = await extractTextFromPdf(buffer);
  } catch {
    return jsonError("Failed to parse PDF", 400);
  }

  const objectPath = `${userId}/${randomUUID()}-${sanitizeFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return jsonError(uploadError.message, 500);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  const { data, error: insertError } = await supabase
    .from("study_materials")
    .insert({
      user_id: userId,
      subject_id: subjectId,
      filename: file.name,
      storage_url: publicUrl,
      extracted_text: extractedText,
    })
    .select()
    .single();

  if (insertError) {
    return jsonError(insertError.message, 500);
  }

  return jsonOk(data, 201);
}
