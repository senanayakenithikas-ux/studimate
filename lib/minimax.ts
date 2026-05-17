import {
  addDaysToDateString,
  contextToSubjectLookup,
  type PlannerContext,
} from "@/lib/planner-context";
import { buildPlannerMiniMaxPrompt } from "@/lib/planner-minimax-prompt";
import {
  getMiniMaxEnvConfig,
  isMiniMaxMockEnabled,
  logMiniMaxEnvStatus,
} from "@/lib/minimax-env";
import {
  buildTutorSystemPrompt,
  buildTutorVoiceSystemPrompt,
} from "@/lib/tutor-minimax-prompt";
import {
  buildQuizMiniMaxPrompt,
  QUIZ_MATERIAL_SLICE,
} from "@/lib/quiz-minimax-prompt";
import type { QuizQuestion, WeeklySchedule } from "@/types";

export type { PlannerContext } from "@/lib/planner-context";
export { buildPlannerContext } from "@/lib/planner-context";
export { buildPlannerMiniMaxPrompt, formatPlannerPromptForLog } from "@/lib/planner-minimax-prompt";
export { enforceAdaptivePlan } from "@/lib/planner-enforce";

export {
  buildQuizMiniMaxPrompt,
  formatQuizPromptForLog,
} from "@/lib/quiz-minimax-prompt";
export type { QuizMiniMaxPrompt } from "@/lib/quiz-minimax-prompt";

// Core Interfaces used for payload handling
export interface Subject {
  id: string;
  name: string;
  exam_date: string;
  confidence_level: number;
  daily_hours: number;
}

export interface SubjectWithMaterial extends Subject {
  extracted_text: string;
}

export interface Schedule {
  date: string;
  subject_id: string;
  topics: string;
  duration_mins: number;
  session_type: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

// Internal structure used to validate the raw JSON output from the LLM
interface LLMQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: "A" | "B" | "C" | "D";
  explanation: string;
}

// MiniMax API credentials: .env.local only (see lib/minimax-env.ts)

/** Thrown when MiniMax returns a non-zero base_resp.status_code. */
export class MiniMaxError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, statusMsg: string) {
    super(statusMsg);
    this.name = "MiniMaxError";
    this.statusCode = statusCode;
  }
}

export function getMiniMaxErrorMessage(error: unknown): string {
  if (error instanceof MiniMaxError) {
    if (error.statusCode === 1008) {
      return "MiniMax account has no credits. Add balance at platform.minimax.io, or set MINIMAX_USE_MOCK=true in .env.local for demo questions.";
    }
    if (error.statusCode === 1004) {
      return "MiniMax auth failed (1004). In .env.local verify MINIMAX_API_KEY, MINIMAX_GROUP_ID (must match your key at platform.minimax.io), and MINIMAX_MODEL (e.g. MiniMax-M2.7). Restart the dev server after editing .env.local.";
    }
    if (error.statusCode === 2049) {
      return "Invalid MiniMax API key. Create one at platform.minimax.io and set MINIMAX_API_KEY in .env.local.";
    }
    return `MiniMax error (${error.statusCode}): ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "AI service unavailable";
}

interface MiniMaxChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MiniMaxChoice {
  message?: { content?: string };
}

interface MiniMaxResponse {
  choices?: MiniMaxChoice[];
  base_resp?: { status_code?: number; status_msg?: string };
}

// Mock Data fallbacks maintained for component consistency
const MOCK_SCHEDULE: WeeklySchedule = {
  weekStart: new Date().toISOString().slice(0, 10),
  slots: [
    {
      day: "Monday",
      time: "09:00",
      subjectId: "sub-1",
      subjectName: "Mathematics",
      topic: "Calculus review",
      durationMinutes: 60,
    },
    {
      day: "Wednesday",
      time: "14:00",
      subjectId: "sub-2",
      subjectName: "Physics",
      topic: "Mechanics practice",
      durationMinutes: 45,
    },
  ],
};

const MOCK_QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is the derivative of xÂ²?",
    options: ["x", "2x", "xÂ²", "2"],
    correctIndex: 1,
  },
  {
    id: "q2",
    question: "Which is a prime number?",
    options: ["9", "15", "17", "21"],
    correctIndex: 2,
  },
  {
    id: "q3",
    question: "Water boils at 100Â°C at what pressure?",
    options: ["Below sea level", "Standard atmospheric", "In a vacuum only", "Always at 50Â°C"],
    correctIndex: 1,
  },
  {
    id: "q4",
    question: "Photosynthesis primarily occurs in which organelle?",
    options: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"],
    correctIndex: 2,
  },
  {
    id: "q5",
    question: "Solve: 2x + 6 = 14",
    options: ["x = 2", "x = 4", "x = 6", "x = 10"],
    correctIndex: 1,
  },
  {
    id: "q6",
    question: "What is the chemical symbol for sodium?",
    options: ["So", "Sd", "Na", "Nm"],
    correctIndex: 2,
  },
  {
    id: "q7",
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
  },
  {
    id: "q8",
    question: "What is the largest organ in the human body?",
    options: ["Heart", "Liver", "Skin", "Brain"],
    correctIndex: 2,
  },
  {
    id: "q9",
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctIndex: 1,
  },
  {
    id: "q10",
    question: "What gas do plants absorb during photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctIndex: 2,
  },
];

/**
 * Strips potential markdown fences generated by the model to parse clean JSON text.
 */
function stripJsonFences(rawText: string): string {
  let text = rawText.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  text = text.trim();
  if (text.endsWith("```")) {
    text = text.slice(0, -3).trim();
  }
  return text;
}

