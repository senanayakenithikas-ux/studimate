import type { QuizQuestion, WeeklySchedule } from "@/types";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

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
    {
      day: "Friday",
      time: "10:30",
      subjectId: "sub-1",
      subjectName: "Mathematics",
      topic: "Past paper questions",
      durationMinutes: 90,
    },
  ],
};

const MOCK_QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2"],
    correctIndex: 1,
  },
  {
    id: "q2",
    question: "Which law relates force, mass, and acceleration?",
    options: [
      "Ohm's law",
      "Newton's second law",
      "Boyle's law",
      "Snell's law",
    ],
    correctIndex: 1,
  },
];

export function buildPlannerPrompt(subjects: string[]): string {
  return `Generate a weekly study schedule for: ${subjects.join(", ")}`;
}

export function buildQuizPrompt(materialText: string): string {
  return `Generate a quiz from this material:\n${materialText.slice(0, 2000)}`;
}

export function buildTutorPrompt(materialText: string, question: string): string {
  return `Material:\n${materialText.slice(0, 1500)}\n\nStudent question: ${question}`;
}

export async function chatCompletion(
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return `Stub tutor reply: I received your question about "${lastUser?.content ?? "your topic"}". Connect MINIMAX_API_KEY for real responses.`;
  }

  // TODO: wire real MiniMax API when credentials are configured
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return `MiniMax placeholder: ${lastUser?.content ?? "Hello"}`;
}

export function mockWeeklySchedule(): WeeklySchedule {
  return MOCK_SCHEDULE;
}

export function mockQuizQuestions(): QuizQuestion[] {
  return MOCK_QUIZ;
}
