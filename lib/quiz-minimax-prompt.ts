/** Max characters of PDF text included in the MiniMax quiz user prompt. */
export const QUIZ_MATERIAL_SLICE = 12_000;

export interface QuizMiniMaxPrompt {
  systemPrompt: string;
  userPrompt: string;
  materialCharsTotal: number;
  materialCharsSent: number;
  requestBatchId: number;
}

/**
 * Builds the system + user messages sent to MiniMax when generating a quiz.
 */
export function buildQuizMiniMaxPrompt(extractedText: string): QuizMiniMaxPrompt {
  const trimmed = extractedText.trim();
  const material = trimmed.slice(0, QUIZ_MATERIAL_SLICE);
  const requestBatchId = Date.now();

  const systemPrompt =
    "You create quizzes from uploaded study PDFs. Return only valid JSON arrays. No markdown. No explanation.";

  const userPrompt = `Generate exactly 10 multiple-choice questions using ONLY facts from the study material below.
Rules:
- Every question must be answerable from this text (no generic trivia unrelated to the material).
- Prefer specific terms, definitions, steps, and examples that appear in the text.
- Vary topics across the material; do not repeat the same concept twice.
- Request batch: ${requestBatchId}
Each item: { "question": string, "options": { "A": string, "B": string, "C": string, "D": string }, "answer": "A"|"B"|"C"|"D", "explanation": string }

Study material (from PDF):
${material}`;

  return {
    systemPrompt,
    userPrompt,
    materialCharsTotal: trimmed.length,
    materialCharsSent: material.length,
    requestBatchId,
  };
}

export function formatQuizPromptForLog(prompt: QuizMiniMaxPrompt): string {
  const divider = "=".repeat(72);
  return [
    divider,
    "Studimate → MiniMax quiz prompt",
    divider,
    "",
    "[system]",
    prompt.systemPrompt,
    "",
    "[user]",
    prompt.userPrompt,
    "",
    `PDF text in DB: ${prompt.materialCharsTotal} chars`,
    `Sent in prompt: ${prompt.materialCharsSent} chars (max ${QUIZ_MATERIAL_SLICE})`,
    `Request batch: ${prompt.requestBatchId}`,
    divider,
  ].join("\n");
}
