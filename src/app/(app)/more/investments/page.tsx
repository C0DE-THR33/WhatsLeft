import Link from "next/link";

// Full mockup: design/Investments.dc.html — Phase 2, not built yet.
export default function InvestmentsPage() {
  return (
    <main className="flex flex-col gap-4.5 p-5">
      <div className="flex items-center gap-3">
        <Link href="/more" aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 5l-7 7 7 7"
              stroke="var(--foreground)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <span className="text-[17px] font-extrabold">Investments</span>
        <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-[11px] font-bold text-warn-fg">
          Soon
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5.5 px-3.5 py-10 text-center">
        <div className="flex h-[88px] w-[88px] items-center justify-center rounded-3xl border border-border bg-surface">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 18l6-7 4 4 6-9"
              stroke="var(--faint)"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M15 6h5v5" stroke="var(--faint)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="text-lg font-extrabold">See your full net worth</span>
          <p className="mx-auto max-w-[280px] text-[13.5px] leading-[1.6] text-muted">
            Track mutual funds, stocks, and deposits alongside your spending — pulled
            automatically via Account Aggregator, or added by hand.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-8 py-3.5 text-[14.5px] font-bold text-faint">
          + Add investment
        </div>
      </div>
    </main>
  );
}
