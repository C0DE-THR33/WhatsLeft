import { getCurrentUser } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { formatMonthLabel } from "@/lib/dates";
import { asCategoryIcon, asCategoryColor } from "@/lib/categories";
import { CategoryTile, DashedTile } from "@/components/transactions/CategoryTile";
import { DonutChart } from "@/components/DonutChart";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getAnalyticsData(user.id);
  const colors = Object.fromEntries(
    data.breakdown.map((row) => [row.categoryId ?? "uncategorized", `var(--color-${row.color})`]),
  );
  const maxTrend = Math.max(...data.trend.map((t) => t.total), 1);
  // The most recent bar is the month being viewed; highlighting it gives the
  // trend a "you are here" anchor instead of six interchangeable bars.
  const currentIndex = data.trend.length - 1;

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-5">
        <p className="text-[13px] font-medium text-fg-muted">{formatMonthLabel(data.monthKey)}</p>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Analytics</h1>
      </header>

      <section className="mb-5 rounded-card bg-surface p-5 shadow-card">
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-fg-faint">
          6-month trend
        </h2>
        <div className="flex h-36 items-end justify-between gap-2">
          {data.trend.map((point, i) => {
            const isCurrent = i === currentIndex;
            return (
              <div
                key={`${point.monthKey.year}-${point.monthKey.month}`}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span
                  className={`text-[10px] font-semibold tnum ${
                    isCurrent ? "text-fg" : "text-fg-faint"
                  }`}
                >
                  {point.total > 0 ? Math.round(point.total / 1000) + "k" : ""}
                </span>
                <div className="flex h-24 w-full items-end">
                  <div
                    className={`w-full rounded-t-lg transition-[height] duration-500 ${
                      isCurrent ? "bg-accent" : "bg-accent/35"
                    }`}
                    style={{
                      height: `${Math.max((point.total / maxTrend) * 100, point.total > 0 ? 4 : 0)}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    isCurrent ? "text-fg" : "text-fg-faint"
                  }`}
                >
                  {formatMonthLabel(point.monthKey).split(" ")[0].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {data.total > 0 ? (
        <section className="mb-5 rounded-card bg-accent-soft p-5 shadow-card">
          <DonutChart
            donut={data.donut}
            colors={colors}
            centerLabel="total spend"
            centerValue={formatCurrency(data.total)}
            size="lg"
          />
        </section>
      ) : null}

      {data.breakdown.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-fg-faint">
            By category
          </h2>
          <div className="flex flex-col gap-2.5">
            {data.breakdown.map((row) => {
              const share = data.total > 0 ? row.amount / data.total : 0;
              return (
                <div
                  key={row.categoryId ?? "uncategorized"}
                  className="flex items-center gap-3 rounded-card bg-surface p-3.5 shadow-card"
                >
                  {row.categoryId ? (
                    <CategoryTile
                      icon={asCategoryIcon(row.icon)}
                      color={asCategoryColor(row.color)}
                      size="md"
                    />
                  ) : (
                    <DashedTile size="md" label="question" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-fg">{row.name}</span>
                      <span className="shrink-0 text-sm font-bold text-fg tnum">
                        {formatCurrency(row.amount)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-sunken">
                        <div
                          className="h-full rounded-pill"
                          style={{
                            width: `${share * 100}%`,
                            backgroundColor: row.categoryId
                              ? `var(--color-${row.color})`
                              : "var(--color-fg-faint)",
                          }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-[11px] font-semibold text-fg-faint tnum">
                        {Math.round(share * 1000) / 10}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-fg-muted">
          No spending recorded for {formatMonthLabel(data.monthKey)} yet.
        </p>
      )}
    </div>
  );
}
