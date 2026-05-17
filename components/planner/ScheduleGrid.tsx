"use client";

import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlannerDaySchedule } from "@/lib/schedule-map";

interface Session {
  id: number;
  subject: string;
  topic: string;
  duration: number;
  startTime: string;
  completed: boolean;
}

type DaySchedule = PlannerDaySchedule;

const subjectColors: Record<
  string,
  { border: string; bg: string; bgHover: string; text: string; accent: string }
> = {
  Mathematics: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/15",
    bgHover: "bg-blue-500/25",
    text: "text-blue-400",
    accent: "#3b82f6",
  },
  Physics: {
    border: "border-l-cyan-500",
    bg: "bg-cyan-500/15",
    bgHover: "bg-cyan-500/25",
    text: "text-cyan-400",
    accent: "#06b6d4",
  },
  Chemistry: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/15",
    bgHover: "bg-amber-500/25",
    text: "text-amber-400",
    accent: "#f59e0b",
  },
  Biology: {
    border: "border-l-red-500",
    bg: "bg-red-500/15",
    bgHover: "bg-red-500/25",
    text: "text-red-400",
    accent: "#ef4444",
  },
  History: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/15",
    bgHover: "bg-emerald-500/25",
    text: "text-emerald-400",
    accent: "#10b981",
  },
};

const defaultColors = {
  border: "border-l-slate-500",
  bg: "bg-slate-500/15",
  bgHover: "bg-slate-500/25",
  text: "text-slate-400",
  accent: "#64748b",
};

