const TOKEN_KEY = "studimate_token";

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}
