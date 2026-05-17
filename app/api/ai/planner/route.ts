import { NextResponse } from "next/server";
import {
  generateStudyPlan,
  getMiniMaxErrorMessage,
  type Schedule,
  type Subject,
} from "@/lib/minimax";
import { enforceAdaptivePlan } from "@/lib/planner-enforce";
import {
  buildPlannerContext,
  type PlannerMaterialInput,
  type PlannerCompletedTaskInput,
  type PlannerMissedTaskInput,
  type PlannerQuizInput,
  type PlannerSubjectInput,
} from "@/lib/planner-context";
import {
  getRollingPlanRange,
  getSevenDayRangeFromStart,
  getTodayDateString,
  parseLocalDateString,
} from "@/lib/planner-dates";
import { fetchUserProfile } from "@/lib/users";
import {
  createPlannerSupabaseClient,
  ensurePlannerUserProfile,
  resolvePlannerUserId,
} from "@/lib/planner-auth";
import {
  PLANNER_PROMPT_MAX_CHARS,
  resolveStudyMaterialPromptText,
} from "@/lib/study-material-prompt";
import {
  mapStudyMaterialStorageRow,
  type StudyMaterialStorageRow,
} from "@/lib/study-material-storage";
import { syncUserStreak } from "@/lib/user-streak-sync";
import { createServerClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlannerSlot, WeeklySchedule } from "@/types";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

interface PlannerRequestBody {
  subjects?: Subject[];
  regenerate?: boolean;
  /** First day of a 7-day window to load (YYYY-MM-DD). */
  weekStart?: string;
}

interface ScheduleRecord {
  id: string;
  user_id: string;
  subject_id: string;
  date: string;
  duration_mins: number;
  topics: string;
  session_type: string;
  completed: boolean;
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function isSubject(value: unknown): value is Subject {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.exam_date === "string" &&
    typeof row.confidence_level === "number" &&
    typeof row.daily_hours === "number"
  );
}

function mapSubjectRow(row: Record<string, unknown>): Subject {
  return {
    id: String(row.id),
    name: String(row.name),
    exam_date: String(row.exam_date ?? ""),
    confidence_level: Number(row.confidence_level ?? row.confidence ?? 3),
    daily_hours: Number(row.daily_hours ?? 1),
  };
}

function weekdayFromDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return WEEKDAY_NAMES[date.getDay()] ?? "Monday";
}

function scheduleRecordsToWeeklySchedule(
  rows: ScheduleRecord[],
  subjects: Subject[],
  rangeStart: string,
): WeeklySchedule {
  const nameById = new Map(subjects.map((s) => [s.id, s.name]));
  const { start, end } = getSevenDayRangeFromStart(rangeStart);
  const inRange = rows.filter((row) => row.date >= start && row.date <= end);
  const sorted = [...inRange].sort((a, b) => a.date.localeCompare(b.date));

  const slots: PlannerSlot[] = sorted.map((row, index) => ({
    scheduleId: row.id,
    day: weekdayFromDate(row.date),
    time: `${String(9 + (index % 4)).padStart(2, "0")}:00`,
    subjectId: row.subject_id,
    subjectName: nameById.get(row.subject_id) ?? "Subject",
    topic: row.topics,
    durationMinutes: row.duration_mins,
    completed: row.completed,
  }));

  return { weekStart: start, slots };
}

function resolveRangeStart(body: PlannerRequestBody): string {
  if (body.weekStart?.trim()) {
    return getSevenDayRangeFromStart(body.weekStart.trim()).start;
  }
  return getRollingPlanRange().start;
}

function plannerSuccessPayload(
  rows: ScheduleRecord[],
  subjects: Subject[],
  cached: boolean,
  saved: boolean,
  streakCount?: number,
  rangeStart?: string,
): Record<string, unknown> {
  const start = rangeStart ?? resolveRangeStart({});
  const view = scheduleRecordsToWeeklySchedule(rows, subjects, start);
  return {
    data: view,
    view,
    schedule: rows,
    cached,
    saved,
    ...(streakCount !== undefined ? { streak_count: streakCount } : {}),
  };
}

