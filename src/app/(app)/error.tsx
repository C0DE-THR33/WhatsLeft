"use client";

// One error boundary for the whole (app) group — a page-level render error
// anywhere under the tab-bar shell lands here instead of a blank screen,
// and the bottom nav (rendered by the layout, outside this boundary) stays
// usable so the user can navigate away.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-card bg-danger-soft text-danger-fg"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 10v4" /><path d="M12 17.5h.01" /></svg></div>
      <h1 className="text-lg font-semibold text-fg">Something went wrong</h1>
      <p className="max-w-sm text-sm text-fg-muted">
        {error.message || "This page hit an unexpected error."}
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-pill bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
      >
        Try again
      </button>
    </div>
  );
}
