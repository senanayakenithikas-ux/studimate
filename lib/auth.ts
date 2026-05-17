import { hasAppSession } from "@/lib/app-tab-session";

export function isAuthenticated(): boolean {
  return hasAppSession();
}
