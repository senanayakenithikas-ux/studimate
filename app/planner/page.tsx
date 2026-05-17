"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { ScheduleGrid } from "@/components/planner/ScheduleGrid";
import { EmptySchedule } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  fetchPlannerScheduleForWeek,
  fetchSavedPlannerSchedule,
  generatePlannerSchedule,
  updatePlannerSchedule,
  weeklyScheduleHasSessions,
} from "@/lib/planner-client";
import { updateScheduleTaskCompleted } from "@/lib/today-schedule";
import {
  emptyWeekDaySchedule,
  weeklyScheduleToDaySchedule,
  type PlannerDaySchedule,
} from "@/lib/schedule-map";
import type { WeeklySchedule, Subject } from "@/types";
import { formatDateString, parseLocalDateString } from "@/lib/planner-dates";
import { apiFetch } from "@/lib/client-fetch";
import {
  buildSubjectColorMap,
  type SubjectColorStyle,
} from "@/lib/subject-colors";
import { RefreshCw, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

type DaySchedule = PlannerDaySchedule;

function WeekNavigator({
  weekLabel,
  onPrev,
  onNext,
}: {
  weekLabel: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg"
        onClick={onPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground min-w-[180px] justify-center">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {weekLabel}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg"
        onClick={onNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SubjectLegend({
  subjects,
  colorMap,
}: {
  subjects: Subject[];
  colorMap: Record<string, SubjectColorStyle>;
}) {
  if (subjects.length === 0) {
    return (
      <div className="bg-card/50 rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Subjects</h3>
        <p className="text-sm text-muted-foreground">
          Add subjects on your dashboard to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/50 rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Subjects</h3>
      <div className="space-y-2.5">
        {subjects.map((subject) => {
          const colors = colorMap[subject.name];
          return (
            <div key={subject.id} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors?.accent ?? "#64748b" }}
              />
              <span className="text-sm text-foreground">{subject.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyStats({ schedule }: { schedule: DaySchedule[] }) {
  const totalSessions = schedule.reduce(
    (acc, day) => acc + day.sessions.length,
    0,
  );
  const completedSessions = schedule.reduce(
    (acc, day) => acc + day.sessions.filter((s) => s.completed).length,
    0,
  );
  const totalMinutes = schedule.reduce(
    (acc, day) => acc + day.sessions.reduce((sum, s) => sum + s.duration, 0),
    0,
  );
  const completedMinutes = schedule.reduce(
    (acc, day) =>
      acc +
      day.sessions
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.duration, 0),
    0,
  );

  const progressPercent =
    totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return (
    <div className="bg-card/50 rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Weekly Progress
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Sessions</span>
            <span className="text-foreground font-medium">
              {completedSessions}/{totalSessions}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">
              {Math.round(totalMinutes / 60)}h
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Total
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-400">
              {Math.round(completedMinutes / 60)}h
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Done
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export default function PlannerPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  /** True once the user has any saved/generated plan (keeps grid visible while browsing weeks). */
  const [hasPlanner, setHasPlanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [rangeStart, setRangeStart] = useState(startOfToday);
  const weekCacheRef = useRef<Map<string, DaySchedule[]>>(new Map());
  const [userSubjects, setUserSubjects] = useState<Subject[]>([]);
  const subjectColorMap = buildSubjectColorMap(userSubjects);

  const getRangeLabel = () => {
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 6);
    const startStr = rangeStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = rangeEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startStr} - ${endStr}`;
  };

  const rangeKeyFor = useCallback((start: Date) => {
    return formatDateString(start);
  }, []);

  const displayRange = useCallback((start: Date, days: DaySchedule[]) => {
    const key = rangeKeyFor(start);
    weekCacheRef.current.set(key, days);
    setSchedule(days);
    setRangeStart(parseLocalDateString(key));
  }, [rangeKeyFor]);

  const applyWeeklySchedule = useCallback(
    (data: WeeklySchedule, options?: { replaceCache?: boolean }) => {
      if (options?.replaceCache) {
        weekCacheRef.current.clear();
      }

      if (weeklyScheduleHasSessions(data)) {
        setHasPlanner(true);
      }

      const rangeKey = data.weekStart ?? rangeKeyFor(startOfToday());
      const days = weeklyScheduleToDaySchedule({
        ...data,
        weekStart: rangeKey,
      });
      weekCacheRef.current.set(rangeKey, days);
      setSchedule(days);
      setRangeStart(parseLocalDateString(rangeKey));
    },
    [rangeKeyFor],
  );

  const loadRangeForDate = useCallback(
    async (start: Date) => {
      const key = rangeKeyFor(start);
      const cached = weekCacheRef.current.get(key);
      if (cached) {
        displayRange(start, cached);
        return;
      }

      setIsLoadingWeek(true);
      setError(null);
      try {
        const data = await fetchPlannerScheduleForWeek(key);
        const days = weeklyScheduleHasSessions(data)
          ? weeklyScheduleToDaySchedule({ ...data, weekStart: key })
          : emptyWeekDaySchedule(key);
        if (weeklyScheduleHasSessions(data)) {
          setHasPlanner(true);
        }
        displayRange(start, days);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load schedule",
        );
      } finally {
        setIsLoadingWeek(false);
      }
    },
    [displayRange, rangeKeyFor],
  );

  const loadSavedSchedule = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await fetchSavedPlannerSchedule();
      applyWeeklySchedule(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your schedule",
      );
      setHasPlanner(false);
      weekCacheRef.current.clear();
      setSchedule([]);
    } finally {
      setIsLoading(false);
    }
  }, [applyWeeklySchedule]);

  const loadUserSubjects = useCallback(async () => {
    try {
      const data = await apiFetch<Subject[]>("/api/subjects");
      setUserSubjects(data);
    } catch {
      setUserSubjects([]);
    }
  }, []);

  useEffect(() => {
    void loadSavedSchedule();
    void loadUserSubjects();
  }, [loadSavedSchedule, loadUserSubjects]);

  const goToPrevRange = () => {
    const newStart = new Date(rangeStart);
    newStart.setDate(rangeStart.getDate() - 7);
    setRangeStart(newStart);
    if (hasPlanner) {
      void loadRangeForDate(newStart);
    }
  };

  const goToNextRange = () => {
    const newStart = new Date(rangeStart);
    newStart.setDate(rangeStart.getDate() + 7);
    setRangeStart(newStart);
    if (hasPlanner) {
      void loadRangeForDate(newStart);
    }
  };

  async function runScheduleMutation(
    fetcher: () => Promise<WeeklySchedule>,
    errorMessage: string,
  ) {
    setIsBusy(true);
    setError(null);
    try {
      const data = await fetcher();
      applyWeeklySchedule(data, { replaceCache: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setIsBusy(false);
    }
  }

  const handleGenerateSchedule = () => {
    void runScheduleMutation(
      generatePlannerSchedule,
      "Failed to generate schedule",
    );
  };

  const handleUpdateSchedule = () => {
    void runScheduleMutation(
      updatePlannerSchedule,
      "Failed to update schedule",
    );
  };

  const toggleSession = async (dayIndex: number, sessionId: string) => {
    const day = schedule[dayIndex];
    const session = day?.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const nextCompleted = !session.completed;
    const snapshot = schedule;

    const nextSchedule = snapshot.map((d, i) =>
      i === dayIndex
        ? {
            ...d,
            sessions: d.sessions.map((s) =>
              s.id === sessionId ? { ...s, completed: nextCompleted } : s,
            ),
          }
        : d,
    );
    setSchedule(nextSchedule);
    weekCacheRef.current.set(rangeKeyFor(rangeStart), nextSchedule);

    try {
      await updateScheduleTaskCompleted(sessionId, nextCompleted);
    } catch {
      setSchedule(snapshot);
      weekCacheRef.current.set(rangeKeyFor(rangeStart), snapshot);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Planner</h1>
          <p className="text-sm text-muted-foreground">
            Your AI-generated study schedule for the next 7 days
          </p>
        </div>
        {hasPlanner && !isLoading && !isBusy && (
          <WeekNavigator
            weekLabel={getRangeLabel()}
            onPrev={goToPrevRange}
            onNext={goToNextRange}
          />
        )}
      </div>

      {error ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Loading your schedule..." />
        </div>
      ) : isBusy ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner
            size="lg"
            text={
              hasPlanner
                ? "Updating your schedule..."
                : "Generating your schedule..."
            }
          />
        </div>
      ) : !hasPlanner ? (
        <EmptySchedule onGenerate={handleGenerateSchedule} />
      ) : (
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="relative flex-1 min-w-0 overflow-x-auto">
            {isLoadingWeek ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]">
                <LoadingSpinner size="md" text="Loading week…" />
              </div>
            ) : null}
            <ScheduleGrid
              schedule={schedule}
              subjectColorMap={subjectColorMap}
              onToggleSession={toggleSession}
            />
          </div>

          <div className="xl:w-64 flex-shrink-0 space-y-4">
            <WeeklyStats schedule={schedule} />
            <SubjectLegend subjects={userSubjects} colorMap={subjectColorMap} />
            <Button
              onClick={handleUpdateSchedule}
              className="w-full"
              variant="secondary"
              disabled={isBusy}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Schedule
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
