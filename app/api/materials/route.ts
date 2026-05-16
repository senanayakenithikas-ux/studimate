import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { extractTextFromPdf } from "@/lib/pdf-parse";
import type { Material } from "@/types";

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return jsonError("Unauthorized", 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const subjectId = String(formData.get("subjectId") ?? "");
  const title = String(formData.get("title") ?? "Uploaded material");

  if (!subjectId) {
    return jsonError("subjectId is required");
  }

  let extractedText =
    "Sample extracted text — upload a PDF to extract real content.";

  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      extractedText = await extractTextFromPdf(buffer);
    } catch {
      return jsonError("Failed to parse PDF");
    }
  }

  const material: Material = {
    id: `mat-${Date.now()}`,
    subjectId,
    title,
    extractedText,
    createdAt: new Date().toISOString(),
  };

  return jsonOk(material, 201);
}