interface MiniMaxRequestOptions {
  temperature?: number;
}

function buildMiniMaxPayload(
  messages: MiniMaxChatMessage[],
  maxTokens: number,
  options?: MiniMaxRequestOptions,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    model: getMiniMaxEnvConfig().model,
    messages,
    max_completion_tokens: maxTokens,
  };
  if (options?.temperature !== undefined) {
    payload.temperature = options.temperature;
  }
  return payload;
}

function extractContent(data: MiniMaxResponse): string {
  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new MiniMaxError(
      data.base_resp.status_code ?? -1,
      data.base_resp.status_msg ?? "unknown",
    );
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("MiniMax response missing choices[0].message.content");
  }
  return content;
}

/**
 * Sends a structured completion query payload to the MiniMax API endpoint.
 * Note: Uses tokens_to_generate explicitly as required by MiniMax V2 layout rules.
 */
async function callMiniMaxWithMessages(
  messages: MiniMaxChatMessage[],
  maxTokens = 1024,
  requestOptions?: MiniMaxRequestOptions,
): Promise<string> {
  try {
    const config = getMiniMaxEnvConfig();
    logMiniMaxEnvStatus("chat");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
    if (config.groupId) {
      headers["Group-Id"] = config.groupId;
    }

    const res = await fetch(config.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(
        buildMiniMaxPayload(messages, maxTokens, requestOptions),
      ),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `MiniMax HTTP ${res.status}: ${body.slice(0, 300) || res.statusText}`,
      );
    }

    const data = (await res.json()) as MiniMaxResponse;
    return extractContent(data);
  } catch (error) {
    if (error instanceof MiniMaxError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unknown MiniMax error";
    throw new Error(`MiniMax request failed: ${message}`);
  }
}

async function callMiniMax(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024,
): Promise<string> {
  return callMiniMaxWithMessages(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens,
  );
}

/**
 * Attemps to safely decode JSON. Runs a fallback prompt retry rule if syntax errors emerge.
 */
async function parseJsonWithRetry<T>(
  rawText: string,
  retryFn: () => Promise<string>,
): Promise<T> {
  try {
    return JSON.parse(stripJsonFences(rawText)) as T;
  } catch (firstError) {
    try {
      const retryRaw = await retryFn();
      return JSON.parse(stripJsonFences(retryRaw)) as T;
    } catch {
      const detail = firstError instanceof Error ? firstError.message : "Invalid JSON";
      throw new Error(`Failed to parse AI JSON after retry: ${detail}`);
    }
  }
}

function isSchedule(value: unknown): value is Schedule {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.date === "string" &&
    typeof row.subject_id === "string" &&
    typeof row.topics === "string" &&
    typeof row.duration_mins === "number" &&
    typeof row.session_type === "string"
  );
}