async function syncStreakAfterPlan(
  userId: string,
  saved: boolean,
): Promise<number | undefined> {
  if (!saved) return undefined;

  const admin = createServerClient();
  const { streakCount, error } = await syncUserStreak(admin, userId);
  if (error) {
    console.error("planner streak sync failed:", error);
    return undefined;
  }
  return streakCount;
}

function mapScheduleRow(row: Record<string, unknown>): ScheduleRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    subject_id: String(row.subject_id),
    date: String(row.date),
    duration_mins: Number(row.duration_mins),
    topics: String(row.topics),
    session_type: String(row.session_type),
    completed: Boolean(row.completed),
  };
}

async function fetchStudyMaterials(
  supabase: SupabaseClient,
  userId: string,
  subjectIds: string[],
): Promise<PlannerMaterialInput[]> {
  if (subjectIds.length === 0) return [];

  const { data, error } = await supabase
    .from("study_materials")
    .select(
      "id, subject_id, filename, extracted_text, storage_url, created_at",
    )
    .eq("user_id", userId)
    .in("subject_id", subjectIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      subject_id: String(record.subject_id),
      filename: String(record.filename ?? "material.pdf"),
      extracted_text: String(record.extracted_text ?? ""),
      storage_url: String(record.storage_url ?? ""),
    };
  });

  return Promise.all(
    rows.map(async (material) => {
      const storageRow: StudyMaterialStorageRow = {
        ...mapStudyMaterialStorageRow({
          id: material.id,
          user_id: userId,
          filename: material.filename,
          storage_url: material.storage_url,
          extracted_text: material.extracted_text,
        }),
      };

      try {
        const excerpt = await resolveStudyMaterialPromptText(
          supabase,
          storageRow,
          PLANNER_PROMPT_MAX_CHARS,
        );
        return { ...material, extracted_text: excerpt };
      } catch {
        return {
          ...material,
          extracted_text: material.extracted_text
            .trim()
            .slice(0, PLANNER_PROMPT_MAX_CHARS),
        };
      }
    }),
  );
}

function mapIncompleteScheduleRow(
  record: Record<string, unknown>,
): PlannerMissedTaskInput {
  return {
    schedule_id: String(record.id),
    subject_id: String(record.subject_id),
    date: String(record.date),
    topics: String(record.topics),
    session_type: String(record.session_type ?? "Reading"),
    duration_mins: Number(record.duration_mins ?? 60),
  };
}

interface CompletedSchedulePreserve extends PlannerCompletedTaskInput {
  session_type: string;
}

function mapCompletedScheduleRow(
  record: Record<string, unknown>,
): CompletedSchedulePreserve {
  return {
    schedule_id: String(record.id),
    subject_id: String(record.subject_id),
    date: String(record.date),
    topics: String(record.topics),
    duration_mins: Number(record.duration_mins ?? 60),
    session_type: String(record.session_type ?? "Study"),
  };
}

/** Incomplete tasks through the plan window end (carry-over on regenerate). */
async function fetchMissedTasks(
  supabase: SupabaseClient,
  userId: string,
  throughDate: string,
): Promise<PlannerMissedTaskInput[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("id, subject_id, date, topics, session_type, duration_mins")
    .eq("user_id", userId)
    .eq("completed", false)
    .lte("date", throughDate)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapIncompleteScheduleRow(row as Record<string, unknown>),
  );
}

async function fetchCompletedTasksInRange(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string,
): Promise<CompletedSchedulePreserve[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("id, subject_id, date, topics, duration_mins, session_type")
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapCompletedScheduleRow(row as Record<string, unknown>),
  );
}

function scheduleDedupeKey(
  date: string,
  subjectId: string,
  topics: string,
): string {
  return `${date}|${subjectId}|${topics.trim().toLowerCase()}`;
}

