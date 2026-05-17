"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { APP_THEMES, DEFAULT_THEME } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";

const themeIcons = {
  default: Monitor,
  dark: Moon,
  light: Sun,
} as const;

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? (theme ?? DEFAULT_THEME) : DEFAULT_THEME;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how Studimate looks on this device.
        </p>
      </div>

      <RadioGroup
        value={activeTheme}
        onValueChange={setTheme}
        className="grid gap-3"
        disabled={!mounted}
      >
        {APP_THEMES.map((option) => {
          const Icon = themeIcons[option.id];
          const selected = activeTheme === option.id;

          return (
            <Label
              key={option.id}
              htmlFor={`theme-${option.id}`}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40",
                selected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
                !mounted && "pointer-events-none opacity-70",
              )}
            >
              <RadioGroupItem
                value={option.id}
                id={`theme-${option.id}`}
                className="sr-only"
              />
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  selected
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <div
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full border-2",
                  selected ? "border-primary bg-primary" : "border-muted-foreground/30",
                )}
                aria-hidden
              >
                {selected ? (
                  <span className="flex h-full w-full items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </span>
                ) : null}
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
