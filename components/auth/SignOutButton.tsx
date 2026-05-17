"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { clearAppSession } from "@/lib/app-tab-session";
import { clearAccessTokenCache } from "@/lib/client-fetch";
import { clearProfileCache } from "@/hooks/use-user-profile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  /** When set, renders a labeled button instead of icon-only. */
  label?: string;
}

export function SignOutButton({ className, label }: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearAccessTokenCache();
      clearProfileCache();
      clearAppSession();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  if (label) {
    return (
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isLoading}
        className={cn(
          "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50",
          className,
        )}
      >
        {isLoading ? "Signing out…" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={isLoading}
      className={cn(
        "p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors disabled:opacity-50",
        className,
      )}
      aria-label="Log out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
