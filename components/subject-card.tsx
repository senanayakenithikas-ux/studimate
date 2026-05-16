"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface SubjectCardProps {
  id: number;
  name: string;
  examDate: string;
  confidence: number;
  progress: number;
  color?: "indigo" | "violet" | "emerald";
  className?: string;
}

export function SubjectCard({
  id,
  name,
  examDate,
  confidence,
  progress,
  color = "indigo",
  className,
}: SubjectCardProps) {
  // Calculate days until exam
  const today = new Date();
  const exam = new Date(examDate);
  const diffTime = exam.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const colorStyles = {
    indigo: "border-l-indigo-500",
    violet: "border-l-violet-500",
    emerald: "border-l-emerald-500",
  };

  const confidenceBadgeColor = () => {
    if (confidence >= 7) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (confidence >= 4) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  };

  return (
    <Link href={`/subjects/${id}`}>
      <div
        className={cn(
          "group bg-card rounded-xl border border-border p-4 transition-all duration-200 hover:bg-secondary/50 hover:border-primary/30 border-l-4 cursor-pointer",
          colorStyles[color],
          className
        )}
      >
      <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {daysLeft > 0 ? `${daysLeft} days left` : "Exam passed"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs font-medium", confidenceBadgeColor())}
            >
              {confidence}/10
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <ProgressBar value={progress} color={color} />
        </div>
      </div>
    </Link>
  );
}
