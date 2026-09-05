"use client";

import { useState } from "react";
import Link from "next/link";

// Full mockup: design/BankConnect.dc.html — only the "our app" panel ships
// here. The other panel in that mockup was a deliberately un-branded stand-in
// for Setu's hosted consent screen, drawn to document the handoff for the
// design case study — not something this app renders. In production the
// browser genuinely leaves this page for Setu's UI via result.redirectUrl.

const BANK_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 3 8h18L12 3Z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    <path
      d="M5 10v7M9 10v7M15 10v7M19 10v7M3.5 20h17"
      stroke="#fff"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const BANKS = [
  { fipId: "HDFC-FIP", name: "HDFC Bank", color: "oklch(0.6 0.14 25)" },
  { fipId: "ICICI-FIP", name: "ICICI Bank", color: "oklch(0.6 0.13 45)" },
  { fipId: "AXIS-FIP", name: "Axis Bank", color: "oklch(0.55 0.1 300)" },
  { fipId: "SBI-FIP", name: "State Bank of India", color: "oklch(0.55 0.13 240)" },
  { fipId: "KOTAK-FIP", name: "Kotak Mahindra Bank", color: "oklch(0.5 0.03 250)" },
];

export default function ConnectBankPage() {
  const [selected, setSelected] = useState<(typeof BANKS)[number] | null>(null);
  const [status, setStatus] = useState<"idle" | "redirecting" | "error">("idle");

  async function pickBank(bank: (typeof BANKS)[number]) {
    setSelected(bank);
    setStatus("redirecting");
    try {
      const res = await fetch("/api/aa/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fipId: bank.fipId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { redirectUrl } = await res.json();
      window.location.assign(redirectUrl);
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-full flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <Link href="/onboarding" aria-label="Back">
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
        <span className="text-[17px] font-extrabold">Connect your bank</span>
      </div>

      {status === "idle" && (
        <div className="flex flex-col">
          {BANKS.map((bank) => (
            <button
              key={bank.fipId}
              onClick={() => pickBank(bank)}
              className="flex items-center gap-3 border-b border-border py-3.5 text-left last:border-b-0"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ background: bank.color }}
              >
                {BANK_ICON}
              </div>
              <span className="flex-1 text-sm font-bold">{bank.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 5l7 7-7 7"
                  stroke="var(--faint)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      {status === "redirecting" && selected && (
        <div className="flex flex-1 flex-col gap-4">
          <span className="text-[11.5px] font-bold tracking-wide text-accent-soft-fg uppercase">
            Step 1 of 2 · Redirecting
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-border px-3.5 py-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: selected.color }}
            >
              {BANK_ICON}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">{selected.name}</span>
              <span className="text-xs text-muted">Savings account</span>
            </div>
            <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-bold text-accent-soft-fg">
              Selected
            </span>
          </div>
          <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-border px-2.5 py-6">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="animate-spin">
              <circle cx="12" cy="12" r="9" stroke="var(--border)" strokeWidth="3" />
              <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="text-center text-[13.5px] font-bold">
              Redirecting to secure consent…
            </span>
          </div>
          <p className="text-xs leading-[1.6] text-muted">
            Setu, an RBI-licensed Account Aggregator, will verify your number and ask which
            accounts and transaction history to share — SpendWise never sees your bank
            credentials.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-auto text-center text-[13px] font-semibold text-muted"
          >
            Cancel
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <span className="text-sm font-bold">Couldn&apos;t start the connection</span>
          <p className="max-w-xs text-xs text-muted">
            This needs a signed-in user and Setu sandbox credentials, neither of which are
            wired up yet (see README). Once auth is in, this screen will work end to end.
          </p>
          <button onClick={() => setStatus("idle")} className="text-[13px] font-bold text-accent">
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
