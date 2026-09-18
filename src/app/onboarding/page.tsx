import Link from "next/link";

// First screen after sign-in, before the (app) tab-bar shell. Keeps it to
// one decision: connect a bank now, or explore with nothing linked yet —
// getHomeData() already has a real empty state for the latter
// (CONVENTIONS.md #4).
export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-card bg-accent-soft text-accent-soft-fg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11.5V5.2a1.7 1.7 0 0 1 3.4 0v5.1" /><path d="M12.4 10.6V4.2a1.7 1.7 0 0 1 3.4 0v6.4" /><path d="M15.8 11V6.7a1.7 1.7 0 0 1 3.4 0v7.6a6 6 0 0 1-6 6h-1.1a5 5 0 0 1-3.7-1.7l-3-3.4a1.7 1.7 0 0 1 2.4-2.4L9 14.6" /></svg>
        </div>
        <h1 className="text-2xl font-semibold text-fg">Welcome to SpendWise</h1>
        <p className="max-w-sm text-sm text-fg-muted">
          Connect a bank account to see your spending sorted into categories
          automatically, or explore first and connect later.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/connect-bank"
          className="rounded-pill bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
        >
          Connect a bank account
        </Link>
        <Link
          href="/home"
          className="rounded-pill border border-border px-4 py-3 text-sm font-medium text-fg"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
