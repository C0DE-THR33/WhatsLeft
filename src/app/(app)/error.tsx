"use client";

// Every page in this group calls getCurrentUser()/getCurrentUserId(), which
// throws SupabaseNotConfiguredError (see lib/supabase/server.ts) when
// NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY aren't set —
// one error boundary here covers all of them, instead of every page needing
// its own try/catch. Note: Next.js only forwards the real error message to
// the client in dev; in production this falls back to a generic message
// (error.digest is what's available then, not detailed enough to say why).
export default function AppError({ error }: { error: Error & { digest?: string } }) {
  const notConfigured = error.name === "SupabaseNotConfiguredError";

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="text-lg font-extrabold">
        {notConfigured ? "Supabase isn't set up yet" : "Something went wrong"}
      </span>
      <p className="max-w-xs text-sm text-muted">
        {notConfigured
          ? "This page needs a Supabase project connected. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env — see the README's Local setup section."
          : "An unexpected error occurred loading this page."}
      </p>
    </main>
  );
}
