// Mock data for Studimate (Hours 1-6)

import type { Profile, Streak, Subject as ApiSubject } from "@/types";

export const mockUser = {
  name: "Yapa",
  streak: 7,
  email: "yapa@example.com",
};

export const mockSubjects = [
  {
    id: 1,
    name: "Mathematics",
    examDate: "2025-06-10",
    confidence: 6,
    dailyHours: 2,
    progress: 45,
    color: "indigo",
  },
  {
    id: 2,
    name: "Physics",
    examDate: "2025-06-14",
    confidence: 4,
    dailyHours: 1.5,
    progress: 30,
    color: "violet",
  },
  {
    id: 3,
    name: "History",
    examDate: "2025-06-20",
    confidence: 8,
    dailyHours: 1,
    progress: 70,
    color: "emerald",
  },
];

export const mockTodaySessions = [
  {
    id: 1,
    subject: "Mathematics",
    topic: "Integration Techniques",
    duration: 90,
    completed: false,
  },
  {
    id: 2,
    subject: "Physics",
    topic: "Wave Mechanics",
    duration: 60,
    completed: true,
  },
];

export const mockSchedule = [
  {
    day: "Mon",
    date: "2025-05-19",
    sessions: [
      { id: 1, subject: "Mathematics", topic: "Integration", duration: 90, startTime: "09:00", completed: false },
      { id: 2, subject: "Physics", topic: "Electromagnetism", duration: 60, startTime: "11:00", completed: true },
      { id: 12, subject: "Chemistry", topic: "Organic Chemistry", duration: 90, startTime: "14:00", completed: false },
    ],
  },
  {
    day: "Tue",
    date: "2025-05-20",
    sessions: [
      { id: 3, subject: "Mathematics", topic: "Differential Equations", duration: 60, startTime: "10:00", completed: false },
      { id: 4, subject: "Biology", topic: "Cell Biology", duration: 60, startTime: "13:00", completed: false },
    ],
  },
  {
    day: "Wed",
    date: "2025-05-21",
    sessions: [
      { id: 5, subject: "Physics", topic: "Thermodynamics", duration: 90, startTime: "15:00", completed: false },
    ],
  },
  {
    day: "Thu",
    date: "2025-05-22",
    sessions: [
      { id: 6, subject: "Chemistry", topic: "Inorganic Chemistry", duration: 90, startTime: "09:00", completed: false },
      { id: 7, subject: "Mathematics", topic: "Practice Problems", duration: 120, startTime: "11:00", completed: false },
    ],
  },
  {
    day: "Fri",
    date: "2025-05-23",
    sessions: [
      { id: 8, subject: "Biology", topic: "Genetics", duration: 90, startTime: "10:00", completed: false },
      { id: 13, subject: "Physics", topic: "Optics", duration: 60, startTime: "14:00", completed: false },
    ],
  },
  {
    day: "Sat",
    date: "2025-05-24",
    sessions: [],
  },
  {
    day: "Sun",
    date: "2025-05-25",
    sessions: [],
  },
];

export const mockQuiz = [
  {
    id: 1,
    question: "What is the integral of x²?",
    options: ["x³", "x³/3 + C", "2x", "x²/2"],
    answer: 1,
    explanation:
      "The integral of x² is found using the power rule: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C. So ∫x² dx = x³/3 + C.",
  },
  {
    id: 2,
    question: "What is the derivative of sin(x)?",
    options: ["-cos(x)", "cos(x)", "tan(x)", "-sin(x)"],
    answer: 1,
    explanation:
      "The derivative of sin(x) is cos(x). This is one of the fundamental trigonometric derivatives.",
  },
  {
    id: 3,
    question: "What is the formula for kinetic energy?",
    options: ["mgh", "½mv²", "mv", "ma"],
    answer: 1,
    explanation:
      "Kinetic energy is the energy of motion, calculated as KE = ½mv², where m is mass and v is velocity.",
  },
  {
    id: 4,
    question: "When did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    answer: 2,
    explanation:
      "World War II ended in 1945, with Germany surrendering in May and Japan in September after the atomic bombings.",
  },
  {
    id: 5,
    question: "What is Newton's Second Law?",
    options: ["F = ma", "E = mc²", "F = mv", "a = v/t"],
    answer: 0,
    explanation:
      "Newton's Second Law states that Force equals mass times acceleration (F = ma).",
  },
  {
    id: 6,
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answer: 2,
    explanation:
      "The chemical symbol for gold is Au, derived from the Latin word 'aurum'.",
  },
  {
    id: 7,
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Endoplasmic Reticulum"],
    answer: 2,
    explanation:
      "Mitochondria are known as the powerhouse of the cell because they generate most of the cell's ATP (energy).",
  },
  {
    id: 8,
    question: "What is the value of pi (π) to two decimal places?",
    options: ["3.12", "3.14", "3.16", "3.18"],
    answer: 1,
    explanation:
      "Pi (π) is approximately 3.14159..., so to two decimal places it is 3.14.",
  },
  {
    id: 9,
    question: "Who wrote the theory of relativity?",
    options: ["Isaac Newton", "Nikola Tesla", "Albert Einstein", "Stephen Hawking"],
    answer: 2,
    explanation:
      "Albert Einstein developed the theory of relativity, including both special relativity (1905) and general relativity (1915).",
  },
  {
    id: 10,
    question: "What is the speed of light in vacuum?",
    options: ["299,792 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
    answer: 0,
    explanation:
      "The speed of light in vacuum is approximately 299,792 kilometers per second (about 3 × 10⁸ m/s).",
  },
];

export const mockMaterials = [
  {
    id: 1,
    name: "Calculus Chapter 5.pdf",
    size: "2.4 MB",
    subject: "Mathematics",
    uploadedAt: "2025-05-15",
  },
  {
    id: 2,
    name: "Physics Notes - Waves.pdf",
    size: "1.8 MB",
    subject: "Physics",
    uploadedAt: "2025-05-14",
  },
  {
    id: 3,
    name: "WWII Summary.txt",
    size: "156 KB",
    subject: "History",
    uploadedAt: "2025-05-13",
  },
];

export const mockChatMessages = [
  {
    id: 1,
    role: "user" as const,
    content: "Can you explain integration by parts?",
  },
  {
    id: 2,
    role: "assistant" as const,
    content:
      "Integration by parts is a technique used to integrate products of functions. The formula is:\n\n∫u dv = uv - ∫v du\n\nTo use it:\n1. Choose u and dv from your integral\n2. Find du by differentiating u\n3. Find v by integrating dv\n4. Apply the formula\n\nWould you like me to work through an example?",
  },
];

export type Subject = (typeof mockSubjects)[number];
export type Session = (typeof mockTodaySessions)[number];
export type QuizQuestion = (typeof mockQuiz)[number];
export type Material = (typeof mockMaterials)[number];
export type ChatMessage = (typeof mockChatMessages)[number];

export const MOCK_SUBJECTS: ApiSubject[] = mockSubjects.map((s) => ({
  id: `sub-${s.id}`,
  name: s.name,
  examDate: s.examDate,
  confidence: Math.min(5, Math.max(1, Math.round(s.confidence / 2))),
}));

export const MOCK_STREAK: Streak = {
  current: mockUser.streak,
  longest: mockUser.streak,
  lastStudyDate: new Date().toISOString().slice(0, 10),
};

export const MOCK_PROFILE: Profile = {
  id: "profile-1",
  username: "student",
  displayName: mockUser.name,
  onboardingComplete: false,
};
