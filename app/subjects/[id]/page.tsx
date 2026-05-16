"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/progress-bar";
import {
  mockSubjects,
  mockMaterials,
  type Material,
} from "@/lib/mock-data";
import {
  ArrowLeft,
  FileText,
  Upload,
  Clock,
  Calendar,
  Brain,
  MessageSquare,
  Trash2,
  Download,
  Plus,
  BookOpen,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const colorStyles = {
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    text: "text-indigo-400",
    accent: "bg-indigo-500",
    badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    accent: "bg-violet-500",
    badge: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    accent: "bg-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    accent: "bg-amber-500",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    accent: "bg-rose-500",
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    accent: "bg-cyan-500",
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
};

type ColorKey = keyof typeof colorStyles;

function MaterialCard({
  material,
  color,
  onDelete,
}: {
  material: Material;
  color: ColorKey;
  onDelete: (id: number) => void;
}) {
  const styles = colorStyles[color];
  
  return (
    <div
      className={cn(
        "group bg-card rounded-xl border border-border p-4 transition-all duration-200 hover:border-border/80 hover:bg-secondary/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
            styles.bg
          )}
        >
          <FileText className={cn("w-6 h-6", styles.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{material.name}</p>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{material.size}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>
              {new Date(material.uploadedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-rose-400"
            onClick={() => onDelete(material.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SubjectPage() {
  const params = useParams();
  const subjectId = Number(params.id);
  
  const [subject, setSubject] = useState<typeof mockSubjects[0] | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const foundSubject = mockSubjects.find((s) => s.id === subjectId);
      setSubject(foundSubject || null);
      setMaterials(
        mockMaterials.filter((m) => m.subject === foundSubject?.name)
      );
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [subjectId]);

  const deleteMaterial = (id: number) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="h-32 bg-secondary rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-secondary rounded-xl" />
            <div className="h-24 bg-secondary rounded-xl" />
            <div className="h-24 bg-secondary rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!subject) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground mb-4">Subject not found</p>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const color = (subject.color as ColorKey) || "indigo";
  const styles = colorStyles[color];

  // Calculate days until exam
  const today = new Date();
  const exam = new Date(subject.examDate);
  const diffTime = exam.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                styles.bg
              )}
            >
              <BookOpen className={cn("w-7 h-7", styles.text)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                  {daysLeft > 0 ? `${daysLeft} days until exam` : "Exam passed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {subject.dailyHours}h daily goal
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/quiz">
              <Button variant="outline" className="gap-2">
                <Brain className="w-4 h-4" />
                Practice Quiz
              </Button>
            </Link>
            <Link href="/tutor">
              <Button variant="outline" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Ask Tutor
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={cn("rounded-xl border p-5", styles.bg, styles.border)}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", styles.bg)}>
              <TrendingUp className={cn("w-5 h-5", styles.text)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-foreground">{subject.progress}%</p>
            </div>
          </div>
          <ProgressBar value={subject.progress} color={color as "indigo" | "violet" | "emerald"} />
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="text-2xl font-bold text-foreground">{subject.confidence}/10</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Exam Date</p>
              <p className="text-2xl font-bold text-foreground">
                {new Date(subject.examDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Study Materials */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Study Materials</h2>
          <Link href="/upload">
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Material
            </Button>
          </Link>
        </div>

        {materials.length === 0 ? (
          <div className="bg-card rounded-xl border border-border border-dashed p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No materials yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Upload your study materials like PDFs, notes, or textbooks to get started with AI-powered learning.
            </p>
            <Link href="/upload">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Upload Your First Material
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                color={color}
                onDelete={deleteMaterial}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
