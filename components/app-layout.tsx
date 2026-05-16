"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/bottom-nav";
import {
  UserProfileProvider,
  useUserProfile,
} from "@/hooks/use-user-profile";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function AppLayoutInner({ children, title }: AppLayoutProps) {
  const { displayName } = useUserProfile();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={displayName} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userName={displayName} title={title} />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <UserProfileProvider>
      <AppLayoutInner title={title}>{children}</AppLayoutInner>
    </UserProfileProvider>
  );
}
