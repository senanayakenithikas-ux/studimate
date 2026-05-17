"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";

function AuthLoadingShell() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center">
      <Spinner />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [mounted, router]);

  if (!mounted) {
    return <AuthLoadingShell />;
  }

  if (!isAuthenticated()) {
    return <AuthLoadingShell />;
  }

  return <>{children}</>;
}
