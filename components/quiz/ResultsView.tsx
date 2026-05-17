"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Home, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizAnswerResult {
  questionId: string;
  correct: boolean;
}

interface ResultsViewProps {
  correctAnswers: number;
  totalQuestions: number;
  results: QuizAnswerResult[];
  onRestart: () => void;
}

function CircularProgress({ value, max }: { value: number; max: number }) {
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
                : "text-rose-400",
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

export function ResultsView({
  correctAnswers,
  totalQuestions,
  results,
  onRestart,
}: ResultsViewProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold text-foreground mb-6">Quiz Complete!</h2>

      <div className="flex justify-center mb-8">
        <CircularProgress value={correctAnswers} max={totalQuestions} />
      </div>

      <p className="text-lg text-muted-foreground mb-8">
        {correctAnswers === totalQuestions
          ? "Perfect score! You nailed it!"
          : correctAnswers >= totalQuestions * 0.8
            ? "Great job! Keep up the good work!"
            : correctAnswers >= totalQuestions * 0.5
              ? "Not bad! Review the topics you missed."
              : "Keep practicing! You'll get there."}
      </p>

      <div className="bg-card rounded-xl border border-border p-4 mb-8">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {results.map((result, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-lg flex items-center justify-center",
                result.correct ? "bg-emerald-500/20" : "bg-rose-500/20",
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

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onRestart}
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
  );
}
