import { CategoryTile, DashedTile } from "@/components/transactions/CategoryTile";
import { getCurrentUserId } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/queries";
import { donutSegments } from "@/lib/donut";

// Full mockup: design/Analytics.dc.html
export default async function AnalyticsPage() {
  const userId = await getCurrentUserId();
  const { monthLabel, breakdown, highest, highestChangePct, trend } = await getAnalyticsData(userId);

  const segments = donutSegments(breakdown.map((c) => c.pct), 38);
  const maxTrend = Math.max(1, ...trend.map((t) => t.amount));

  return (
    <main className="flex flex-col gap-5 p-5">
      <span className="text-[19px] font-extrabold">Analytics</span>

      <div className="flex items-center justify-center gap-4">
        <span className="text-sm font-bold">{monthLabel}</span>
      </div>

      <div className="rounded-[18px] border border-border bg-surface p-4.5">
        {breakdown.length > 0 ? (
          <>
            <svg width="150" height="150" viewBox="0 0 100 100" className="mx-auto block">
              <g transform="rotate(-90 50 50)">
                {breakdown.map((c, i) => (
                  <circle
                    key={c.categoryId ?? "uncategorized"}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke={c.icon ? `var(--cat-${c.icon})` : "var(--faint)"}
                    strokeWidth="15"
                    strokeDasharray={segments[i].dasharray}
                    strokeDashoffset={segments[i].dashoffset}
                  />
                ))}
              </g>
            </svg>
            <div className="mt-4 flex flex-col gap-2.5">
              {breakdown.map((c) => (
                <div key={c.categoryId ?? "uncategorized"} className="flex items-center gap-2">
                  {c.icon ? <CategoryTile icon={c.icon} size="sm" /> : <DashedTile glyph="?" size="sm" />}
                  <span className="flex-1 text-[12.5px]">{c.label}</span>
                  <span className="text-[12.5px] text-muted">₹{c.amount.toLocaleString("en-IN")}</span>
                  <span className="w-[34px] text-right text-[12.5px] font-bold">{c.pct}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="py-4 text-center text-[12.5px] text-muted">No spending recorded this month yet.</p>
        )}
      </div>

      {highest && (
        <div className="rounded-[18px] border border-border bg-surface p-4.5">
          <span className="text-[11.5px] font-bold tracking-wide text-muted uppercase">
            Highest spending category
          </span>
          <div className="mt-2 flex items-center gap-2.5">
            <CategoryTile icon={highest.icon} size="md" className="h-[26px] w-[26px] rounded-lg" />
            <span className="text-xl font-extrabold">{highest.label}</span>
            <span className="text-sm font-bold text-muted">₹{highest.amount.toLocaleString("en-IN")}</span>
          </div>
          {highestChangePct !== null && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: highestChangePct < 0 ? "scaleY(-1)" : undefined }}
              >
                <path
                  d="M12 19V5M6 11l6-6 6 6"
                  stroke={highestChangePct < 0 ? "var(--success-fg)" : "var(--warn-fg)"}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className={`text-[12.5px] font-bold ${highestChangePct < 0 ? "text-success-fg" : "text-warn-fg"}`}
              >
                {highestChangePct > 0 ? "+" : ""}
                {highestChangePct}% vs last month
              </span>
            </div>
          )}
        </div>
      )}

      <div>
        <span className="text-[13.5px] font-bold">Spending trend</span>
        <div className="mt-2.5 rounded-[18px] border border-border bg-surface p-4.5">
          <div className="flex h-[92px] items-end justify-between">
            {trend.map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-[22px] rounded-[5px] ${t.current ? "bg-accent" : "bg-border"}`}
                  style={{ height: `${Math.max(4, (t.amount / maxTrend) * 90)}px` }}
                />
                <span className={`text-[10.5px] ${t.current ? "font-bold" : "text-faint"}`}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {highest && highestChangePct !== null && highestChangePct > 0 && (
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
            Your {highest.label.toLowerCase()} spending increased {highestChangePct}% this month
            compared to last month.
          </span>
        </div>
      )}
    </main>
  );
}
