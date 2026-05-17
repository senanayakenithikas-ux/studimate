const EMAIL_DOMAIN = "studimate.com";

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${EMAIL_DOMAIN}`;
}

export function displayNameFromAuthUser(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  const username = metadata?.username;
  if (typeof username === "string" && username.trim()) {
    return username.trim();
  }
  if (email?.endsWith(`@${EMAIL_DOMAIN}`)) {
    const local = email.slice(0, -`@${EMAIL_DOMAIN}`.length);
    if (local) return local;
  }
  if (email) {
    const local = email.split("@")[0];
    if (local) return local;
  }
  return "Student";
}

export function isValidUsername(username: string): boolean {
  const normalized = normalizeUsername(username);
  return /^[a-z0-9_]{3,32}$/.test(normalized);
}
