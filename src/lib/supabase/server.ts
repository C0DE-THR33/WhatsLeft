import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Thrown by every Supabase client factory when the required env vars
 * aren't set. Callers (pages, route handlers) catch this and render a
 * "not configured yet" state instead of letting a raw error 500 the page —
 * see CONVENTIONS.md #5. This is what keeps a freshly cloned repo demoable
 * before `.env` is filled in.
 */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * The one way server-side code (Server Components, Route Handlers, Server
 * Actions) gets a Supabase client. Cookie writes are wrapped in try/catch:
 * a Server Component can't set cookies, and that's expected — the session
 * gets refreshed by src/proxy.ts on the next request instead.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new SupabaseNotConfiguredError();
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — no-op, proxy.ts refreshes
            // the session on the next request instead.
          }
        },
      },
    },
  );
}
