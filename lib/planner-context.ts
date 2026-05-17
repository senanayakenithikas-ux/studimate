/** Max characters of material excerpt included in the planner MiniMax prompt. */
export const PLANNER_MATERIAL_SLICE = 4_000;

export interface PlannerSubjectInput {
  id: string;
  name: string;
  exam_date: string;
  confidence_level: number;
  daily_hours: number;
}

export interface PlannerMaterialInput {
  id: string;
  subject_id: string;
  filename: string;
  extracted_text: string;
  storage_url: string;
}

export interface PlannerMissedTaskInput {
  schedule_id: string;
  subject_id: string;
  date: string;
  topics: string;
  session_type: string;
  duration_mins: number;
}

export interface PlannerCompletedTaskInput {
  schedule_id: string;
  subject_id: string;
  date: string;
  topics: string;
  duration_mins: number;
}

export interface PlannerQuizInput {
  quiz_id: string;
  material_id: string;
  subject_id: string;
  filename: string;
  score: number;
  question_count: number;
}

export interface PlannerContextSubject {
  id: string;
  name: string;
  exam_date: string;
  confidence_level: number;
  daily_hours: number;
  runway_days: number;
  effective_confidence: number;
}

export interface PlannerContextMaterial {
  id: string;
  subject_id: string;
  filename: string;
  excerpt: string;
}

export interface PlannerContextMissedTask {
  schedule_id: string;
  subject_id: string;
  date: string;
  topics: string;
  session_type: string;
  duration_mins: number;
}

export interface PlannerContextCompletedTask {
  schedule_id: string;
  subject_id: string;
  date: string;
  topics: string;
  duration_mins: number;
}

export interface PlannerContextPerformanceAudit {
  quiz_id: string;
  material_id: string;
  subject_id: string;
  filename: string;
  score_percent: number;
  weak: boolean;
}

export interface PlannerContext {
  today: string;
  subjects: PlannerContextSubject[];
  study_materials: PlannerContextMaterial[];
  missed_tasks: PlannerContextMissedTask[];
  completed_tasks: PlannerContextCompletedTask[];
  performance_audits: PlannerContextPerformanceAudit[];
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim().slice(0, 10);
  if (!DATE_ONLY_RE.test(trimmed)) return null;
  const [y, m, d] = trimmed.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function todayDateString(reference = new Date()): string {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/** Days from today until exam_date (0 if exam is today or past, or date invalid). */
export function computeRunwayDays(today: string, examDate: string): number {
  const start = parseDateOnly(today);
  const end = parseDateOnly(examDate);
  if (!start || !end) return 0;
  const diffMs = end.getTime() - start.getTime();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

export function computeScorePercent(
  score: number,
  questionCount: number,
): number {
  if (!Number.isFinite(score) || questionCount <= 0) return 0;
  return Math.round((score / questionCount) * 100);
}

const WEAK_QUIZ_THRESHOLD_PERCENT = 70;
const WEAK_CONFIDENCE_OVERRIDE = 1;

/** Lower effective confidence when the student has weak quiz performance on the subject. */
export function deriveEffectiveConfidence(
  confidenceLevel: number,
  hasWeakQuizOnSubject: boolean,
): number {
  const base = Math.min(5, Math.max(1, Math.round(confidenceLevel)));
  if (!hasWeakQuizOnSubject) return base;
  return Math.min(base, WEAK_CONFIDENCE_OVERRIDE);
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const parsed = parseDateOnly(dateStr);
  if (!parsed) return dateStr;
  parsed.setDate(parsed.getDate() + days);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateToOffset(today: string, date: string): number | null {
  const start = parseDateOnly(today);
  const target = parseDateOnly(date);
  if (!start || !target) return null;
  const diffMs = target.getTime() - start.getTime();
  const offset = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  if (offset < 1 || offset > 7) return null;
  return offset;
}

export function buildPlannerContext(params: {
  today?: string;
  subjects: PlannerSubjectInput[];
  materials: PlannerMaterialInput[];
  missedTasks: PlannerMissedTaskInput[];
  completedTasks?: PlannerCompletedTaskInput[];
  quizzes: PlannerQuizInput[];
}): PlannerContext {
  const today = params.today ?? todayDateString();

  const performance_audits: PlannerContextPerformanceAudit[] =
    params.quizzes.map((q) => {
      const score_percent = computeScorePercent(q.score, q.question_count);
      return {
        quiz_id: q.quiz_id,
        material_id: q.material_id,
        subject_id: q.subject_id,
        filename: q.filename,
        score_percent,
        weak: score_percent < WEAK_QUIZ_THRESHOLD_PERCENT,
      };
    });

  const weakSubjectIds = new Set(
    performance_audits.filter((a) => a.weak).map((a) => a.subject_id),
  );

  const subjects: PlannerContextSubject[] = params.subjects.map((s) => ({
    id: s.id,
    name: s.name,
    exam_date: s.exam_date,
    confidence_level: s.confidence_level,
    daily_hours: s.daily_hours,
    runway_days: computeRunwayDays(today, s.exam_date),
    effective_confidence: deriveEffectiveConfidence(
      s.confidence_level,
      weakSubjectIds.has(s.id),
    ),
  }));

  const study_materials: PlannerContextMaterial[] = params.materials.map(
    (m) => ({
      id: m.id,
      subject_id: m.subject_id,
      filename: m.filename,
      excerpt: m.extracted_text.trim().slice(0, PLANNER_MATERIAL_SLICE),
    }),
  );

  return {
    today,
    subjects,
    study_materials,
    missed_tasks: params.missedTasks.map((t) => ({
      schedule_id: t.schedule_id,
      subject_id: t.subject_id,
      date: t.date,
      topics: t.topics,
      session_type: t.session_type,
      duration_mins: t.duration_mins,
    })),
    completed_tasks: (params.completedTasks ?? []).map((t) => ({
      schedule_id: t.schedule_id,
      subject_id: t.subject_id,
      date: t.date,
      topics: t.topics,
      duration_mins: t.duration_mins,
    })),
    performance_audits,
  };
}

/** Subjects list for UUID resolution during schedule normalization. */
export function contextToSubjectLookup(
  context: PlannerContext,
): Array<{
  id: string;
  name: string;
  exam_date: string;
  confidence_level: number;
  daily_hours: number;
}> {
  return context.subjects.map((s) => ({
    id: s.id,
    name: s.name,
    exam_date: s.exam_date,
    confidence_level: s.effective_confidence,
    daily_hours: s.daily_hours,
  }));
}
