import {
  addDaysToDateString,
  type PlannerContext,
  type PlannerContextMissedTask,
  type PlannerContextPerformanceAudit,
} from "@/lib/planner-context";
import type { Schedule } from "@/lib/minimax";

const CARRIED_OVER_PREFIX = "Carried Over:";

function topicsReflectMissedTask(topics: string, missed: PlannerContextMissedTask): boolean {
  const lower = topics.toLowerCase();
  if (lower.includes("carried over")) return true;
  const snippet = missed.topics.trim().slice(0, 40).toLowerCase();
  return snippet.length > 0 && lower.includes(snippet);
}

function topicsReflectWeakAudit(
  topics: string,
  audit: PlannerContextPerformanceAudit,
): boolean {
  const lower = topics.toLowerCase();
  if (lower.includes(audit.filename.toLowerCase()) && (lower.includes("quiz") || lower.includes("revision") || lower.includes("weak"))) {
    return true;
  }
  return false;
}

function subjectDailyCapMins(context: PlannerContext, subjectId: string): number {
  const subject = context.subjects.find((s) => s.id === subjectId);
  const hours = subject?.daily_hours ?? 1;
  return Math.max(Math.round(hours * 60), 30);
}

function totalMinsOnDate(rows: Schedule[], date: string, subjectId: string): number {
  return rows
    .filter((r) => r.date === date && r.subject_id === subjectId)
    .reduce((sum, r) => sum + r.duration_mins, 0);
}

function trimLowPrioritySlots(
  rows: Schedule[],
  context: PlannerContext,
): Schedule[] {
  const protectedTopics = (topics: string) =>
    topics.startsWith(CARRIED_OVER_PREFIX) ||
    topics.toLowerCase().includes("quiz score");

  const result = [...rows];

  for (let offset = 1; offset <= 7; offset++) {
    const date = addDaysToDateString(context.today, offset - 1);
    for (const subject of context.subjects) {
      let cap = subjectDailyCapMins(context, subject.id);
      while (totalMinsOnDate(result, date, subject.id) > cap) {
        const candidates = result
          .map((row, index) => ({ row, index }))
          .filter(
            ({ row }) =>
              row.date === date &&
              row.subject_id === subject.id &&
              !protectedTopics(row.topics) &&
              (row.session_type === "Reading" ||
                row.session_type.toLowerCase() === "reading"),
          );
        if (candidates.length === 0) break;
        const removeIndex = candidates[candidates.length - 1].index;
        result.splice(removeIndex, 1);
        cap += 0;
      }
    }
  }

  return result;
}

function injectCarryOver(
  rows: Schedule[],
  context: PlannerContext,
): Schedule[] {
  const result = [...rows];

  for (const missed of context.missed_tasks) {
    const covered = result.some((r) =>
      topicsReflectMissedTask(r.topics, missed),
    );
    if (covered) continue;

    const date = addDaysToDateString(context.today, 0);
    result.unshift({
      date,
      subject_id: missed.subject_id,
      duration_mins: missed.duration_mins,
      topics: `${CARRIED_OVER_PREFIX} ${missed.topics}`,
      session_type: missed.session_type || "Reading",
    });
  }

  return result;
}

function injectWeakQuizRevisions(
  rows: Schedule[],
  context: PlannerContext,
): Schedule[] {
  const result = [...rows];
  const weakAudits = context.performance_audits.filter((a) => a.weak);

  for (const audit of weakAudits) {
    if (result.some((r) => topicsReflectWeakAudit(r.topics, audit))) {
      continue;
    }

    const subject = context.subjects.find((s) => s.id === audit.subject_id);
    const dailyHours = subject?.daily_hours ?? 1;
    const duration_mins = Math.min(Math.round(dailyHours * 60), 90);

    const date = addDaysToDateString(context.today, 0);
    result.unshift({
      date,
      subject_id: audit.subject_id,
      duration_mins,
      topics: `Revision: Review [${audit.filename}] (Quiz score ${audit.score_percent}% — focus on weak areas)`,
      session_type: "Exam Prep",
    });
  }

  return result;
}

/**
 * Hybrid enforcement: guarantee carry-over and weak-quiz revision rows, then trim excess reading.
 */
export function enforceAdaptivePlan(
  llmRows: Schedule[],
  context: PlannerContext,
): Schedule[] {
  let rows = [...llmRows];
  rows = injectCarryOver(rows, context);
  rows = injectWeakQuizRevisions(rows, context);
  rows = trimLowPrioritySlots(rows, context);
  return rows;
}
