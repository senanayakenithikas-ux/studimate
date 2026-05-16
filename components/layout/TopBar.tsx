"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { clearAuthToken } from "@/lib/auth";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const router = useRouter();

  function handleLogout() {
    clearAuthToken();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Log out
      </Button>
    </header>
  );
}
