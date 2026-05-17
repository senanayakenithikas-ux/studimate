"use client";

import type { ReactNode } from "react";
import { UserProfileProvider } from "@/hooks/use-user-profile";

export function AppProviders({ children }: { children: ReactNode }) {
  return <UserProfileProvider>{children}</UserProfileProvider>;
}
