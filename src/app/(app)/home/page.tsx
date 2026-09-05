import Link from "next/link";
import { CategoryTile } from "@/components/transactions/CategoryTile";

// Full mockup: design/Home.dc.html
// TODO: replace this sample data with real queries once auth exists —
// db.linkedAccount for the balance, db.monthlyBudget + a spend sum for the
// budget card, db.transaction grouped by category for the donut, and
// db.transaction.findMany(...) ordered by transactionDate for the list.
const RECENT = [
  { id: "1", merchant: "Swiggy", icon: "food", amount: -450, meta: "Food · Today · HDFC ••1234" },
  { id: "2", merchant: "Uber", icon: "transport", amount: -180, meta: "Transport · Today · ICICI ••5678" },
  { id: "3", merchant: "Amazon", icon: "shopping", amount: -1299, meta: "Shopping · Yesterday · HDFC ••1234" },
  { id: "4", merchant: "Salary credit", icon: "income", amount: 45000, meta: "Income · 2 days ago · HDFC ••1234" },
] as const;

const CATEGORY_LEGEND = [
  { icon: "food", label: "Food", pct: 35 },
  { icon: "bills", label: "Bills", pct: 33 },
  { icon: "shopping", label: "Shopping", pct: 18 },
  { icon: "transport", label: "Transport", pct: 9 },
  { icon: "entertainment", label: "Entertainment", pct: 5 },
] as const;

// Same dasharray/dashoffset math as design/Home.dc.html — circumference
// 251.33 (r=40), split by CATEGORY_LEGEND's percentages.
const DONUT_SEGMENTS = [
  { icon: "food", dasharray: "87.96 251.33", dashoffset: "0" },
  { icon: "bills", dasharray: "82.94 251.33", dashoffset: "-87.96" },
  { icon: "shopping", dasharray: "45.24 251.33", dashoffset: "-170.90" },
  { icon: "transport", dasharray: "22.62 251.33", dashoffset: "-216.14" },
  { icon: "entertainment", dasharray: "12.57 251.33", dashoffset: "-238.76" },
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-col gap-4.5 p-5 pb-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[19px] font-extrabold">Hi, Mark</span>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z"
            stroke="var(--foreground)"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M10 18a2 2 0 0 0 4 0"
            stroke="var(--foreground)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="rounded-[18px] bg-foreground p-4.5 text-white">
        <span className="text-xs font-semibold text-white/70">Total balance · 3 accounts linked</span>
        <div className="mt-1.5 text-[28px] font-extrabold tracking-tight">₹1,42,318</div>
        <Link href="/more/settings" className="mt-2 inline-block text-[12.5px] font-bold text-accent">
          View accounts →
        </Link>
      </div>

      <div className="rounded-[18px] border border-border bg-surface p-4.5">
        <div className="flex items-center justify-between">
          <span className="text-[13.5px] font-bold">This month&apos;s budget</span>
          <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-[11.5px] font-bold text-warn-fg">
            67% used
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border">
          <div className="h-full w-[67%] rounded-full bg-accent" />
        </div>
        <div className="mt-2.5 flex justify-between">
          <span className="text-[12.5px] text-muted">₹13,450 spent of ₹20,000</span>
          <span className="text-[12.5px] font-bold">₹6,550 left</span>
        </div>
      </div>

      <div className="rounded-[18px] border border-border bg-surface p-4.5">
        <span className="text-[13.5px] font-bold">Spending by category</span>
        <div className="mt-3.5 flex items-center gap-5">
          <svg width="92" height="92" viewBox="0 0 100 100">
            <g transform="rotate(-90 50 50)">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="14" />
              {DONUT_SEGMENTS.map((seg) => (
                <circle
                  key={seg.icon}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={`var(--cat-${seg.icon})`}
                  strokeWidth="14"
                  strokeDasharray={seg.dasharray}
                  strokeDashoffset={seg.dashoffset}
                />
              ))}
            </g>
          </svg>
          <div className="flex flex-1 flex-col gap-2">
            {CATEGORY_LEGEND.map((c) => (
              <div key={c.icon} className="flex items-center gap-2">
                <CategoryTile icon={c.icon} size="sm" />
                <span className="flex-1 text-[12.5px]">{c.label}</span>
                <span className="text-[12.5px] font-bold">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-0.5 flex items-center justify-between">
          <span className="text-[13.5px] font-bold">Recent transactions</span>
          <Link href="/transactions" className="text-[12.5px] font-bold">
            View all
          </Link>
        </div>
        <div className="rounded-[18px] border border-border bg-surface px-4">
          {RECENT.map((t, i) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 py-2.5 ${i < RECENT.length - 1 ? "border-b border-border" : ""}`}
            >
              <CategoryTile icon={t.icon} />
              <div className="flex flex-1 flex-col">
                <span className="text-[13.5px] font-bold">{t.merchant}</span>
                <span className="text-[11.5px] text-muted">{t.meta}</span>
              </div>
              <span
                className={`text-[13.5px] font-bold ${t.amount < 0 ? "text-danger-fg" : "text-success-fg"}`}
              >
                {t.amount < 0 ? "−" : "+"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
