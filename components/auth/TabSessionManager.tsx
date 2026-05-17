"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  APP_SESSION_STORAGE_KEY,
  cancelPendingTabCloseLogout,
  clearAppSession,
  hasAppSession,
  hasOpenTabs,
  registerCurrentTab,
  scheduleTabCloseLogout,
  setAppSession,
  unregisterCurrentTab,
} from "@/lib/app-tab-session";
import { clearAccessTokenCache } from "@/lib/client-fetch";
import { clearProfileCache } from "@/hooks/use-user-profile";
import { createClient } from "@/lib/supabase/client";

const LOGOUT_URL = "/api/auth/logout";

function wasReload(): boolean {
  const [nav] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  return nav?.type === "reload";
}

function requestServerLogout(): void {
  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(
      LOGOUT_URL,
      new Blob([], { type: "application/json" }),
    );
    return;
  }
  void fetch(LOGOUT_URL, { method: "POST", keepalive: true });
}

export function TabSessionManager() {
  const router = useRouter();
  const signingOut = useRef(false);

  useEffect(() => {
    async function restoreSessionAfterReload() {
      if (!wasReload()) return;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setAppSession();
      }
    }

    async function reconcileStaleAuth() {
      if (signingOut.current) return;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!hasAppSession() && user) {
        signingOut.current = true;
        await supabase.auth.signOut();
        clearAccessTokenCache();
        clearProfileCache();
        clearAppSession();
        router.push("/login");
        router.refresh();
      }
    }

    async function onMountOrShow() {
      registerCurrentTab();
      cancelPendingTabCloseLogout();
      await restoreSessionAfterReload();
      await reconcileStaleAuth();
    }

    function performLastTabLogout() {
      clearAccessTokenCache();
      clearProfileCache();
      clearAppSession();
      requestServerLogout();
      void createClient().auth.signOut();
    }

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
        clearAccessTokenCache();
        clearProfileCache();
        router.push("/login");
        router.refresh();
      })();
    }

    function onPageHide(event: PageTransitionEvent) {
      if (event.persisted) return;
      const isLastTab = unregisterCurrentTab();
      if (!isLastTab) return;
      if (signingOut.current) return;

      performLastTabLogout();

      scheduleTabCloseLogout(() => {
        if (hasOpenTabs()) return;
        requestServerLogout();
        void createClient().auth.signOut();
      });
    }

    void onMountOrShow();

    window.addEventListener("pageshow", () => {
      void onMountOrShow();
    });
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pageshow", onMountOrShow);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [router]);

  return null;
}
