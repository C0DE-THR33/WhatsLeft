import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Thrown instead of letting createServerClient's generic error propagate,
 * so callers (and src/app/(app)/error.tsx) can reliably tell "Supabase
 * isn't configured" apart from a real auth/data error by name, not by
 * matching Supabase's error message text.
 */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase isn't configured — set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env (see README)."
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Server Components can't write cookies (only Proxy/Route
 * Handlers can), so setAll is a no-op there — that's fine as long as
 * src/proxy.ts is refreshing the session on every request.
 */
export async function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new SupabaseNotConfiguredError();
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignorable since proxy.ts
            // refreshes the session on every request anyway.
          }
        },
      },
    }
  );
}
