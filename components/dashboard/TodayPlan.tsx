"use client";

import { Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface TodayPlanSession {
  id: number;
  subject: string;
  topic: string;
  duration: number;
  completed: boolean;
}

interface TodayPlanProps {
  sessions: TodayPlanSession[];
  onToggleSession: (id: number) => void;
}

export function TodayPlan({ sessions, onToggleSession }: TodayPlanProps) {
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
              session.completed && "opacity-60",
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
                  session.completed && "line-through text-muted-foreground",
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
