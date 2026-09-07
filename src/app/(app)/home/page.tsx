import Link from "next/link";
import { CategoryTile, DashedTile } from "@/components/transactions/CategoryTile";
import { getCurrentUserId } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { donutSegments } from "@/lib/donut";

// Full mockup: design/Home.dc.html
export default async function HomePage() {
  const userId = await getCurrentUserId();
  const data = await getDashboardData(userId);

  const budgetPct =
    data.budgetAmount > 0 ? Math.min(100, Math.round((data.spentThisMonth / data.budgetAmount) * 100)) : 0;
  const remaining = data.budgetAmount - data.spentThisMonth;
  const segments = donutSegments(data.categoryBreakdown.map((c) => c.pct));

  return (
    <main className="flex flex-col gap-4.5 p-5 pb-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[19px] font-extrabold">Hi</span>
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
        <span className="text-xs font-semibold text-white/70">
          Total balance ·{" "}
          {data.linkedAccountCount === 0
            ? "no accounts linked"
            : `${data.linkedAccountCount} account${data.linkedAccountCount === 1 ? "" : "s"} linked`}
        </span>
        <div className="mt-1.5 text-[28px] font-extrabold tracking-tight">
          ₹{data.totalBalance.toLocaleString("en-IN")}
        </div>
        <Link href="/more/settings" className="mt-2 inline-block text-[12.5px] font-bold text-accent">
          {data.linkedAccountCount === 0 ? "Connect a bank →" : "View accounts →"}
        </Link>
      </div>

      <div className="rounded-[18px] border border-border bg-surface p-4.5">
        <div className="flex items-center justify-between">
          <span className="text-[13.5px] font-bold">This month&apos;s budget</span>
          {data.budgetAmount > 0 && (
            <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-[11.5px] font-bold text-warn-fg">
              {budgetPct}% used
            </span>
          )}
        </div>
        {data.budgetAmount > 0 ? (
          <>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent" style={{ width: `${budgetPct}%` }} />
            </div>
            <div className="mt-2.5 flex justify-between">
              <span className="text-[12.5px] text-muted">
                ₹{data.spentThisMonth.toLocaleString("en-IN")} spent of ₹
                {data.budgetAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[12.5px] font-bold">
                ₹{Math.max(0, remaining).toLocaleString("en-IN")} left
              </span>
            </div>
          </>
        ) : (
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[12.5px] text-muted">No budget set for this month yet</span>
            <Link href="/budget" className="text-[12.5px] font-bold text-accent">
              Set one →
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-[18px] border border-border bg-surface p-4.5">
        <span className="text-[13.5px] font-bold">Spending by category</span>
        {data.categoryBreakdown.length > 0 ? (
          <div className="mt-3.5 flex items-center gap-5">
            <svg width="92" height="92" viewBox="0 0 100 100">
              <g transform="rotate(-90 50 50)">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="14" />
                {data.categoryBreakdown.map((c, i) => (
                  <circle
                    key={c.categoryId ?? "uncategorized"}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={c.icon ? `var(--cat-${c.icon})` : "var(--faint)"}
                    strokeWidth="14"
                    strokeDasharray={segments[i].dasharray}
                    strokeDashoffset={segments[i].dashoffset}
                  />
                ))}
              </g>
            </svg>
            <div className="flex flex-1 flex-col gap-2">
              {data.categoryBreakdown.slice(0, 5).map((c) => (
                <div key={c.categoryId ?? "uncategorized"} className="flex items-center gap-2">
                  {c.icon ? <CategoryTile icon={c.icon} size="sm" /> : <DashedTile glyph="?" size="sm" />}
                  <span className="flex-1 text-[12.5px]">{c.label}</span>
                  <span className="text-[12.5px] font-bold">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[12.5px] text-muted">
            Nothing categorized yet this month — spending will show up here once transactions come in.
          </p>
        )}
      </div>

      <div>
        <div className="mb-0.5 flex items-center justify-between">
          <span className="text-[13.5px] font-bold">Recent transactions</span>
          <Link href="/transactions" className="text-[12.5px] font-bold">
            View all
          </Link>
        </div>
        {data.recentTransactions.length > 0 ? (
          <div className="rounded-[18px] border border-border bg-surface px-4">
            {data.recentTransactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 py-2.5 ${i < data.recentTransactions.length - 1 ? "border-b border-border" : ""}`}
              >
                {t.icon ? (
                  <CategoryTile icon={t.icon} />
                ) : (
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] border-[1.5px] border-dashed border-border text-sm font-extrabold text-faint">
                    ?
                  </div>
                )}
                <div className="flex flex-1 flex-col">
                  <span className="text-[13.5px] font-bold">{t.merchant}</span>
                  <span className="text-[11.5px] text-muted">{t.meta}</span>
                </div>
                <span
                  className={`text-[13.5px] font-bold ${t.type === "DEBIT" ? "text-danger-fg" : "text-success-fg"}`}
                >
                  {t.type === "DEBIT" ? "−" : "+"}₹{t.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-border bg-surface p-5 text-center">
            <p className="text-[12.5px] text-muted">
              No transactions yet. Once your bank is connected, they&apos;ll show up here
              automatically.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
