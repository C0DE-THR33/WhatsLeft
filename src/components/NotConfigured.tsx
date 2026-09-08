// Shown wherever a page catches SupabaseNotConfiguredError instead of
// letting the raw error 500 the render (CONVENTIONS.md #5) — the
// difference between a freshly cloned repo being demoable before `.env`
// is filled in, and every single page crashing.
export function NotConfigured() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-cat-bills/15 text-2xl">
        ⚙️
      </div>
      <h1 className="text-lg font-semibold">SpendWise isn&apos;t configured yet</h1>
      <p className="max-w-sm text-sm text-fg-muted">
        Copy <code className="rounded bg-surface px-1 py-0.5">.env.example</code> to{" "}
        <code className="rounded bg-surface px-1 py-0.5">.env</code> and fill in your Supabase
        project&apos;s URL and publishable key to continue.
      </p>
    </div>
  );
}
