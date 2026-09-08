import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getHomeData } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { formatMonthLabel, currentMonthKey } from "@/lib/dates";
import { asCategoryIcon, asCategoryColor } from "@/lib/categories";
import { CategoryTile, DashedTile } from "@/components/transactions/CategoryTile";
import { DonutChart } from "@/components/DonutChart";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirects; keeps TypeScript honest below

  const data = await getHomeData(user.id);
  const colors = Object.fromEntries(
    data.breakdown.map((row) => [row.categoryId ?? "uncategorized", `var(--color-${row.color})`]),
  );

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-fg-muted">{formatMonthLabel(currentMonthKey())}</p>
          <h1 className="text-xl font-semibold text-fg">Hi, {user.email.split("@")[0]}</h1>
        </div>
      </header>

      {!data.hasLinkedAccounts ? (
        <Link
          href="/connect-bank"
          className="mb-6 block rounded-2xl border border-dashed border-border p-4 text-center text-sm font-medium text-accent"
        >
          Connect a bank account to see your spending here
        </Link>
      ) : null}

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <DonutChart
          donut={data.donut}
          colors={colors}
          centerLabel="spent this month"
          centerValue={formatCurrency(data.totalSpentThisMonth)}
        />

        {data.budgetTotal !== null ? (
          <p className="mt-4 text-center text-sm text-fg-muted">
            {formatCurrency(Math.max(data.budgetRemaining ?? 0, 0))} left of{" "}
            {formatCurrency(data.budgetTotal)} budget
          </p>
        ) : (
          <Link href="/budget" className="mt-4 block text-center text-sm text-accent">
            Set a budget for this month
          </Link>
        )}
      </section>

      {data.breakdown.length > 0 ? (
        <section className="mb-6 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-fg">By category</h2>
          {data.breakdown.map((row) => (
            <div key={row.categoryId ?? "uncategorized"} className="flex items-center gap-3">
              {row.categoryId ? (
                <CategoryTile icon={asCategoryIcon(row.icon)} color={asCategoryColor(row.color)} size="sm" />
              ) : (
                <DashedTile size="sm" label="question" />
              )}
              <span className="flex-1 text-sm text-fg">{row.name}</span>
              <span className="text-sm font-medium text-fg">{formatCurrency(row.amount)}</span>
            </div>
          ))}
        </section>
      ) : null}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg">Recent transactions</h2>
          <Link href="/transactions" className="text-sm text-accent">See all</Link>
        </div>

        {data.recentTransactions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-fg-muted">
            Nothing here yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {data.recentTransactions.map((tx, i) => (
              <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                {tx.category ? (
                  <CategoryTile icon={asCategoryIcon(tx.category.icon)} color={asCategoryColor(tx.category.color)} size="sm" />
                ) : (
                  <DashedTile size="sm" label="question" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{tx.merchantName ?? tx.description}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.direction === "CREDIT" ? "text-success" : "text-fg"}`}>
                  {tx.direction === "CREDIT" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
