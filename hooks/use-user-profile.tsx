"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { displayNameFromAuthUser } from "@/lib/auth-credentials";
import { createClient } from "@/lib/supabase/client";

interface UserProfileContextValue {
  displayName: string;
  isLoading: boolean;
}

let cachedDisplayName: string | null = null;

function getInitialDisplayName(): string {
  return cachedDisplayName ?? "Student";
}

function rememberDisplayName(name: string): void {
  cachedDisplayName = name;
}

export function clearProfileCache(): void {
  cachedDisplayName = null;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  displayName: getInitialDisplayName(),
  isLoading: true,
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState(getInitialDisplayName);
  const [isLoading, setIsLoading] = useState(() => cachedDisplayName === null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    function applyDisplayName(name: string) {
      rememberDisplayName(name);
      setDisplayName(name);
    }

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (user) {
          applyDisplayName(
            displayNameFromAuthUser(
              user.user_metadata,
              user.email ?? undefined,
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        applyDisplayName(
          displayNameFromAuthUser(
            session.user.user_metadata,
            session.user.email ?? undefined,
          ),
        );
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserProfileContext.Provider value={{ displayName, isLoading }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  return useContext(UserProfileContext);
}
