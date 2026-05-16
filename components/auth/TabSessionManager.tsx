"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  APP_SESSION_STORAGE_KEY,
  clearAppSession,
  hasAppSession,
  registerCurrentTab,
  unregisterCurrentTab,
} from "@/lib/app-tab-session";
import { createClient } from "@/lib/supabase/client";

export function TabSessionManager() {
  const router = useRouter();
  const signingOut = useRef(false);

  useEffect(() => {
    registerCurrentTab();

    async function reconcileStaleAuth() {
      if (signingOut.current) return;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!hasAppSession() && user) {
        signingOut.current = true;
        await supabase.auth.signOut();
        clearAppSession();
        router.push("/login");
        router.refresh();
      }
    }

    void reconcileStaleAuth();

    function onStorage(event: StorageEvent) {
      if (event.key !== APP_SESSION_STORAGE_KEY || event.newValue !== null) {
        return;
      }
      void (async () => {
        if (signingOut.current) return;
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        signingOut.current = true;
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      })();
    }

    function onPageHide(event: PageTransitionEvent) {
      if (event.persisted) return;
      const isLastTab = unregisterCurrentTab();
      if (!isLastTab) return;
      if (signingOut.current) return;
      signingOut.current = true;
      void (async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        clearAppSession();
      })();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [router]);

  return null;
}
