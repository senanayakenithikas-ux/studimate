import type { WeeklySchedule } from "@/types";
import { Card } from "@/components/ui/Card";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface ScheduleGridProps {
  schedule: WeeklySchedule;
}

export function ScheduleGrid({ schedule }: ScheduleGridProps) {
  return (
    <Card title={`Week of ${schedule.weekStart}`}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => {
          const slots = schedule.slots.filter((s) => s.day === day);
          return (
            <div
              key={day}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
            >
              <h4 className="mb-2 text-sm font-medium text-zinc-400">{day}</h4>
              {slots.length === 0 ? (
                <p className="text-xs text-zinc-600">No sessions</p>
              ) : (
                <ul className="space-y-2">
                  {slots.map((slot, i) => (
                    <li key={`${day}-${i}`} className="text-sm">
                      <p className="font-medium text-white">
                        {slot.time} · {slot.subjectName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {slot.topic} ({slot.durationMinutes}m)
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
