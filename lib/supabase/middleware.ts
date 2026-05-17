import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { asSessionCookieOptions } from "@/lib/supabase/session-cookie-options";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

/**
 * Proxy session rules:
 * - "/" is public for guests; redirects to /dashboard when a verified session exists.
 * - "/login" and "/signup" redirect to /dashboard only when a verified session exists.
 * - Protected app routes redirect to /login when there is no verified session.
 * - Tab-scoped logout is handled client-side (TabSessionManager + app-tab-session).
 * - Auth cookies use session-scoped options when refreshed via setAll.
 */
function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

function isStaleRefreshError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "refresh_token_not_found"
  );
}

async function getVerifiedSession(
  supabase: ReturnType<typeof createServerClient>,
): Promise<boolean> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user && !userError) {
    return true;
  }

  if (isStaleRefreshError(userError)) {
    await supabase.auth.signOut();
  }

  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              asSessionCookieOptions(options),
            ),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  if (pathname === "/") {
    const hasVerifiedSession = await getVerifiedSession(supabase);
    if (hasVerifiedSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      const redirect = NextResponse.redirect(url);
      copyResponseCookies(supabaseResponse, redirect);
      return redirect;
    }
    return supabaseResponse;
  }

  const hasVerifiedSession = await getVerifiedSession(supabase);
  const isPublicRoute = PUBLIC_PATHS.has(pathname);
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  if (!hasVerifiedSession && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    copyResponseCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (hasVerifiedSession && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirect = NextResponse.redirect(url);
    copyResponseCookies(supabaseResponse, redirect);
    return redirect;
  }

  return supabaseResponse;
}
