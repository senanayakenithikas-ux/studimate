"use client";

import { AppLayout } from "@/components/app-layout";
import { ThemeSettings } from "@/components/settings/ThemeSettings";

export default function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your Studimate experience
        </p>
      </div>

      <div className="max-w-lg">
        <ThemeSettings />
      </div>
    </AppLayout>
  );
}
