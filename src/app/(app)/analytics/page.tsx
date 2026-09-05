import { CategoryTile } from "@/components/transactions/CategoryTile";
import type { CategoryIcon } from "@/lib/categories";

// Full mockup: design/Analytics.dc.html
// TODO: aggregate db.transaction by category for the current month (donut +
// legend), and by month for the trend bars — both currently hardcoded to
// match the same September 2026 sample data used on Home/Budget.

const LEGEND: { icon: CategoryIcon; label: string; amount: number; pct: number }[] = [
  { icon: "food", label: "Food", amount: 4750, pct: 35 },
  { icon: "bills", label: "Bills", amount: 4500, pct: 33 },
  { icon: "shopping", label: "Shopping", amount: 2400, pct: 18 },
  { icon: "transport", label: "Transport", amount: 1200, pct: 9 },
  { icon: "entertainment", label: "Entertainment", amount: 600, pct: 5 },
];

const DONUT_SEGMENTS = [
  { icon: "food", dasharray: "83.56 238.76", dashoffset: "0" },
  { icon: "bills", dasharray: "78.79 238.76", dashoffset: "-83.56" },
  { icon: "shopping", dasharray: "42.98 238.76", dashoffset: "-162.35" },
  { icon: "transport", dasharray: "21.49 238.76", dashoffset: "-205.33" },
  { icon: "entertainment", dasharray: "11.94 238.76", dashoffset: "-226.82" },
] as const;

const TREND = [
  { label: "Apr", h: 72 },
  { label: "May", h: 80 },
  { label: "Jun", h: 67 },
  { label: "Jul", h: 82 },
  { label: "Aug", h: 90 },
  { label: "Sep", h: 64, current: true },
];

export default function AnalyticsPage() {
  return (
    <main className="flex flex-col gap-5 p-5">
      <span className="text-[19px] font-extrabold">Analytics</span>

      <div className="flex items-center justify-center gap-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 5l-7 7 7 7"
            stroke="var(--muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-bold">September 2026</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 5l7 7-7 7"
            stroke="var(--faint)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="rounded-[18px] border border-border bg-surface p-4.5">
        <svg width="150" height="150" viewBox="0 0 100 100" className="mx-auto block">
          <g transform="rotate(-90 50 50)">
            {DONUT_SEGMENTS.map((seg) => (
              <circle
                key={seg.icon}
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={`var(--cat-${seg.icon})`}
                strokeWidth="15"
                strokeDasharray={seg.dasharray}
                strokeDashoffset={seg.dashoffset}
              />
            ))}
          </g>
        </svg>
        <div className="mt-4 flex flex-col gap-2.5">
          {LEGEND.map((c) => (
            <div key={c.icon} className="flex items-center gap-2">
              <CategoryTile icon={c.icon} size="sm" />
              <span className="flex-1 text-[12.5px]">{c.label}</span>
              <span className="text-[12.5px] text-muted">₹{c.amount.toLocaleString("en-IN")}</span>
              <span className="w-[34px] text-right text-[12.5px] font-bold">{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[18px] border border-border bg-surface p-4.5">
        <span className="text-[11.5px] font-bold tracking-wide text-muted uppercase">
          Highest spending category
        </span>
        <div className="mt-2 flex items-center gap-2.5">
          <CategoryTile icon="food" size="md" className="h-[26px] w-[26px] rounded-lg" />
          <span className="text-xl font-extrabold">Food</span>
          <span className="text-sm font-bold text-muted">₹4,750</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 19V5M6 11l6-6 6 6"
              stroke="var(--warn-fg)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[12.5px] font-bold text-warn-fg">+18% vs August</span>
        </div>
      </div>

      <div>
        <span className="text-[13.5px] font-bold">Spending trend</span>
        <div className="mt-2.5 rounded-[18px] border border-border bg-surface p-4.5">
          <div className="flex h-[92px] items-end justify-between">
            {TREND.map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-[22px] rounded-[5px] ${t.current ? "bg-accent" : "bg-border"}`}
                  style={{ height: `${t.h}px` }}
                />
                <span className={`text-[10.5px] ${t.current ? "font-bold" : "text-faint"}`}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-[18px] bg-accent-soft p-4.5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-px flex-shrink-0">
          <path
            d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 1 1.7v.4h5v-.4c.1-.7.4-1.3 1-1.7A6 6 0 0 0 12 3Z"
            stroke="var(--accent-soft-fg)"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[13px] leading-[1.55] font-semibold text-accent-soft-fg">
          Your food spending increased 18% this month compared to last month.
        </span>
      </div>
    </main>
  );
}
