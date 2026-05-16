"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { StreakWidget } from "@/components/dashboard/StreakWidget";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { TodayPlan } from "@/components/dashboard/TodayPlan";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/client-fetch";
import { MOCK_SESSIONS } from "@/lib/mock-data";
import type { Streak, Subject } from "@/types";

export default function DashboardPage() {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const [streakData, subjectsData] = await Promise.all([
          apiFetch<Streak>("/api/streaks"),
          apiFetch<Subject[]>("/api/subjects"),
        ]);
        setStreak(streakData);
        setSubjects(subjectsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleComplete(sessionId: string) {
    await apiFetch("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
  }

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" />
        <div className="flex flex-1 items-center justify-center p-8">
          <Spinner />
        </div>
      </>
    );
  }

  if (error || !streak) {
    return (
      <>
        <TopBar title="Dashboard" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <p className="text-sm text-red-400">
            {error ?? "Failed to load dashboard"}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="space-y-6 p-6">
        <StreakWidget streak={streak} />
        <TodayPlan sessions={MOCK_SESSIONS} onComplete={handleComplete} />
        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Subjects</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
