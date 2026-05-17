import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";
import { asSessionCookieOptions } from "@/lib/supabase/session-cookie-options";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const parsed = parse(document.cookie);
          return Object.keys(parsed).map((name) => ({
            name,
            value: parsed[name] ?? "",
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serialize(
              name,
              value,
              asSessionCookieOptions(options),
            );
          });
        },
      },
    },
  );
}
