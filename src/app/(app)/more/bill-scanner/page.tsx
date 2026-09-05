import Link from "next/link";

// Full mockup: design/BillScanner.dc.html — Phase 2, not built yet.
export default function BillScannerPage() {
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
        <span className="text-[17px] font-extrabold">Bill Scanner</span>
        <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-[11px] font-bold text-warn-fg">
          Soon
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5.5 px-3.5 py-10 text-center">
        <div className="flex h-[88px] w-[88px] items-center justify-center rounded-3xl border border-border bg-surface">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 8a2 2 0 0 1 2-2h1l1-2h6l1 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"
              stroke="var(--faint)"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="3.4" stroke="var(--faint)" strokeWidth="1.7" />
          </svg>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="text-lg font-extrabold">Scan a bill in seconds</span>
          <p className="mx-auto max-w-[280px] text-[13.5px] leading-[1.6] text-muted">
            Snap a photo of any paper bill or receipt — SpendWise will read the items, split
            multi-item purchases, and categorize them automatically.
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-8 py-3.5 text-[14.5px] font-bold text-faint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="8" width="16" height="12" rx="2" stroke="var(--faint)" strokeWidth="1.7" />
            <path d="M9 8l1.5-2h3L15 8" stroke="var(--faint)" strokeWidth="1.7" strokeLinejoin="round" />
            <circle cx="12" cy="14" r="3" stroke="var(--faint)" strokeWidth="1.7" />
          </svg>
          Scan a bill
        </div>
      </div>
    </main>
  );
}
