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

const UserProfileContext = createContext<UserProfileContextValue>({
  displayName: "Student",
  isLoading: true,
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState("Student");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (user) {
          setDisplayName(
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
        setDisplayName(
          displayNameFromAuthUser(
            session.user.user_metadata,
            session.user.email ?? undefined,
          ),
        );
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