// Time slots for full 24 hours
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  return `${i.toString().padStart(2, "0")}:00`;
});

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function SessionBlock({
  session,
  onToggle,
  isOpen,
  onOpen,
  onClose,
}: {
  session: Session;
  onToggle: () => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; openLeft: boolean } | null>(null);
  const colors = subjectColors[session.subject] || defaultColors;

  // Calculate height based on duration (60 min = 48px which is the row height)
  const height = (session.duration / 60) * 48;

  // Calculate top position based on start time
  const startMinutes = parseTime(session.startTime);
  const topOffset = (startMinutes / 60) * 48;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      onClose();
    } else {
      // Calculate popup position using fixed positioning
      if (blockRef.current) {
        const rect = blockRef.current.getBoundingClientRect();
        const popupWidth = 300;
        const viewportWidth = window.innerWidth;
        const openLeft = rect.right + popupWidth + 20 > viewportWidth;
        
        setPopupPosition({
          top: rect.top,
          left: openLeft ? rect.left - popupWidth - 12 : rect.right + 12,
          openLeft,
        });
      }
      onOpen();
    }
  };

  return (
    <div
      ref={blockRef}
      className={cn(
        "absolute left-0.5 right-0.5 transition-[z-index] duration-0",
        isOpen ? "z-[200]" : "z-10"
      )}
      style={{ top: `${topOffset}px`, height: `${height}px` }}
    >
      {/* Session Card */}
      <div
        onClick={handleClick}
        className={cn(
          "h-full rounded-md border-l-[3px] px-2 py-1.5 cursor-pointer transition-all duration-200 overflow-hidden",
          colors.border,
          isOpen ? colors.bgHover : colors.bg,
          session.completed && "opacity-60"
        )}
      >
        <p className={cn("text-xs font-semibold truncate", colors.text)}>
          {session.subject}
        </p>
        <p
          className={cn(
            "text-[11px] text-foreground/80 truncate mt-0.5",
            session.completed && "line-through"
          )}
        >
          {session.topic}
        </p>
        {session.completed && (
          <div className="absolute top-1.5 right-1.5">
            <Check className="w-3 h-3 text-emerald-400" />
          </div>
        )}
      </div>

      {/* Click Popout - Fixed position to escape overflow hidden */}
      {isOpen && popupPosition && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "fixed w-72 rounded-xl border-2 border-slate-700 p-4 animate-in fade-in zoom-in-95 duration-150 z-[9999]",
            popupPosition.openLeft 
              ? "slide-in-from-right-2" 
              : "slide-in-from-left-2"
          )}
          style={{ 
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            minWidth: "280px", 
            backgroundColor: "#0f0f17",
            boxShadow: "0 0 0 2px #0f0f17, 0 0 0 3px rgba(51,65,85,0.8), 0 25px 50px -12px rgba(0, 0, 0, 0.95)",
          }}
        >
          
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-1 h-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors.accent }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground leading-tight">
                {session.topic}
              </p>
              <p className={cn("text-sm font-medium mt-1", colors.text)}>
                {session.subject}
              </p>
            </div>
            {session.completed && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#064e3b" }}>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: "#1a1a24" }}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wide">Duration</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {session.duration} min
              </p>
            </div>
            <div className="rounded-lg p-2.5" style={{ backgroundColor: "#1a1a24" }}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wide">Time</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {session.startTime}
              </p>
            </div>
          </div>

          {/* Extra Info */}
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>Study Session</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>Focus: Deep learning</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid #2a2a3a" }}>
            <Checkbox
              checked={session.completed}
              onCheckedChange={onToggle}
              className="h-5 w-5 rounded border-muted-foreground/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <span className="text-sm text-muted-foreground">
              {session.completed ? "Completed" : "Mark as complete"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


function TimeGrid({
  schedule,
  onToggleSession,
}: {
  schedule: DaySchedule[];
  onToggleSession: (dayIndex: number, sessionId: number) => void;
}) {
  const [openSessionId, setOpenSessionId] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setOpenSessionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map schedule to day columns
  const dayScheduleMap = new Map<string, { dayIndex: number; sessions: Session[] }>();
  schedule.forEach((day, index) => {
    dayScheduleMap.set(day.day, { dayIndex: index, sessions: day.sessions });
  });

  return (
    <div ref={gridRef} className="bg-card/30 rounded-xl border border-border overflow-hidden max-h-[700px] overflow-y-auto">
      {/* Header Row - Days */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="p-3" /> {/* Empty cell for time column */}
        {daysOfWeek.map((day) => {
          const isWeekend = day === "Sat" || day === "Sun";
          return (
            <div
              key={day}
              className={cn(
                "py-3 text-center text-sm font-semibold border-l border-border",
                isWeekend ? "text-amber-400" : "text-foreground"
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="relative">
        {timeSlots.map((time) => (
          <div
            key={time}
            className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 last:border-b-0"
            style={{ height: "48px" }}
          >
            {/* Time Label */}
            <div className="flex items-start justify-end pr-3 pt-1 text-xs text-muted-foreground">
              {time}
            </div>

            {/* Day Columns */}
            {daysOfWeek.map((day) => (
              <div
                key={`${time}-${day}`}
                className="relative border-l border-border/50"
              />
            ))}
          </div>
        ))}

        {/* Session Blocks - Positioned Absolutely */}
        <div className="absolute inset-0 grid grid-cols-[60px_repeat(7,1fr)]">
          <div /> {/* Empty for time column */}
          {daysOfWeek.map((day) => {
            const dayData = dayScheduleMap.get(day);
            return (
              <div key={day} className="relative border-l border-border/50">
                {dayData?.sessions.map((session) => (
                  <SessionBlock
                    key={session.id}
                    session={session}
                    onToggle={() => onToggleSession(dayData.dayIndex, session.id)}
                    isOpen={openSessionId === session.id}
                    onOpen={() => setOpenSessionId(session.id)}
                    onClose={() => setOpenSessionId(null)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export function ScheduleGrid({
  schedule,
  onToggleSession,
}: {
  schedule: DaySchedule[];
  onToggleSession: (dayIndex: number, sessionId: number) => void;
}) {
  return <TimeGrid schedule={schedule} onToggleSession={onToggleSession} />;
}
