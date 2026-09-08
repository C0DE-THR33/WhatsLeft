import { createBrowserClient } from "@supabase/ssr";

// Duplicated (not imported) from lib/supabase/server.ts on purpose:
// server.ts pulls in `next/headers`, which can't be bundled into
// Client Component code. Same shape, same name, kept in sync by hand.
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * The one way Client Components get a Supabase client (magic-link sign-in
 * forms, sign-out buttons). See lib/supabase/server.ts for the server-side
 * equivalent and SupabaseNotConfiguredError.
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new SupabaseNotConfiguredError();
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