function validateSchedules(data: unknown): Schedule[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Expected a non-empty JSON array of schedule items");
  }
  const invalid = data.find((item) => !isSchedule(item));
  if (invalid !== undefined) {
    throw new Error("Schedule items must include date, subject_id, topics, duration_mins, session_type");
  }
  return data;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toScheduleArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const row = raw as Record<string, unknown>;
    const nested = row.schedule ?? row.schedules ?? row.items;
    if (Array.isArray(nested)) return nested;
    return [raw];
  }
  return [];
}

function normalizeDateOnly(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  return DATE_ONLY_RE.test(match[1]) ? match[1] : null;
}

interface SubjectLookup {
  id: string;
  name: string;
}

function resolveSubjectId(
  value: unknown,
  subjects: SubjectLookup[],
): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;

  if (UUID_RE.test(text)) {
    const byId = subjects.find((s) => s.id === text);
    if (byId) return byId.id;
  }

  const lower = text.toLowerCase();
  const byName = subjects.find((s) => s.name.toLowerCase() === lower);
  if (byName) return byName.id;

  const partial = subjects.find((s) => lower.includes(s.name.toLowerCase()));
  return partial?.id ?? null;
}

function coerceDurationMins(value: unknown, dailyHours: number): number {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) {
    return Math.min(Math.round(n), 8 * 60);
  }
  return Math.min(Math.max(Math.round(dailyHours * 60), 30), 180);
}

function parseDateOffset(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const offset = Math.round(n);
  if (offset < 1 || offset > 7) return null;
  return offset;
}

function normalizeScheduleItem(
  raw: unknown,
  context: PlannerContext,
): Schedule | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const subjects = contextToSubjectLookup(context);
  const subjectId = resolveSubjectId(
    row.subject_id ?? row.subjectId ?? row.subject ?? row.subject_name,
    subjects,
  );
  if (!subjectId) return null;

  const subject = context.subjects.find((s) => s.id === subjectId);

  const offset = parseDateOffset(row.date_offset ?? row.dateOffset);
  const date =
    offset !== null
      ? addDaysToDateString(context.today, offset - 1)
      : normalizeDateOnly(row.date ?? row.scheduled_at ?? row.scheduledAt);
  if (!date) return null;

  const topicsRaw =
    row.topics ?? row.topic ?? row.focus ?? row.title ?? row.description;
  const topics = typeof topicsRaw === "string" ? topicsRaw.trim() : "";
  if (!topics) return null;

  const sessionTypeRaw = row.session_type ?? row.sessionType ?? row.type;
  const session_type =
    typeof sessionTypeRaw === "string" && sessionTypeRaw.trim()
      ? sessionTypeRaw.trim()
      : "Reading";

  const duration_mins = coerceDurationMins(
    row.duration_mins ?? row.duration ?? row.durationMinutes,
    subject?.daily_hours ?? 1,
  );

  return {
    date,
    subject_id: subjectId,
    topics,
    duration_mins,
    session_type,
  };
}

export function normalizeScheduleRows(
  raw: unknown,
  context: PlannerContext,
): Schedule[] {
  const items = toScheduleArray(raw)
    .map((item) => normalizeScheduleItem(item, context))
    .filter((item): item is Schedule => item !== null);

  if (items.length === 0) {
    throw new Error(
      "No valid schedule items after normalization. Each item needs date, subject_id (UUID from subjects list), topics, duration_mins, session_type.",
    );
  }

  return validateSchedules(items);
}

const ANSWER_KEYS = ["A", "B", "C", "D"] as const;
function isAnswerKey(value: string): value is "A" | "B" | "C" | "D" {
  return (ANSWER_KEYS as readonly string[]).includes(value);
}

function isQuestion(value: unknown): value is LLMQuestion {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  const options = row.options;
  if (!options || typeof options !== "object") return false;
  const opts = options as Record<string, unknown>;
  return (
    typeof row.question === "string" &&
    typeof opts.A === "string" &&
    typeof opts.B === "string" &&
    typeof opts.C === "string" &&
    typeof opts.D === "string" &&
    typeof row.answer === "string" &&
    isAnswerKey(row.answer) &&
    typeof row.explanation === "string"
  );
}

const QUIZ_QUESTION_COUNT = 10;

function validateQuestions(data: unknown): LLMQuestion[] {
  if (!Array.isArray(data) || data.length !== QUIZ_QUESTION_COUNT) {
    throw new Error(
      `Expected a JSON array of exactly ${QUIZ_QUESTION_COUNT} questions`,
    );
  }
  const invalid = data.find((item) => !isQuestion(item));
  if (invalid !== undefined) {
    throw new Error(
      "Each question must have question, options {A,B,C,D}, answer (A|B|C|D), and explanation",
    );
  }
  return data;
}

