"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
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
