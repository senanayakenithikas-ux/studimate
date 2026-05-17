"use client";

import Link from "next/link";
import { useUserProfile } from "@/hooks/use-user-profile";

interface TopBarProps {
  userName?: string;
  title?: string;
}

export function TopBar({ userName: userNameProp, title = "Studimate" }: TopBarProps) {
  const { displayName } = useUserProfile();
  const userName = userNameProp ?? displayName;

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="font-semibold text-foreground truncate">{title}</span>
      </Link>
      <span className="text-xs text-muted-foreground truncate max-w-[40%]">
        {userName}
      </span>
    </header>
  );
}
