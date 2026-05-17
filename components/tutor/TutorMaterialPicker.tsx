"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TutorMaterialOption {
  id: string;
  name: string;
  subject: string;
}

interface TutorMaterialPickerProps {
  materials: TutorMaterialOption[];
  selected: TutorMaterialOption;
  onSelect: (material: TutorMaterialOption) => void;
  disabled?: boolean;
  className?: string;
}

export function TutorMaterialPicker({
  materials,
  selected,
  onSelect,
  disabled = false,
  className,
}: TutorMaterialPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative shrink-0", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="border-border hover:border-indigo-500/50"
      >
        <FileText className="w-4 h-4 mr-2 text-indigo-400" />
        <span className="max-w-[140px] truncate sm:max-w-[180px]">
          {selected.name}
        </span>
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-card shadow-lg">
          <div className="p-2">
            {materials.map((material) => (
              <button
                key={material.id || "empty"}
                type="button"
                onClick={() => {
                  onSelect(material);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                  selected.id === material.id
                    ? "bg-indigo-500/10"
                    : "hover:bg-secondary",
                )}
              >
                <FileText className="h-4 w-4 text-indigo-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {material.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {material.subject}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
