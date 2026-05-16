import type { Streak } from "@/types";
import { Card } from "@/components/ui/Card";

interface StreakWidgetProps {
  streak: Streak;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
  return (
    <Card title="Study streak">
      <div className="flex items-end gap-6">
        <div>
          <p className="text-3xl font-bold text-white">{streak.current}</p>
          <p className="text-sm text-zinc-500">Current days</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-zinc-300">{streak.longest}</p>
          <p className="text-sm text-zinc-500">Longest streak</p>
        </div>
      </div>
    </Card>
  );
}
