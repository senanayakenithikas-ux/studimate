const SESSION_KEY = "studimate_session";
const TABS_KEY = "studimate_open_tabs";
const TAB_ID_KEY = "studimate_tab_id";

function getOrCreateTabId(): string {
  if (typeof window === "undefined") return "";
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

function readTabs(): string[] {
  try {
    const raw = localStorage.getItem(TABS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeTabs(tabs: string[]): void {
  localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
}

export function registerCurrentTab(): void {
  if (typeof window === "undefined") return;
  const tabId = getOrCreateTabId();
  const tabs = readTabs();
  if (!tabs.includes(tabId)) {
    writeTabs([...tabs, tabId]);
  }
}

/** Removes this tab from the registry. Returns true if this was the last open tab. */
export function unregisterCurrentTab(): boolean {
  if (typeof window === "undefined") return true;
  const tabId = getOrCreateTabId();
  const tabs = readTabs().filter((id) => id !== tabId);
  writeTabs(tabs);
  return tabs.length === 0;
}

export function setAppSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, "1");
  registerCurrentTab();
}

export function clearAppSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TABS_KEY);
}

export function hasAppSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "1";
}

export const APP_SESSION_STORAGE_KEY = SESSION_KEY;
