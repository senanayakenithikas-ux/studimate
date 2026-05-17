"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

function AuthLoadingShell() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center">
      <Spinner />
    </div>
  );
}

function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mounted = useHasMounted();

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