/* --- EXPORTED API FEATURE IMPLEMENTATIONS --- */

const PLACEHOLDER_EXTRACTED_TEXT =
  /^sample extracted text/i;

export const PDF_NOT_SUITABLE_FOR_QUIZ = "PDF_NOT_SUITABLE_FOR_QUIZ" as const;

export const PDF_NOT_SUITABLE_MESSAGE =
  "This PDF is not suitable for quizzes. Use a text-based PDF (not a scanned image-only file) with enough readable content.";

export class PdfNotSuitableForQuizError extends Error {
  readonly code = PDF_NOT_SUITABLE_FOR_QUIZ;

  constructor(message: string = PDF_NOT_SUITABLE_MESSAGE) {
    super(message);
    this.name = "PdfNotSuitableForQuizError";
  }
}

export function isUsableStudyText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 80) {
    return false;
  }
  if (PLACEHOLDER_EXTRACTED_TEXT.test(trimmed)) {
    return false;
  }
  return true;
}

export function assertUsableStudyText(text: string): void {
  if (!isUsableStudyText(text)) {
    throw new PdfNotSuitableForQuizError();
  }
}

function shouldUseQuizMockFallback(): boolean {
  return isMiniMaxMockEnabled();
}

function mockStudyPlanFromContext(context: PlannerContext): Schedule[] {
  const rows: Schedule[] = [];
  for (let offset = 1; offset <= 7 && offset <= context.subjects.length; offset++) {
    const subject = context.subjects[offset - 1] ?? context.subjects[0];
    if (!subject) break;
    const material = context.study_materials.find(
      (m) => m.subject_id === subject.id,
    );
    const filename = material?.filename ?? subject.name;
    rows.push({
      date: addDaysToDateString(context.today, offset - 1),
      subject_id: subject.id,
      duration_mins: Math.min(Math.round(subject.daily_hours * 60), 90),
      topics: `Review key concepts from [${filename}]`,
      session_type: offset <= 2 ? "Exam Prep" : "Reading",
    });
  }
  if (rows.length === 0 && context.subjects[0]) {
    const subject = context.subjects[0];
    rows.push({
      date: context.today,
      subject_id: subject.id,
      duration_mins: 60,
      topics: `Study ${subject.name}`,
      session_type: "Reading",
    });
  }
  return rows;
}

/**
 * Feature: Generates a 7-day adaptive study calendar from full planner context.
 */