function dedupeGeneratedAgainstCompleted(
  generated: Schedule[],
  completed: PlannerCompletedTaskInput[],
): Schedule[] {
  const completedKeys = new Set(
    completed.map((c) =>
      scheduleDedupeKey(c.date, c.subject_id, c.topics),
    ),
  );
  return generated.filter(
    (row) =>
      !completedKeys.has(
        scheduleDedupeKey(row.date, row.subject_id, row.topics),
      ),
  );
}

async function fetchQuizAudits(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlannerQuizInput[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      "id, material_id, score, questions, completed_at, study_materials(filename, subject_id)",
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const audits: PlannerQuizInput[] = [];

  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    const score = record.score;
    if (score === null || score === undefined) continue;

    const materialRaw = record.study_materials;
    const material =
      materialRaw && typeof materialRaw === "object"
        ? (materialRaw as Record<string, unknown>)
        : null;

    const questions = record.questions;
    const questionCount = Array.isArray(questions) ? questions.length : 5;
    if (questionCount <= 0) continue;

    audits.push({
      quiz_id: String(record.id),
      material_id: String(record.material_id),
      subject_id: String(material?.subject_id ?? ""),
      filename: String(material?.filename ?? "material.pdf"),
      score: Number(score),
      question_count: questionCount,
    });
  }

  return audits.filter((a) => a.subject_id.length > 0);
}

async function fetchSubjectsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, exam_date, confidence_level, daily_hours")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) return [];

  return data.map((row: Record<string, unknown>) => mapSubjectRow(row));
}

function parseSubjectsFromBody(body: PlannerRequestBody): Subject[] | null {
  if (!body.subjects) return null;
  if (!Array.isArray(body.subjects)) {
    throw new Error("subjects must be an array");
  }
  const valid = body.subjects.filter(isSubject);
  if (valid.length !== body.subjects.length) {
    throw new Error("Invalid subjects in request body");
  }
  return valid;
}

function subjectsToPlannerInput(subjects: Subject[]): PlannerSubjectInput[] {
  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    exam_date: s.exam_date,
    confidence_level: s.confidence_level,
    daily_hours: s.daily_hours,
  }));
}

async function fetchScheduleRecordsInRange(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string,
): Promise<ScheduleRecord[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, user_id, subject_id, date, duration_mins, topics, session_type, completed",
    )
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) =>
    mapScheduleRow(row),
  );
}

type PlannerAuthResult =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; response: NextResponse };

async function authenticatePlannerRequest(
  request: Request,
): Promise<PlannerAuthResult> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { ok: false, response: errorResponse("Unauthorized", 401) };
  }

  const supabase = createPlannerSupabaseClient();
  const userId = await resolvePlannerUserId(supabase, token);

  const { error: ensureProfileError } = await ensurePlannerUserProfile(
    supabase,
    userId,
  );
  if (ensureProfileError) {
    return { ok: false, response: errorResponse(ensureProfileError, 500) };
  }

  const { profile, error: profileError } = await fetchUserProfile(
    supabase,
    userId,
  );
  if (profileError) {
    return { ok: false, response: errorResponse(profileError, 500) };
  }
  if (!profile) {
    return {
      ok: false,
      response: errorResponse(
        "User profile not found. Complete signup sync first.",
        404,
      ),
    };
  }

  return { ok: true, supabase, userId };
}

