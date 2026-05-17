"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon, FileQuestion, Calendar, BookOpen, Upload } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-primary hover:bg-primary/90">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function EmptySchedule({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No schedule yet"
      description="Generate your first AI-powered study schedule to get started"
      actionLabel="Generate Schedule"
      onAction={onGenerate}
    />
  );
}

export function EmptyQuiz({ onStart }: { onStart?: () => void }) {
  return (
    <EmptyState
      icon={BookOpen}
      title="No quiz selected"
      description="Select a study material to generate practice questions"
      actionLabel="Select Material"
      onAction={onStart}
    />
  );
}

export function EmptyMaterials({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={Upload}
      title="No materials uploaded"
      description="Upload your study materials to get started with AI-powered learning"
      actionLabel="Upload Material"
      onAction={onUpload}
    />
  );
}
