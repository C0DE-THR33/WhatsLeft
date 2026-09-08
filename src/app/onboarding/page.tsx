import Link from "next/link";

// First screen after sign-in, before the (app) tab-bar shell. Keeps it to
// one decision: connect a bank now, or explore with nothing linked yet —
// getHomeData() already has a real empty state for the latter
// (CONVENTIONS.md #4).
export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-3xl">
          👋
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
          className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
        >
          Connect a bank account
        </Link>
        <Link
          href="/home"
          className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-fg"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
