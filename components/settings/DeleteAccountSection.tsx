"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { clearAppSession } from "@/lib/app-tab-session";
import { apiFetch, clearAccessTokenCache } from "@/lib/client-fetch";
import { clearProfileCache } from "@/hooks/use-user-profile";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccountSection() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setError(null);

    try {
      await apiFetch<{ deleted: boolean }>("/api/users/account", {
        method: "DELETE",
      });

      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Auth user is already removed server-side
      }

      clearAccessTokenCache();
      clearProfileCache();
      clearAppSession();
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete account",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="space-y-4 pt-8 border-t border-border">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Danger zone</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Permanently delete your account and all associated data.
        </p>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/15">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Delete account</p>
            <p className="text-sm text-muted-foreground">
              This removes your subjects, study materials, quizzes, schedules,
              tutor chats, streaks, and uploaded files. This cannot be undone.
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                All of your Studimate data will be permanently deleted,
                including study materials stored in the cloud. You will be
                signed out immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  void handleDeleteAccount();
                }}
              >
                {isDeleting ? (
                  <LoadingSpinner
                    size="sm"
                    className="text-destructive-foreground"
                  />
                ) : (
                  "Yes, delete everything"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
