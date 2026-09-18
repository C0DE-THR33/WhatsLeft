// Shown wherever a page catches SupabaseNotConfiguredError instead of
// letting the raw error 500 the render (CONVENTIONS.md #5) — the
// difference between a freshly cloned repo being demoable before `.env`
// is filled in, and every single page crashing.
export function NotConfigured() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <div className="flex size-12 items-center justify-center rounded-card bg-accent-soft text-accent-soft-fg">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" /></svg>
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
