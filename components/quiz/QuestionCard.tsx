"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

interface QuestionCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  showResult: boolean;
  onSelectAnswer: (index: number) => void;
}

export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  showResult,
  onSelectAnswer,
}: QuestionCardProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctIndex;

            return (
              <button
                key={index}
                type="button"
                onClick={() => onSelectAnswer(index)}
                disabled={showResult}
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
                      : "bg-card border-border hover:border-indigo-500/50",
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
                        : "bg-secondary text-muted-foreground",
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

      {showResult && (
        <div className="bg-secondary/50 rounded-xl border border-border p-4 mb-6">
          <p className="text-sm font-medium text-foreground mb-2">
            {selectedAnswer === question.correctIndex ? "Correct!" : "Incorrect"}
          </p>
          <p className="text-sm text-muted-foreground">
            The correct answer is{" "}
            {String.fromCharCode(65 + question.correctIndex)}:{" "}
            {question.options[question.correctIndex]}
          </p>
        </div>
      )}
    </>
  );
}
