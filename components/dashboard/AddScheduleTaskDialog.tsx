"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";
import { getTodayDateString } from "@/lib/planner-dates";
import { createSubject, insertScheduleTask } from "@/lib/today-schedule";
import type { DbSubject } from "@/types/schedule";
import type { TodayScheduleTask } from "@/types";

const NEW_SUBJECT_VALUE = "__new__";

interface AddScheduleTaskDialogProps {
  subjects: DbSubject[];
  onSubjectCreated: (subject: DbSubject) => void;
  onTaskCreated: (task: TodayScheduleTask, scheduledDate: string) => void;
}

export function AddScheduleTaskDialog({
  subjects,
  onSubjectCreated,
  onTaskCreated,
}: AddScheduleTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subjectSelection, setSubjectSelection] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [topic, setTopic] = useState("");
  const [durationMins, setDurationMins] = useState("60");
  const [date, setDate] = useState(getTodayDateString());

  useEffect(() => {
    if (open) {
      setDate(getTodayDateString());
      setError(null);
    }
  }, [open]);

  const isNewSubject = subjectSelection === NEW_SUBJECT_VALUE;

  function resetForm() {
    setSubjectSelection("");
    setNewSubjectName("");
    setTopic("");
    setDurationMins("60");
    setDate(getTodayDateString());
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const duration = Number.parseInt(durationMins, 10);

      let subjectId: string;
      if (isNewSubject) {
        const created = await createSubject(newSubjectName);
        subjectId = created.id;
        onSubjectCreated(created);
      } else {
        subjectId = subjectSelection;
      }

      const task = await insertScheduleTask({
        subjectId,
        topics: topic,
        durationMins: duration,
        date,
      });

      onTaskCreated(task, date);
      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent
        className="border-slate-700 bg-[#111827] text-white sm:max-w-md"
        style={{ backgroundColor: "#111827" }}
      >
        <DialogHeader>
          <DialogTitle>Schedule a study task</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-subject">Subject</Label>
            <Select
              value={subjectSelection}
              onValueChange={setSubjectSelection}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="schedule-subject"
                className="border-slate-600 bg-slate-900/80"
              >
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_SUBJECT_VALUE}>
                  + Create new subject…
                </SelectItem>
              </SelectContent>
            </Select>
            {isNewSubject ? (
              <Input
                placeholder="New subject name"
                value={newSubjectName}
                disabled={isSubmitting}
                className="border-slate-600 bg-slate-900/80"
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-topic">Topic</Label>
            <Input
              id="schedule-topic"
              placeholder="e.g. Integration Techniques"
              value={topic}
              disabled={isSubmitting}
              className="border-slate-600 bg-slate-900/80"
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-duration">Duration (min)</Label>
              <Input
                id="schedule-duration"
                type="number"
                min={1}
                max={480}
                value={durationMins}
                disabled={isSubmitting}
                className="border-slate-600 bg-slate-900/80"
                onChange={(e) => setDurationMins(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={date}
                disabled={isSubmitting}
                className="border-slate-600 bg-slate-900/80"
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting ||
              !topic.trim() ||
              !subjectSelection ||
              (isNewSubject && !newSubjectName.trim())
            }
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "Add to schedule"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

