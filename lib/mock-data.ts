import type { Material, Profile, Streak, StudySession, Subject } from "@/types";

export const MOCK_PROFILE: Profile = {
  id: "user-1",
  username: "student",
  displayName: "Student",
  onboardingComplete: true,
};

export const MOCK_SUBJECTS: Subject[] = [
  {
    id: "sub-1",
    name: "Mathematics",
    examDate: "2026-06-15",
    confidence: 3,
  },
  {
    id: "sub-2",
    name: "Physics",
    examDate: "2026-06-22",
    confidence: 2,
  },
];

export const MOCK_STREAK: Streak = {
  current: 5,
  longest: 12,
  lastStudyDate: new Date().toISOString().slice(0, 10),
};

export const MOCK_SESSIONS: StudySession[] = [
  {
    id: "sess-1",
    subjectId: "sub-1",
    title: "Calculus review",
    durationMinutes: 45,
    completed: false,
    scheduledAt: new Date().toISOString(),
  },
  {
    id: "sess-2",
    subjectId: "sub-2",
    title: "Mechanics practice",
    durationMinutes: 30,
    completed: false,
    scheduledAt: new Date().toISOString(),
  },
];

export const MOCK_MATERIALS: Material[] = [
  {
    id: "mat-1",
    subjectId: "sub-1",
    title: "Chapter 4 Notes",
    extractedText: "Sample extracted text for mathematics material.",
    createdAt: new Date().toISOString(),
  },
];
