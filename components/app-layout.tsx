"use client";

import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

interface AppLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

export function AppLayout({ children, userName }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={userName} />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
