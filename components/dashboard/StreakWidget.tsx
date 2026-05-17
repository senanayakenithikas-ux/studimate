"use client";

import { Flame } from "lucide-react";

interface StreakWidgetProps {
  streak: number;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
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
