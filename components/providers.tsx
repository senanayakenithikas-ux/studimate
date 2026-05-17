"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProfileProvider } from "@/hooks/use-user-profile";
import { DEFAULT_THEME } from "@/lib/themes";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      themes={["default", "dark", "light"]}
      enableSystem={false}
      storageKey="studimate-theme"
      disableTransitionOnChange
    >
      <UserProfileProvider>{children}</UserProfileProvider>
    </ThemeProvider>
  );
}
