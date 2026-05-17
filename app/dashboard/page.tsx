"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { useUserProfile } from "@/hooks/use-user-profile";
import { StreakWidget } from "@/components/dashboard/StreakWidget";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { TodayPlan } from "@/components/dashboard/TodayPlan";
import { CardSkeleton, LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client-fetch";
import type { Streak, Subject as ApiSubject } from "@/types";
import { Calendar, Brain, MessageSquare, Sparkles, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";


function QuickActions() {
  const actions = [
    {
      label: "Planner",
      href: "/planner",
      icon: Calendar,
      color: "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30",
    },
    {
      label: "Start Quiz",
      href: "/quiz",
      icon: Brain,
      color: "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30",
    },
    {
      label: "Ask Tutor",
      href: "/tutor",
      icon: MessageSquare,
      color: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href}>
            <Button
              variant="ghost"
              className={cn(
                "rounded-full px-4 py-2 h-auto font-medium transition-all duration-200",
                action.color
              )}
            >
              <Icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

const subjectColors = ["indigo", "violet", "emerald", "amber", "rose", "cyan"] as const;

type DashboardSubject = {
  id: string;
  name: string;
  examDate: string;
  confidence: number;
  dailyHours: number;
  progress: number;
  color: (typeof subjectColors)[number];
};

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
}

function DashboardContent() {
  const { displayName } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [subjects, setSubjects] = useState<DashboardSubject[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    examDate: "",
    dailyHours: 1,
    confidence: 5,
  });

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const [streakData, subjectsData] = await Promise.all([
          apiFetch<Streak>("/api/streaks"),
          apiFetch<ApiSubject[]>("/api/subjects"),
        ]);
        setStreak(streakData.current);
        setSubjects(
          subjectsData.map((s, i) => ({
            id: s.id,
            name: s.name,
            examDate: s.examDate,
            confidence: s.confidence,
            dailyHours: 1,
            progress: 0,
            color: subjectColors[i % subjectColors.length],
          })),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const handleAddSubject = async () => {
    if (isAddingSubject || !newSubject.name || !newSubject.examDate) return;

    setIsAddingSubject(true);
    try {
      const created = await apiFetch<ApiSubject>("/api/subjects", {
        method: "POST",
        body: JSON.stringify({
          name: newSubject.name,
          examDate: newSubject.examDate,
          confidence: Math.min(5, Math.max(1, newSubject.confidence)),
        }),
      });
      const colorIndex = subjects.length % subjectColors.length;
      setSubjects((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          examDate: created.examDate,
          confidence: created.confidence,
          dailyHours: newSubject.dailyHours,
          progress: 0,
          color: subjectColors[colorIndex],
        },
      ]);
      setNewSubject({ name: "", examDate: "", dailyHours: 1, confidence: 5 });
      setIsAddDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add subject");
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleAddDialogOpenChange = (open: boolean) => {
    if (!open && isAddingSubject) return;
    setIsAddDialogOpen(open);
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {displayName}
            </h1>
            <p className="text-muted-foreground">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-muted-foreground">AI-powered</span>
          </div>
        </div>
      </div>

      {error && !isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Row: Streak + Today's Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StreakWidget streak={streak} />
            <TodayPlan />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <QuickActions />
          </div>

          {/* Subjects Progress */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Your Subjects
              </h2>
              <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Subject
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" style={{ backgroundColor: "#0f0f17" }}>
                  <DialogHeader>
                    <DialogTitle>Add New Subject</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Subject Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Mathematics"
                        value={newSubject.name}
                        disabled={isAddingSubject}
                        onChange={(e) =>
                          setNewSubject((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="examDate">Exam Date</Label>
                      <Input
                        id="examDate"
                        type="date"
                        value={newSubject.examDate}
                        disabled={isAddingSubject}
                        onChange={(e) =>
                          setNewSubject((prev) => ({ ...prev, examDate: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyHours">Daily Hours</Label>
                        <Input
                          id="dailyHours"
                          type="number"
                          min="0.5"
                          max="8"
                          step="0.5"
                          value={newSubject.dailyHours}
                          disabled={isAddingSubject}
                          onChange={(e) =>
                            setNewSubject((prev) => ({
                              ...prev,
                              dailyHours: parseFloat(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confidence">Confidence (1-10)</Label>
                        <Input
                          id="confidence"
                          type="number"
                          min="1"
                          max="10"
                          value={newSubject.confidence}
                          disabled={isAddingSubject}
                          onChange={(e) =>
                            setNewSubject((prev) => ({
                              ...prev,
                              confidence: parseInt(e.target.value) || 5,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => void handleAddSubject()}
                      className="w-full mt-4"
                      disabled={
                        isAddingSubject ||
                        !newSubject.name ||
                        !newSubject.examDate
                      }
                    >
                      {isAddingSubject ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        "Add Subject"
                      )}
                    </Button>
                    {isAddingSubject ? (
                      <p className="text-center text-sm text-muted-foreground">
                        Adding subject…
                      </p>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  id={subject.id}
                  name={subject.name}
                  examDate={subject.examDate}
                  confidence={subject.confidence}
                  progress={subject.progress}
                  color={subject.color as "indigo" | "violet" | "emerald"}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
