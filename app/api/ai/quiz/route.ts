import { jsonOk } from "@/lib/api";
import {
  generateQuiz,
  getMiniMaxErrorMessage,
  isUsableStudyText,
  PDF_NOT_SUITABLE_FOR_QUIZ,
  PDF_NOT_SUITABLE_MESSAGE,
  PdfNotSuitableForQuizError,
} from "@/lib/minimax";
import { logMiniMaxEnvStatus } from "@/lib/minimax-env";
import {
  buildQuizMiniMaxPrompt,
  formatQuizPromptForLog,
} from "@/lib/quiz-minimax-prompt";
import {
  downloadStudyMaterialText,
  mapStudyMaterialStorageRow,
} from "@/lib/study-material-storage";
import { getAuthedSupabase } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { QuizQuestion } from "@/types";

export const runtime = "nodejs";

interface PostQuizBody {
  material_id?: string;
  materialId?: string;
}

interface PatchQuizBody {
  quiz_id?: string;
  score?: number;
}

interface QuizRecord {
  id: string;
  user_id: string;
  material_id: string;
  questions: QuizQuestion[];
  score: number | null;
  completed_at: string | null;
}

function errorResponse(
  message: string,
  status: number,
  code?: string,
): NextResponse {
  return NextResponse.json(
    { error: message, ...(code ? { code } : {}) },
    { status },
  );
}

function pdfNotSuitableResponse(): NextResponse {
  return errorResponse(
    PDF_NOT_SUITABLE_MESSAGE,
    400,
    PDF_NOT_SUITABLE_FOR_QUIZ,
  );
}

function shouldIncludeQuizPromptDebug(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_QUIZ_PROMPT === "true"
  );
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.question === "string" &&
    Array.isArray(row.options) &&
    row.options.every((opt) => typeof opt === "string") &&
    typeof row.correctIndex === "number"
  );
}

function parseQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value) || !value.every(isQuizQuestion)) {
    throw new Error("Invalid questions format in quiz record");
  }
  return value;
}

function mapQuizRow(row: Record<string, unknown>): QuizRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    material_id: String(row.material_id),
    questions: parseQuestions(row.questions),
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    completed_at:
      row.completed_at === null || row.completed_at === undefined
        ? null
        : String(row.completed_at),
  };
}

async function authenticate(
  request: Request,
): Promise<{ supabase: SupabaseClient; userId: string }> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new Error("Unauthorized");
  }

  const ctx = await getAuthedSupabase(token);
  if (!ctx) {
    throw new Error("Unauthorized");
  }

  return ctx;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { supabase, userId } = await authenticate(request);
    const body = (await request.json().catch(() => ({}))) as PostQuizBody;

    const materialId = (body.material_id ?? body.materialId)?.trim();
    if (!materialId) {
      return errorResponse("material_id is required", 400);
    }

    const { data: materialRow, error: materialError } = await supabase
      .from("study_materials")
      .select("id, user_id, filename, storage_url, extracted_text")
      .eq("id", materialId)
      .eq("user_id", userId)
      .single();

    if (materialError || !materialRow) {
      return errorResponse("Study material not found", 404);
    }

    const material = mapStudyMaterialStorageRow(
      materialRow as Record<string, unknown>,
    );

    let studyText: string;
    try {
      studyText = await downloadStudyMaterialText(supabase, material);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load study material";
      return errorResponse(message, 502);
    }

    if (!isUsableStudyText(studyText)) {
      return pdfNotSuitableResponse();
    }

    const { error: cleanupError } = await supabase
      .from("quizzes")
      .delete()
      .eq("material_id", materialId)
      .eq("user_id", userId)
      .is("completed_at", null);

    if (cleanupError) {
      return errorResponse(cleanupError.message, 500);
    }

    logMiniMaxEnvStatus("quiz");

    const promptPreview = buildQuizMiniMaxPrompt(studyText);
    const includePromptDebug = shouldIncludeQuizPromptDebug();
    if (includePromptDebug) {
      console.log(formatQuizPromptForLog(promptPreview));
    }

    let questions: QuizQuestion[];
    try {
      questions = await generateQuiz(studyText);
    } catch (error) {
      if (error instanceof PdfNotSuitableForQuizError) {
        return pdfNotSuitableResponse();
      }
      return errorResponse(getMiniMaxErrorMessage(error), 502);
    }

    if (!questions.every(isQuizQuestion)) {
      return errorResponse("Generated quiz has invalid question format", 502);
    }

    const { data: savedRow, error: insertError } = await supabase
      .from("quizzes")
      .insert({
        user_id: userId,
        material_id: materialId,
        questions,
        score: null,
        completed_at: null,
      })
      .select("id, user_id, material_id, questions, score, completed_at")
      .single();

    if (insertError || !savedRow) {
      return errorResponse(insertError?.message ?? "Failed to save quiz", 500);
    }

    const quiz = mapQuizRow(savedRow as Record<string, unknown>);

    return jsonOk({
      questions: quiz.questions,
      quiz_id: quiz.id,
      ...(includePromptDebug ? { debug_prompt: promptPreview } : {}),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (message.includes("MiniMax") || message.includes("generateQuiz")) {
      return errorResponse(getMiniMaxErrorMessage(error), 502);
    }
    return errorResponse(message, 500);
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const { supabase, userId } = await authenticate(request);
    const body = (await request.json().catch(() => ({}))) as PatchQuizBody;

    const quizId = body.quiz_id?.trim();
    if (!quizId) {
      return errorResponse("quiz_id is required", 400);
    }

    if (typeof body.score !== "number" || Number.isNaN(body.score)) {
      return errorResponse("score is required", 400);
    }

    const completedAt = new Date().toISOString();

    const { data: updatedRow, error: updateError } = await supabase
      .from("quizzes")
      .update({
        score: body.score,
        completed_at: completedAt,
      })
      .eq("id", quizId)
      .eq("user_id", userId)
      .select("id, user_id, material_id, questions, score, completed_at")
      .single();

    if (updateError || !updatedRow) {
      return errorResponse(updateError?.message ?? "Quiz not found", 404);
    }

    return jsonOk({
      quiz: mapQuizRow(updatedRow as Record<string, unknown>),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(message, 500);
  }
}
