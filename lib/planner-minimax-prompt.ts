import type { PlannerContext } from "@/lib/planner-context";

export interface PlannerMiniMaxPrompt {
  systemPrompt: string;
  userPrompt: string;
}

const ADAPTIVE_RULES = `CRITICAL ALGORITHM RULES:
1. Runway Calculation: Use each subject's precomputed runway_days (days until exam_date). Prioritize shorter runway and lower effective_confidence.
2. Output Window: Map the long-term path but ONLY output schedule objects for the FIRST WEEK using date_offset 1–7 (1 = today).
3. Adaptive Carry-Over Rule: For every entry in missed_tasks, schedule high-priority carry-over sessions in date_offset 1 or 2. Prefix topics with "Carried Over:" when carrying forward.
4. Objective Weakness Adjustment: For performance_audits where weak is true, override self-reported confidence using effective_confidence. Allocate extra revision sessions citing that material's filename.
5. Resource Alignment: When assigning daily goals, explicitly reference uploaded filenames from study_materials in topics (e.g. "Review Chapter 2 from [filename.pdf]").`;

export function buildPlannerMiniMaxPrompt(
  context: PlannerContext,
): PlannerMiniMaxPrompt {
  const exampleSubjectId = context.subjects[0]?.id ?? "SUBJECT_UUID";
  const exampleJson = JSON.stringify({
    date_offset: 1,
    subject_id: exampleSubjectId,
    duration_mins: 90,
    topics:
      "Review Chapter 2 from [lecture-notes.pdf] (Focus on concepts missed in recent quiz)",
    session_type: "Exam Prep",
  });

  const systemPrompt = `You are the core Adaptive AI Engine for Studimate. Generate a highly specific 7-day calendar layout from the student ecosystem JSON provided.

${ADAPTIVE_RULES}

Return ONLY a raw JSON array. No markdown fences. No explanation.`;

  const userPrompt = `Today is ${context.today}.

Student ecosystem data:
${JSON.stringify(context)}

Output a JSON array of schedule objects for the next 7 days only (date_offset 1 through 7).
- Variable array length: allocate each subject's daily_hours across the week; multiple subjects may share the same date_offset.
- Each object MUST use: date_offset (integer 1–7), subject_id (UUID from subjects), duration_mins (integer), topics (string with filename when materials exist), session_type (string e.g. "Reading", "Exam Prep", "Revision").
Example object: ${exampleJson}`;

  return { systemPrompt, userPrompt };
}

export function formatPlannerPromptForLog(prompt: PlannerMiniMaxPrompt): string {
  const divider = "=".repeat(72);
  return [
    divider,
    "Studimate → MiniMax planner prompt",
    divider,
    "",
    "[system]",
    prompt.systemPrompt,
    "",
    "[user]",
    prompt.userPrompt,
    divider,
  ].join("\n");
}
