export interface User {
  id: string;
  username: string;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  onboardingComplete: boolean;
}

export interface Subject {
  id: string;
  name: string;
  examDate: string;
  confidence: number;
}

export interface Material {
  id: string;
  subjectId: string;
  title: string;
  extractedText: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  scheduledAt: string;
}

export interface Streak {
  current: number;
  longest: number;
  lastStudyDate: string | null;
}

export interface PlannerSlot {
  day: string;
  time: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  durationMinutes: number;
}

export interface WeeklySchedule {
  weekStart: string;
  slots: PlannerSlot[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizResult {
  score: number;
  total: number;
  questions: QuizQuestion[];
  answers: number[];
}

export interface TutorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface SignupBody {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
