"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { EmptyQuiz } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ResultsView } from "@/components/quiz/ResultsView";
import { Button } from "@/components/ui/button";
import { mockMaterials } from "@/lib/mock-data";
import { apiFetch } from "@/lib/client-fetch";
import type { QuizQuestion } from "@/types";
import { FileText, Upload, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type QuizStep = "select" | "loading" | "quiz" | "answer" | "results";

interface QuizAnswerResult {
  questionId: string;
  correct: boolean;
}

export default function QuizPage() {
  const [step, setStep] = useState<QuizStep>("select");
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [results, setResults] = useState<QuizAnswerResult[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = questions[currentQuestion];

  const handleStartQuiz = async () => {
    if (!selectedMaterial) return;
    setStep("loading");
    setError(null);
    setCurrentQuestion(0);
    setResults([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    try {
      const data = await apiFetch<{ questions: QuizQuestion[] }>(
        "/api/ai/quiz",
        {
          method: "POST",
          body: JSON.stringify({ materialId: `mat-${selectedMaterial}` }),
        },
      );
      setQuestions(data.questions);
      if (data.questions.length === 0) {
        setError("No questions were generated.");
        setStep("select");
        return;
      }
      setStep("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start quiz");
      setStep("select");
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    if (!question || selectedAnswer === null) return;
    setShowExplanation(true);
    setStep("answer");
    const isCorrect = selectedAnswer === question.correctIndex;
    setResults([
      ...results,
      { questionId: question.id, correct: isCorrect },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setStep("quiz");
    } else {
      setStep("results");
    }
  };

  const handleRestart = () => {
    setStep("select");
    setSelectedMaterial(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setQuestions([]);
    setResults([]);
    setShowExplanation(false);
    setError(null);
  };

  const correctAnswers = results.filter((r) => r.correct).length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Quiz Mode</h1>
        <p className="text-muted-foreground">
          Test your knowledge with AI-generated questions
        </p>
      </div>

      {/* Step 1: Select Material */}
      {step === "select" && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Select study material
          </h2>

          {mockMaterials.length === 0 ? (
            <EmptyQuiz onStart={() => {}} />
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {mockMaterials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => setSelectedMaterial(material.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                      selectedMaterial === material.id
                        ? "bg-indigo-500/10 border-indigo-500"
                        : "bg-card border-border hover:border-indigo-500/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {material.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {material.subject} • {material.size}
                      </p>
                    </div>
                    {selectedMaterial === material.id && (
                      <Check className="w-5 h-5 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>

              <Link
                href="/upload"
                className="flex items-center justify-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 mb-6"
              >
                <Upload className="w-4 h-4" />
                Upload new material
              </Link>

              {error ? (
                <p className="mb-4 text-sm text-destructive">{error}</p>
              ) : null}
              <Button
                onClick={() => void handleStartQuiz()}
                disabled={!selectedMaterial}
                className="w-full bg-indigo-600 hover:bg-indigo-500 h-12"
              >
                Generate 10 Questions
              </Button>
            </>
          )}
        </div>
      )}

      {/* Loading State */}
      {step === "loading" && (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Reading your notes..." />
        </div>
      )}

      {(step === "quiz" || step === "answer") && question && (
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-1 mb-6 justify-end">
            {questions.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i < currentQuestion
                    ? results[i]?.correct
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                    : i === currentQuestion
                      ? "bg-indigo-500"
                      : "bg-secondary",
                )}
              />
            ))}
          </div>
          <QuestionCard
            question={question}
            questionIndex={currentQuestion}
            totalQuestions={questions.length}
            selectedAnswer={selectedAnswer}
            showResult={step === "answer"}
            onSelectAnswer={handleSelectAnswer}
          />
          {step === "quiz" && selectedAnswer !== null && (
            <Button
              onClick={handleCheckAnswer}
              className="w-full bg-indigo-600 hover:bg-indigo-500 h-12"
            >
              Check Answer
            </Button>
          )}
          {step === "answer" && (
            <Button
              onClick={handleNextQuestion}
              className="w-full bg-indigo-600 hover:bg-indigo-500 h-12"
            >
              {currentQuestion < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                "See Results"
              )}
            </Button>
          )}
        </div>
      )}

      {step === "results" && (
        <ResultsView
          correctAnswers={correctAnswers}
          totalQuestions={questions.length}
          results={results}
          onRestart={handleRestart}
        />
      )}

    </AppLayout>
  );
}
