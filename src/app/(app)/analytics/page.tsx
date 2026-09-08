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

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-1 text-xl font-semibold text-fg">Analytics</h1>
      <p className="mb-6 text-sm text-fg-muted">{formatMonthLabel(data.monthKey)}</p>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-fg">6-month trend</h2>
        <div className="flex h-32 items-end justify-between gap-2">
          {data.trend.map((point) => (
            <div key={`${point.monthKey.year}-${point.monthKey.month}`} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end">
                <div
                  className="w-full rounded-t bg-accent"
                  style={{ height: `${Math.max((point.total / maxTrend) * 100, point.total > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-fg-muted">
                {formatMonthLabel(point.monthKey).split(" ")[0].slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {data.total > 0 ? (
        <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
          <DonutChart
            donut={data.donut}
            colors={colors}
            centerLabel="total spend"
            centerValue={formatCurrency(data.total)}
          />
        </section>
      ) : null}

      {data.breakdown.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-fg">By category</h2>
          {data.breakdown.map((row) => (
            <div key={row.categoryId ?? "uncategorized"} className="flex items-center gap-3">
              {row.categoryId ? (
                <CategoryTile icon={asCategoryIcon(row.icon)} color={asCategoryColor(row.color)} size="sm" />
              ) : (
                <DashedTile size="sm" label="question" />
              )}
              <span className="flex-1 text-sm text-fg">{row.name}</span>
              <span className="text-xs text-fg-muted">
                {Math.round((row.amount / data.total) * 1000) / 10}%
              </span>
              <span className="w-20 text-right text-sm font-medium text-fg">{formatCurrency(row.amount)}</span>
            </div>
          ))}
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-fg-muted">
          No spending recorded for {formatMonthLabel(data.monthKey)} yet.
        </p>
      )}
    </div>
  );
}
