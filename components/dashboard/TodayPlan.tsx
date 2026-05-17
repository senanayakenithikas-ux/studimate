"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Check } from "lucide-react";
import {
  fetchTodayScheduleTasks,
  updateScheduleTaskCompleted,
} from "@/lib/today-schedule";
import { cn } from "@/lib/utils";
import type { TodayScheduleTask } from "@/types";

function TaskCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
      onClick={onToggle}
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]",
        checked
          ? "border-indigo-400 bg-indigo-500"
          : "border-indigo-400/70 bg-transparent hover:border-indigo-400",
      )}
    >
      {checked ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
    </button>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: TodayScheduleTask;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl bg-slate-800/40 px-4 py-3.5 transition-opacity duration-200",
        task.completed && "opacity-55",
      )}
    >
      <TaskCheckbox
        checked={task.completed}
        onToggle={() => onToggle(task.id)}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold text-white",
            task.completed && "text-slate-400 line-through",
          )}
        >
          {task.subject}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-xs text-slate-400",
            task.completed && "text-slate-500 line-through",
          )}
        >
          {task.topic} • {task.duration} min
        </p>
      </div>
    </div>
  );
}

function TodayPlanSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-[68px] animate-pulse rounded-xl bg-slate-800/50"
        />
      ))}
    </div>
  );
}

export function TodayPlan() {
  const [tasks, setTasks] = useState<TodayScheduleTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setIsLoading(true);
      try {
        const rows = await fetchTodayScheduleTasks();
        if (!cancelled) {
          setTasks(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load today's plan",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    let snapshot: TodayScheduleTask[] = [];
    let nextCompleted: boolean | null = null;

    setTasks((current) => {
      snapshot = current;
      const task = current.find((t) => t.id === id);
      if (!task) return current;
      nextCompleted = !task.completed;
      return current.map((t) =>
        t.id === id ? { ...t, completed: nextCompleted! } : t,
      );
    });

    if (nextCompleted === null) return;

    try {
      await updateScheduleTaskCompleted(id, nextCompleted);
    } catch {
      setTasks(snapshot);
    }
  }, []);

  return (
    <div
      className="rounded-2xl border border-slate-700/60 bg-[#111827] p-6 shadow-lg shadow-black/20"
    >
      <h3 className="mb-5 flex items-center gap-2.5 text-base font-bold text-white">
        <Calendar className="h-5 w-5 text-indigo-400" aria-hidden />
        Today&apos;s Plan
      </h3>

      {isLoading ? (
        <TodayPlanSkeleton />
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-400">
          No study tasks for today.{" "}
          <Link
            href="/planner"
            className="text-indigo-400 underline-offset-2 hover:text-indigo-300 hover:underline"
          >
            Generate a plan
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
