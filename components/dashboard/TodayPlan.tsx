import type { StudySession } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface TodayPlanProps {
  sessions: StudySession[];
  onComplete?: (sessionId: string) => void;
}

export function TodayPlan({ sessions, onComplete }: TodayPlanProps) {
  return (
    <Card title="Today's plan">
      <ul className="space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-white">{session.title}</p>
              <p className="text-xs text-zinc-500">
                {session.durationMinutes} min
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onComplete?.(session.id)}
            >
              Done
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
