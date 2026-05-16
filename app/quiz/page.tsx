"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { EmptyQuiz } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { mockQuiz, mockMaterials, mockUser } from "@/lib/mock-data";
import {
  FileText,
  Upload,
  Check,
  X,
  ArrowRight,
  RotateCcw,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QuizStep = "select" | "loading" | "quiz" | "answer" | "results";

interface QuizResult {
  questionId: number;
  correct: boolean;
}

function CircularProgress({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-secondary"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500",
            percentage >= 80
              ? "text-emerald-400"
              : percentage >= 50
              ? "text-amber-400"
              : "text-rose-400"
          )}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">
          {value}/{max}
        </span>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const [step, setStep] = useState<QuizStep>("select");
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const quiz = mockQuiz;
  const question = quiz[currentQuestion];

  const handleStartQuiz = () => {
    if (!selectedMaterial) return;
    setStep("loading");
    setTimeout(() => {
      setStep("quiz");
    }, 2000);
  };

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    setShowExplanation(true);
    setStep("answer");
    const isCorrect = selectedAnswer === question.answer;
    setResults([...results, { questionId: question.id, correct: isCorrect }]);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.length - 1) {
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
    setResults([]);
    setShowExplanation(false);
  };

  const correctAnswers = results.filter((r) => r.correct).length;

  return (
    <AppLayout userName={mockUser.name}>
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

              <Button
                onClick={handleStartQuiz}
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

      {/* Quiz in Progress */}
      {(step === "quiz" || step === "answer") && (
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {quiz.length}
            </span>
            <div className="flex gap-1">
              {quiz.map((_, i) => (
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
                      : "bg-secondary"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {question.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.answer;
                const showResult = step === "answer";

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={step === "answer"}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left",
                      showResult
                        ? isCorrect
                          ? "bg-emerald-500/20 border-emerald-500"
                          : isSelected
                          ? "bg-rose-500/20 border-rose-500"
                          : "bg-card border-border opacity-50"
                        : isSelected
                        ? "bg-indigo-500/20 border-indigo-500"
                        : "bg-card border-border hover:border-indigo-500/50"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                        showResult
                          ? isCorrect
                            ? "bg-emerald-500 text-white"
                            : isSelected
                            ? "bg-rose-500 text-white"
                            : "bg-secondary text-muted-foreground"
                          : isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-foreground">{option}</span>
                    {showResult && isCorrect && (
                      <Check className="w-5 h-5 text-emerald-400" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <X className="w-5 h-5 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="bg-secondary/50 rounded-xl border border-border p-4 mb-6">
              <p className="text-sm font-medium text-foreground mb-2">
                Explanation
              </p>
              <p className="text-sm text-muted-foreground">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Actions */}
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
              {currentQuestion < quiz.length - 1 ? (
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

      {/* Results */}
      {step === "results" && (
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Quiz Complete!
          </h2>

          <div className="flex justify-center mb-8">
            <CircularProgress value={correctAnswers} max={quiz.length} />
          </div>

          <p className="text-lg text-muted-foreground mb-8">
            {correctAnswers === quiz.length
              ? "Perfect score! You nailed it!"
              : correctAnswers >= quiz.length * 0.8
              ? "Great job! Keep up the good work!"
              : correctAnswers >= quiz.length * 0.5
              ? "Not bad! Review the topics you missed."
              : "Keep practicing! You'll get there."}
          </p>

          {/* Summary */}
          <div className="bg-card rounded-xl border border-border p-4 mb-8">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center",
                    result.correct ? "bg-emerald-500/20" : "bg-rose-500/20"
                  )}
                >
                  {result.correct ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <X className="w-5 h-5 text-rose-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRestart}
              variant="outline"
              className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Link href="/dashboard">
              <Button className="bg-indigo-600 hover:bg-indigo-500">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
