"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { ScheduleGrid } from "@/components/planner/ScheduleGrid";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/client-fetch";
import type { WeeklySchedule } from "@/types";

export default function PlannerPage() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateSchedule() {
    setLoading(true);
    try {
      const data = await apiFetch<WeeklySchedule>("/api/ai/planner", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSchedule(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar title="Planner" />
      <div className="space-y-6 p-6">
        <Button onClick={generateSchedule} disabled={loading}>
          {loading ? "Generating..." : "Generate weekly schedule"}
        </Button>
        {schedule ? <ScheduleGrid schedule={schedule} /> : null}
      </div>
    </>
  );
}
