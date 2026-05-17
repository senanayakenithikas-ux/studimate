import type { SupabaseClient } from "@supabase/supabase-js";
import { generateStudyMaterialSummary } from "@/lib/minimax";
import {
  downloadStudyMaterialText,
  STUDY_MATERIALS_BUCKET,
  type StudyMaterialStorageRow,
} from "@/lib/study-material-storage";

/** Full text longer than this is summarized before AI prompts. */
export const STUDY_MATERIAL_SUMMARY_THRESHOLD = 8_000;

export const TUTOR_PROMPT_MAX_CHARS = 8_000;
export const QUIZ_PROMPT_MAX_CHARS = 12_000;
export const PLANNER_PROMPT_MAX_CHARS = 4_000;

interface SummaryCachePayload {
  sourceLength: number;
  summary: string;
}

function summaryStoragePath(userId: string, materialId: string): string {
  return `${userId}/summaries/${materialId}.json`;
}

async function loadSummaryCache(
  supabase: SupabaseClient,
  userId: string,
  materialId: string,
  sourceLength: number,
): Promise<string | null> {
  const path = summaryStoragePath(userId, materialId);
  const { data, error } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .download(path);

  if (error || !data) {
    return null;
  }

  try {
    const raw = await data.text();
    const parsed = JSON.parse(raw) as SummaryCachePayload;
    if (
      parsed.sourceLength === sourceLength &&
      typeof parsed.summary === "string" &&
      parsed.summary.trim().length > 0
    ) {
      return parsed.summary.trim();
    }
  } catch {
    return null;
  }

  return null;
}

async function saveSummaryCache(
  supabase: SupabaseClient,
  userId: string,
  materialId: string,
  sourceLength: number,
  summary: string,
): Promise<void> {
  const path = summaryStoragePath(userId, materialId);
  const payload: SummaryCachePayload = { sourceLength, summary };
  const body = JSON.stringify(payload);

  await supabase.storage.from(STUDY_MATERIALS_BUCKET).upload(path, body, {
    contentType: "application/json",
    upsert: true,
  });
}

/**
 * Text for AI prompts: full excerpt for short PDFs, cached structured summary for long ones.
 * Summaries live in storage (not new DB columns). Full text stays in extracted_text.
 */
export async function resolveStudyMaterialPromptText(
  supabase: SupabaseClient,
  row: StudyMaterialStorageRow,
  maxChars: number,
): Promise<string> {
  const fullText = (await downloadStudyMaterialText(supabase, row)).trim();
  if (!fullText) {
    return "";
  }

  if (fullText.length <= STUDY_MATERIAL_SUMMARY_THRESHOLD) {
    return fullText.slice(0, maxChars);
  }

  let summary =
    (await loadSummaryCache(supabase, row.user_id, row.id, fullText.length)) ??
    "";

  if (!summary) {
    summary = (
      await generateStudyMaterialSummary(fullText, row.filename)
    ).trim();
    if (summary) {
      await saveSummaryCache(
        supabase,
        row.user_id,
        row.id,
        fullText.length,
        summary,
      );
    }
  }

  const promptBody = summary || fullText;
  return promptBody.slice(0, maxChars);
}
