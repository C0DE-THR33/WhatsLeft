import Link from "next/link";

// Full mockup: design/Main.dc.html
export default function OnboardingPage() {
  return (
    <main className="flex min-h-full flex-col px-7 pt-11 pb-8">
      <div className="flex items-center gap-2.5">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="9" fill="var(--accent)" />
          <path
            d="M9 20c1.5 1.5 3.2 2.2 5.2 2.2 3 0 4.6-1.4 4.6-3.2 0-4.6-9-2.4-9-7.3 0-2 1.8-3.4 4.6-3.4 2 0 3.6.6 5 1.8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span className="text-[19px] font-extrabold tracking-tight">SpendWise</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-9 py-5">
        <svg width="220" height="180" viewBox="0 0 220 180" fill="none">
          <rect x="14" y="26" width="192" height="128" rx="20" fill="var(--accent-soft)" />
          <rect x="40" y="96" width="20" height="38" rx="4" fill="var(--accent)" opacity="0.55" />
          <rect x="72" y="80" width="20" height="54" rx="4" fill="var(--accent)" opacity="0.72" />
          <rect x="104" y="60" width="20" height="74" rx="4" fill="var(--accent)" />
          <rect x="136" y="70" width="20" height="64" rx="4" fill="var(--accent)" opacity="0.85" />
          <circle cx="168" cy="46" r="15" fill="white" stroke="var(--accent)" strokeWidth="2" />
          <path d="M164 46h8M168 42v8" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-[27px] leading-[1.25] font-extrabold tracking-tight">
            Know where your
            <br />
            money goes.
          </h1>
          <p className="mx-auto max-w-[280px] text-sm leading-[1.55] text-muted">
            Link your bank once. SpendWise reads every transaction automatically — no
            manual entry, no spreadsheets.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/connect-bank"
          className="rounded-2xl bg-accent py-4 text-center text-[15.5px] font-bold text-white"
        >
          Connect your bank
        </Link>
        <Link href="/home" className="text-center text-[13.5px] font-semibold text-muted">
          Set up manually instead
        </Link>
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3l7 3v6c0 4.6-3 8.4-7 9-4-.6-7-4.4-7-9V6l7-3z"
              stroke="var(--faint)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11.5px] text-faint">
            Secured via RBI-licensed Account Aggregator framework
          </span>
        </div>
      </div>
    </main>
  );
}
