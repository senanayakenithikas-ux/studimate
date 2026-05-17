import type { SerializeOptions } from "cookie";

/** Session cookies: no maxAge/expires so they clear when the browser closes. */
export const SESSION_COOKIE_OPTIONS: SerializeOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: false,
};

export function asSessionCookieOptions(
  options?: SerializeOptions,
): SerializeOptions {
  if (options?.maxAge === 0) {
    return { ...SESSION_COOKIE_OPTIONS, ...options };
  }
  const rest = { ...(options ?? {}) };
  delete rest.maxAge;
  delete rest.expires;
  return { ...SESSION_COOKIE_OPTIONS, ...rest };
}
