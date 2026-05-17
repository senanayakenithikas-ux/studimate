"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Plus, X, Calendar, Sparkles, ArrowRight, Check } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { cn } from "@/lib/utils";

interface Subject {
  id: number;
  name: string;
  examDate: string;
  confidence: number;
  dailyHours: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, name: "", examDate: "", confidence: 5, dailyHours: 1 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        id: Date.now(),
        name: "",
        examDate: "",
        confidence: 5,
        dailyHours: 1,
      },
    ]);
  };

  const removeSubject = (id: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  const updateSubject = (id: number, field: keyof Subject, value: string | number) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ onboardingComplete: true }),
      });
      await Promise.all(
        validSubjects.map((subject) =>
          apiFetch("/api/subjects", {
            method: "POST",
            body: JSON.stringify({
              name: subject.name,
              examDate: subject.examDate,
              confidence: Math.min(
                5,
                Math.max(1, Math.round(subject.confidence / 2)),
              ),
            }),
          }),
        ),
      );
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save onboarding",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validSubjects = subjects.filter((s) => s.name && s.examDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                step === currentStep
                  ? "bg-indigo-500 w-8"
                  : step < currentStep
                  ? "bg-indigo-500"
                  : "bg-slate-700"
              )}
            />
          ))}
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Studimate
            </span>
          </div>
        </div>

        {/* Step 1: Add Subjects */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {"Let's figure out what you need to conquer"}
              </h1>
              <p className="text-muted-foreground">
                Add your subjects and we&apos;ll help you master them
              </p>
            </div>

            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div
                  key={subject.id}
                  className="bg-card rounded-xl border border-border p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Subject {index + 1}
                    </span>
                    {subjects.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubject(subject.id)}
                        className="h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subject Name</Label>
                      <Input
                        placeholder="e.g. Mathematics"
                        value={subject.name}
                        onChange={(e) =>
                          updateSubject(subject.id, "name", e.target.value)
                        }
                        className="bg-input border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Exam Date</Label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={subject.examDate}
                          onChange={(e) =>
                            updateSubject(subject.id, "examDate", e.target.value)
                          }
                          className="bg-input border-border"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>How confident are you? (1-10)</Label>
                      <span className="text-sm font-medium text-indigo-400">
                        {subject.confidence}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={subject.confidence}
                      onChange={(e) =>
                        updateSubject(
                          subject.id,
                          "confidence",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Daily study hours</Label>
                    <Input
                      type="number"
                      min="0.5"
                      max="8"
                      step="0.5"
                      value={subject.dailyHours}
                      onChange={(e) =>
                        updateSubject(
                          subject.id,
                          "dailyHours",
                          parseFloat(e.target.value) || 1
                        )
                      }
                      className="bg-input border-border w-32"
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addSubject}
                className="w-full border-dashed border-border hover:border-indigo-500 hover:text-indigo-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add another subject
              </Button>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNext}
                disabled={validSubjects.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Looking good! Here&apos;s your study plan
              </h1>
              <p className="text-muted-foreground">
                Review your subjects before we create your personalized schedule
              </p>
            </div>

            <div className="space-y-3">
              {validSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-indigo-400 font-semibold">
                      {subject.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Exam: {new Date(subject.examDate).toLocaleDateString()} •{" "}
                      {subject.dailyHours}h/day • Confidence: {subject.confidence}/10
                    </p>
                  </div>
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-500"
              >
                Looks good!
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {currentStep === 3 && (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                You&apos;re all set!
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your personalized study journey begins now. We&apos;ll help you stay
                on track and ace your exams.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 max-w-sm mx-auto">
              <div className="text-4xl font-bold text-indigo-400 mb-2">
                {validSubjects.length}
              </div>
              <p className="text-muted-foreground">
                {validSubjects.length === 1 ? "Subject" : "Subjects"} ready to
                conquer
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4 max-w-xs mx-auto">
              {error ? (
                <p className="text-sm text-destructive text-center">{error}</p>
              ) : null}
              <Button
                onClick={handleFinish}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 h-12 text-base"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-muted-foreground"
              >
                Go back and edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
