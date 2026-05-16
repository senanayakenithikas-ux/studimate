/**
 * Run: npm run test:planner-enforce
 */

import { buildPlannerContext } from "./planner-context";
import { enforceAdaptivePlan } from "./planner-enforce";
import type { Schedule } from "./minimax";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

const context = buildPlannerContext({
  today: "2026-05-17",
  subjects: [
    {
      id: "sub-a",
      name: "Math",
      exam_date: "2026-05-30",
      confidence_level: 3,
      daily_hours: 1,
    },
  ],
  materials: [
    {
      id: "mat-1",
      subject_id: "sub-a",
      filename: "calc.pdf",
      extracted_text: "content",
    },
  ],
  missedTasks: [
    {
      schedule_id: "sch-1",
      subject_id: "sub-a",
      date: "2026-05-10",
      topics: "Array structures reading",
      session_type: "Reading",
      duration_mins: 45,
    },
  ],
  quizzes: [
    {
      quiz_id: "qz-1",
      material_id: "mat-1",
      subject_id: "sub-a",
      filename: "calc.pdf",
      score: 2,
      question_count: 5,
    },
  ],
});

const emptyLlm: Schedule[] = [];
const enforced = enforceAdaptivePlan(emptyLlm, context);

assert(enforced.length >= 2, "injects carry-over and weak revision");
assert(
  enforced.some((r) => r.topics.startsWith("Carried Over:")),
  "carry-over prefix",
);
assert(
  enforced.some((r) => r.topics.includes("calc.pdf") && r.topics.includes("Quiz score")),
  "weak quiz revision cites filename",
);

const minimalLlm: Schedule[] = [
  {
    date: "2026-05-17",
    subject_id: "sub-a",
    duration_mins: 60,
    topics: "Generic reading",
    session_type: "Reading",
  },
];
const withDup = enforceAdaptivePlan(minimalLlm, context);
assert(
  withDup.filter((r) => r.topics.startsWith("Carried Over:")).length >= 1,
  "still injects carry-over when LLM omits it",
);

console.log("planner-enforce: all assertions passed");
