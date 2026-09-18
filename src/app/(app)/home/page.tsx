import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getHomeData, getCategoriesForUser } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { formatMonthLabel, currentMonthKey, formatShortDate } from "@/lib/dates";
import { asCategoryIcon, asCategoryColor } from "@/lib/categories";
import { CategoryTile, DashedTile } from "@/components/transactions/CategoryTile";
import { DonutChart } from "@/components/DonutChart";
import { BudgetPaceBar } from "@/components/budget/BudgetPaceBar";
import { AddCashButton } from "@/components/transactions/AddCashButton";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirects; keeps TypeScript honest below

  const [data, categories] = await Promise.all([
    getHomeData(user.id),
    getCategoriesForUser(user.id),
  ]);
  const colors = Object.fromEntries(
    data.breakdown.map((row) => [row.categoryId ?? "uncategorized", `var(--color-${row.color})`]),
  );

  // Shares are computed off the same total the donut uses, which already
  // includes uncategorized spend — so these bars sum to the whole, with no
  // invisible gap (CONVENTIONS.md #4).
  const total = data.totalSpentThisMonth;

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-5">
        <p className="text-[13px] font-medium text-fg-muted">
          {formatMonthLabel(currentMonthKey())}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          Hi, {user.email.split("@")[0]}
        </h1>
      </header>

      {!data.hasLinkedAccounts ? (
        <Link
          href="/connect-bank"
          className="mb-5 flex items-center gap-3 rounded-card border border-dashed border-accent/40 bg-accent-soft p-4 text-sm font-semibold text-accent-soft-fg"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          Connect a bank account to see your spending
        </Link>
      ) : null}

      {/* The hero sits on a tinted surface rather than a neutral card — the
       * one element that should read as a distinct plane (see globals.css). */}
      <section className="mb-5 rounded-card bg-accent-soft p-5 shadow-card">
        <DonutChart
          donut={data.donut}
          colors={colors}
          centerLabel="spent this month"
          centerValue={formatCurrency(total)}
          size="lg"
        />

        <div className="mt-5">
          {data.budgetTotal !== null ? (
            <>
              <div className="mb-2.5 flex items-baseline justify-between">
                <p className="text-[13px] font-medium text-accent-soft-fg">
                  {formatCurrency(Math.max(data.budgetRemaining ?? 0, 0))} left
                </p>
                <p className="text-[13px] font-medium text-accent-soft-fg tnum">
                  of {formatCurrency(data.budgetTotal)}
                </p>
              </div>
              <BudgetPaceBar spent={total} budget={data.budgetTotal} />
            </>
          ) : (
            <Link
              href="/budget"
              className="flex items-center justify-center gap-2 rounded-pill bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg"
            >
              Set a budget for this month
            </Link>
          )}
        </div>
      </section>

      {data.breakdown.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-fg-faint">
            By category
          </h2>
          <div className="flex flex-col gap-2.5">
            {data.breakdown.map((row) => {
              const share = total > 0 ? row.amount / total : 0;
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
                      <span className="w-9 shrink-0 text-right text-[11px] font-semibold text-fg-faint tnum">
                        {Math.round(share * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-fg-faint">
            Recent transactions
          </h2>
          <Link href="/transactions" className="text-[13px] font-semibold text-accent">
            See all
          </Link>
        </div>

        {data.recentTransactions.length === 0 ? (
          <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-fg-muted">
            Nothing here yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-card bg-surface shadow-card">
            {data.recentTransactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
              >
                {tx.category ? (
                  <CategoryTile
                    icon={asCategoryIcon(tx.category.icon)}
                    color={asCategoryColor(tx.category.color)}
                    size="sm"
                  />
                ) : (
                  <DashedTile size="sm" label="question" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">
                    {tx.merchantName ?? tx.description}
                  </p>
                  <p className="text-[11px] font-medium text-fg-faint">
                    {formatShortDate(tx.transactionDate)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold tnum ${
                    tx.direction === "CREDIT" ? "text-success-fg" : "text-fg"
                  }`}
                >
                  {tx.direction === "CREDIT" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <AddCashButton categories={categories} />
    </div>
  );
}