export async function generateStudyPlan(
  context: PlannerContext,
): Promise<Schedule[]> {
  try {
    if (isMiniMaxMockEnabled()) {
      return mockStudyPlanFromContext(context);
    }

    const { systemPrompt, userPrompt } = buildPlannerMiniMaxPrompt(context);
    const exampleSubjectId = context.subjects[0]?.id ?? "SUBJECT_UUID";
    const exampleJson = JSON.stringify({
      date_offset: 1,
      subject_id: exampleSubjectId,
      topics: "Review key concepts from [notes.pdf]",
      duration_mins: 60,
      session_type: "Reading",
    });

    const raw = await callMiniMax(systemPrompt, userPrompt, 4096);

    const strictSystem =
      "Return ONLY a valid JSON array. No markdown. No explanation. Each object must have: date_offset (1-7), subject_id, topics, duration_mins, session_type.";
    const strictUser = `Your previous response was invalid. Fix it.
Today is ${context.today}. Return schedule objects for date_offset 1â€“7 as a JSON array.
Use only subject_id UUIDs from the subjects list. Example: ${exampleJson}
Student ecosystem: ${JSON.stringify(context)}`;

    const parsed = await parseJsonWithRetry<unknown>(raw, () =>
      callMiniMax(strictSystem, strictUser, 4096),
    );
    return normalizeScheduleRows(parsed, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generateStudyPlan error";
    throw new Error(`generateStudyPlan failed: ${message}`);
  }
}

const SUMMARY_SAMPLE_CHARS = 48_000;

function sampleTextForSummary(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  const part = Math.floor(maxChars / 3);
  const midStart = Math.max(
    0,
    Math.floor(text.length / 2) - Math.floor(part / 2),
  );
  return [
    text.slice(0, part),
    "\n\n[... omitted ...]\n\n",
    text.slice(midStart, midStart + part),
    "\n\n[... omitted ...]\n\n",
    text.slice(-part),
  ].join("");
}

/**
 * Compresses long study text into structured notes for AI prompts (cached in storage).
 */
export async function generateStudyMaterialSummary(
  sourceText: string,
  filename: string,
): Promise<string> {
  const trimmed = sourceText.trim();
  if (!trimmed) {
    return "";
  }

  if (isMiniMaxMockEnabled()) {
    return trimmed.slice(0, 6_000);
  }

  const sampled = sampleTextForSummary(trimmed, SUMMARY_SAMPLE_CHARS);
  const systemPrompt =
    "You compress study materials into dense revision notes. Plain text only. No markdown fences.";
  const userPrompt = `Create structured study notes from "${filename}" covering the full document (beginning, middle, and end).
Include: main topics, key definitions, formulas, important facts, and chapter/section themes if visible.
Target about 1200-2000 words. Do not invent content not supported by the source.

Source excerpts:
${sampled}`;

  return (await callMiniMax(systemPrompt, userPrompt, 4096)).trim();
}

/**
 * Feature: Builds 5 multiple-choice questions from study text content context.
 * Automatically transforms key object structures into ordered string arrays for the UI.
 */
export async function generateQuiz(extractedText: string): Promise<QuizQuestion[]> {
  const trimmed = extractedText.trim();
  if (!trimmed) {
    throw new PdfNotSuitableForQuizError();
  }

  if (shouldUseQuizMockFallback()) {
    return mockQuizQuestions();
  }

  try {
    const prompt = buildQuizMiniMaxPrompt(trimmed);
    const material = trimmed.slice(0, QUIZ_MATERIAL_SLICE);

    const quizRequest = { temperature: 0.85 } as const;
    const messages: MiniMaxChatMessage[] = [
      { role: "system", content: prompt.systemPrompt },
      { role: "user", content: prompt.userPrompt },
    ];

    const raw = await callMiniMaxWithMessages(messages, 4096, quizRequest);

    const strictSystem =
      `Return ONLY a valid JSON array of exactly ${QUIZ_QUESTION_COUNT} objects. No markdown. Fields: question, options {A,B,C,D}, answer, explanation.`;
    const strictUser = `Your previous response was invalid. Return exactly ${QUIZ_QUESTION_COUNT} quiz questions grounded in this PDF text:
${material}`;

    const parsed = await parseJsonWithRetry<unknown>(raw, () =>
      callMiniMaxWithMessages(
        [
          { role: "system", content: strictSystem },
          { role: "user", content: strictUser },
        ], 4096,
        quizRequest,
      ),
    );

    const validatedLLMQuestions = validateQuestions(parsed);

    return validatedLLMQuestions.map((q, index) => {
      const optionsArray = [q.options.A, q.options.B, q.options.C, q.options.D];
      const mapper: Record<"A" | "B" | "C" | "D", number> = {
        A: 0,
        B: 1,
        C: 2,
        D: 3,
      };

      return {
        id: `q${index + 1}`,
        question: q.question,
        options: optionsArray,
        correctIndex: mapper[q.answer],
      };
    });
  } catch (error) {
    if (error instanceof MiniMaxError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Unknown generateQuiz error";
    throw new Error(`generateQuiz failed: ${message}`);
  }
}

/**
 * Feature: Persistent conversational study helper context channel.
 */
export interface TutorChatOptions {
  voice?: boolean;
}

export async function tutorChat(
  context: string,
  history: Message[],
  userMessage: string,
  options: TutorChatOptions = {},
): Promise<string> {
  try {
    const systemPrompt = options.voice
      ? buildTutorVoiceSystemPrompt(context)
      : buildTutorSystemPrompt(context);

    const recentHistory = history.slice(-5);
    const messages: MiniMaxChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    return await callMiniMaxWithMessages(messages, 1536);
  } catch (error) {
    if (error instanceof MiniMaxError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unknown tutorChat error";
    throw new Error(`tutorChat failed: ${message}`);
  }
}

export function mockWeeklySchedule(): WeeklySchedule {
  return MOCK_SCHEDULE;
}

export function mockQuizQuestions(): QuizQuestion[] {
  return MOCK_QUIZ;
}

