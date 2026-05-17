/** @deprecated Use `@/lib/app-tab-session` — re-exports for backward compatibility. */
export {
  setAppSession as setAppSessionCookie,
  clearAppSession as clearAppSessionCookie,
  setAppSession,
  clearAppSession,
  hasAppSession,
  registerCurrentTab,
  unregisterCurrentTab,
} from "@/lib/app-tab-session";