/** Read saved schedules for the current 7-day window (no AI generation). */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const auth = await authenticatePlannerRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { supabase, userId } = auth;
    const subjects = await fetchSubjectsForUser(supabase, userId);
    const { start, end } = getRollingPlanRange();
    const records = await fetchScheduleRecordsInRange(
      supabase,
      userId,
      start,
      end,
    );

    return NextResponse.json(
      plannerSuccessPayload(
        records,
        subjects,
        true,
        false,
        undefined,
        getRollingPlanRange().start,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load schedule";
    return errorResponse(message, 500);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const auth = await authenticatePlannerRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { supabase, userId } = auth;
    const body = (await request.json().catch(() => ({}))) as PlannerRequestBody;

    let subjects: Subject[];
    const fromBody = parseSubjectsFromBody(body);
    if (fromBody !== null) {
      subjects = fromBody;
    } else {
      subjects = await fetchSubjectsForUser(supabase, userId);
    }

    if (subjects.length === 0) {
      return errorResponse(
        "No subjects found. Please add subjects first.",
        400,
      );
    }

    const forceRegenerate = body.regenerate === true;
    const rangeViewStart = body.weekStart?.trim()
      ? getSevenDayRangeFromStart(body.weekStart.trim()).start
      : null;

    const { start, end } = rangeViewStart
      ? getSevenDayRangeFromStart(rangeViewStart)
      : getRollingPlanRange();

    if (!forceRegenerate) {
      const records = await fetchScheduleRecordsInRange(
        supabase,
        userId,
        start,
        end,
      );

      if (records.length > 0 || rangeViewStart) {
        return NextResponse.json(
          plannerSuccessPayload(
            records,
            subjects,
            true,
            false,
            undefined,
            rangeViewStart ?? resolveRangeStart(body),
          ),
        );
      }
    }

    const subjectIds = subjects.map((subject) => subject.id);

    const completedInRange = await fetchCompletedTasksInRange(
      supabase,
      userId,
      start,
      end,
    );

    const [materials, missedTasks, quizAudits] = await Promise.all([
      fetchStudyMaterials(supabase, userId, subjectIds),
      fetchMissedTasks(supabase, userId, end),
      fetchQuizAudits(supabase, userId),
    ]);

    const plannerContext = buildPlannerContext({
      today: getTodayDateString(),
      subjects: subjectsToPlannerInput(subjects),
      materials,
      missedTasks,
      completedTasks: completedInRange,
      quizzes: quizAudits,
    });

    const { error: clearError } = await supabase
      .from("schedules")
      .delete()
      .eq("user_id", userId)
      .eq("completed", false)
      .gte("date", start)
      .lte("date", end);

    if (clearError) {
      return errorResponse(clearError.message, 500);
    }

    const llmRows: Schedule[] = await generateStudyPlan(plannerContext);
    const enforced = enforceAdaptivePlan(llmRows, plannerContext);
    const generated = dedupeGeneratedAgainstCompleted(
      enforced,
      completedInRange,
    );

    const inserts = generated.map((item) => ({
      user_id: userId,
      subject_id: item.subject_id,
      date: item.date,
      duration_mins: item.duration_mins,
      topics: item.topics,
      session_type: item.session_type,
      completed: false,
    }));

    const { data: savedRows, error: insertError } = await supabase
      .from("schedules")
      .insert(inserts)
      .select(
        "id, user_id, subject_id, date, duration_mins, topics, session_type, completed",
      );

    if (insertError) {
      return errorResponse(insertError.message, 500);
    }

    const newRecords = (savedRows ?? []).map((row: Record<string, unknown>) =>
      mapScheduleRow(row),
    );
    const records = [
      ...completedInRange.map((c) => ({
        id: c.schedule_id,
        user_id: userId,
        subject_id: c.subject_id,
        date: c.date,
        duration_mins: c.duration_mins,
        topics: c.topics,
        session_type: c.session_type,
        completed: true as const,
      })),
      ...newRecords,
    ].sort((a, b) => a.date.localeCompare(b.date));

    const streakCount = await syncStreakAfterPlan(userId, true);

    return NextResponse.json(
      plannerSuccessPayload(
        records,
        subjects,
        false,
        true,
        streakCount,
        getRollingPlanRange().start,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? getMiniMaxErrorMessage(error)
        : "Internal server error";
    const status =
      message === "Unauthorized" || message.startsWith("Unauthorized")
        ? 401
        : message.includes("subjects")
          ? 400
          : 500;
    return errorResponse(message, status);
  }
}
