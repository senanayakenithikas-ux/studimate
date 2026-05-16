"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { SubjectCard } from "@/components/subject-card";
import { CardSkeleton } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  mockUser,
  mockSubjects,
  mockTodaySessions,
  type Subject,
  type Session,
} from "@/lib/mock-data";
import { Flame, Calendar, Brain, MessageSquare, Sparkles, Plus, X } from "lucide-react";
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

function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Flame className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm text-emerald-300/80">Current Streak</p>
          <p className="text-3xl font-bold text-emerald-400">{streak} days</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Keep it up! You&apos;re on fire!
      </p>
    </div>
  );
}

function TodaysPlanCard({
  sessions,
  onToggleSession,
}: {
  sessions: Session[];
  onToggleSession: (id: number) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-indigo-400" />
        Today&apos;s Plan
      </h3>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg bg-secondary/50 transition-all duration-200",
              session.completed && "opacity-60"
            )}
          >
            <Checkbox
              checked={session.completed}
              onCheckedChange={() => onToggleSession(session.id)}
              className="border-indigo-500 data-[state=checked]:bg-indigo-500"
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium text-sm text-foreground",
                  session.completed && "line-through text-muted-foreground"
                )}
              >
                {session.subject}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.topic} • {session.duration} min
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(mockUser);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    examDate: "",
    dailyHours: 1,
    confidence: 5,
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setSubjects(mockSubjects);
      setTodaySessions(mockTodaySessions);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const toggleSession = (id: number) => {
    setTodaySessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleAddSubject = () => {
    if (!newSubject.name || !newSubject.examDate) return;
    
    const newId = Math.max(...subjects.map((s) => s.id), 0) + 1;
    const colorIndex = subjects.length % subjectColors.length;
    
    const subject: Subject = {
      id: newId,
      name: newSubject.name,
      examDate: newSubject.examDate,
      confidence: newSubject.confidence,
      dailyHours: newSubject.dailyHours,
      progress: 0,
      color: subjectColors[colorIndex],
    };
    
    setSubjects((prev) => [...prev, subject]);
    setNewSubject({ name: "", examDate: "", dailyHours: 1, confidence: 5 });
    setIsAddDialogOpen(false);
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
    <AppLayout userName={user.name}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {user.name}
            </h1>
            <p className="text-muted-foreground">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-muted-foreground">AI-powered</span>
          </div>
        </div>
      </div>

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
            <StreakCard streak={user.streak} />
            <TodaysPlanCard
              sessions={todaySessions}
              onToggleSession={toggleSession}
            />
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
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                      onClick={handleAddSubject}
                      className="w-full mt-4"
                      disabled={!newSubject.name || !newSubject.examDate}
                    >
                      Add Subject
                    </Button>
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
    </AppLayout>
  );
}
