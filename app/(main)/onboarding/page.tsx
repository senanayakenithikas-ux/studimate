"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/lib/client-fetch";

export default function OnboardingPage() {
  const router = useRouter();
  const [subjectName, setSubjectName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ onboardingComplete: true }),
      });
      await apiFetch("/api/subjects", {
        method: "POST",
        body: JSON.stringify({ name: subjectName, examDate, confidence }),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save onboarding",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar title="Onboarding" />
      <div className="mx-auto max-w-lg p-6">
        <Card title="Set up your subjects">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Subject name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />
            <Input
              label="Exam date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">
                Confidence (1–5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-zinc-500">Level {confidence}</p>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Continue to dashboard"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
