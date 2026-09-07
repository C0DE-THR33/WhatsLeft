import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths that don't require a signed-in session. "/" and "/onboarding" are
// the public marketing entry points (design/Main.dc.html); everything else
// under (app)/ and /connect-bank needs a real session.
const PUBLIC_PATHS = ["/", "/onboarding", "/login", "/auth"];

let warnedNoSupabaseConfig = false;

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
}

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated requests to protected paths to /login. Called from
 * src/proxy.ts (Next.js 16 renamed middleware.ts -> proxy.ts).
 */
export async function updateSession(request: NextRequest) {
  // Supabase isn't configured yet in most local/demo environments (no
  // project created, .env not filled in) — without this guard, proxy runs
  // on every request per its matcher, so createServerClient's hard throw
  // on a missing URL/key would 500 every route, public ones included, not
  // just the ones that actually need auth. Degrade to "no auth enforced"
  // instead, once, with a console warning, rather than breaking the app.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    if (!warnedNoSupabaseConfig) {
      console.warn(
        "[proxy] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set — " +
          "skipping auth enforcement. Every route is unprotected until these are configured."
      );
      warnedNoSupabaseConfig = true;
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  // Don't hoist this into a module-level singleton — a fresh client per
  // request is required for cookie handling to stay correct (also plays
  // well with Fluid compute / request isolation).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and getClaims() — a stray
  // await here is a classic way to make users get randomly logged out.
  // getClaims() (not getSession()) is the one safe-to-trust check in
  // proxy: it verifies the JWT signature rather than trusting whatever
  // the request's cookies claim.
  const { data } = await supabase.auth.getClaims();
  const authenticated = !!data?.claims;

  if (!authenticated && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Must return this exact object (with its cookies) — building a fresh
  // NextResponse here would drop the refreshed session cookie and log
  // users out unpredictably.
  return supabaseResponse;
}
