/**
 * Placeholder for Supabase Auth session lookup. Every API route that needs
 * "the current user" calls this instead of reading a session directly, so
 * wiring up real Supabase Auth later is a one-file change.
 *
 * TODO: replace with an actual Supabase server client reading the session
 * cookie (see https://supabase.com/docs/guides/auth/server-side/nextjs).
 */
export async function getCurrentUserId(): Promise<string> {
  throw new Error(
    "getCurrentUserId() is not implemented yet — auth hasn't been wired up. " +
      "See src/lib/auth.ts."
  );
}
