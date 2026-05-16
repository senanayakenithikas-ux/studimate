"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ResultsView } from "@/components/quiz/ResultsView";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/client-fetch";
import type { QuizQuestion, QuizResult } from "@/types";

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startQuiz() {
    setLoading(true);
    setError(null);
    setResult(null);
    setIndex(0);
    setAnswers([]);
    setSelected(null);
    try {
      const data = await apiFetch<{ questions: QuizQuestion[] }>(
        "/api/ai/quiz",
        { method: "POST", body: JSON.stringify({ materialId: "mat-1" }) },
      );
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    setSelected(null);

    if (index >= questions.length - 1) {
      const score = nextAnswers.filter(
        (a, i) => a === questions[i].correctIndex,
      ).length;
      setResult({
        score,
        total: questions.length,
        questions,
        answers: nextAnswers,
      });
      return;
    }

    setIndex((i) => i + 1);
  }

  return (
    <>
      <TopBar title="Quiz" />
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        {questions.length === 0 && !result ? (
          <div className="space-y-3">
            <Button onClick={startQuiz} disabled={loading}>
              {loading ? "Loading quiz..." : "Start quiz"}
            </Button>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>
        ) : null}
        {result ? (
          <ResultsView result={result} />
        ) : questions.length > 0 ? (
          <QuestionCard
            question={questions[index]}
            selectedIndex={selected}
            onSelect={setSelected}
            onNext={handleNext}
            isLast={index === questions.length - 1}
          />
        ) : null}
      </div>
    </>
  );
}
