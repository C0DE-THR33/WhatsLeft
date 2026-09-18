import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { formatShortDate } from "@/lib/dates";
import { asCategoryIcon, asCategoryColor, UNCATEGORIZED_LABEL } from "@/lib/categories";
import { CategoryTile, DashedTile } from "./CategoryTile";

// Rows link to /transactions/[id]. This used to be a Client Component that
// opened a categorize sheet on tap and held the resulting optimistic
// override in state; a row can only do one thing on tap, and now that a
// detail page exists, going there is the expected one. Categorizing moved
// with it (TransactionCategoryEditor), which also means one component
// writes categories instead of two.
//
// With no interaction state left, there is nothing for "use client" to buy
// (CONVENTIONS.md #4) — so this renders on the server like the page that
// holds it.

export interface TransactionRow {
  id: string;
  amount: number;
  direction: "DEBIT" | "CREDIT";
  description: string;
  merchantName: string | null;
  transactionDate: Date;
  category: { id: string; name: string; icon: string; color: string } | null;
}

export function TransactionsList({ transactions }: { transactions: TransactionRow[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-fg">No transactions yet</p>
        <p className="max-w-xs text-sm text-fg-muted">
          Connect a bank account, or add a cash transaction with the + button on Home.
        </p>
      </div>
    );
  }

  const grouped = groupByDay(transactions);

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(([day, rows]) => (
        <div key={day} className="flex flex-col gap-2">
          <h3 className="px-1 text-[11px] font-bold uppercase tracking-wide text-fg-faint">{day}</h3>
          <div className="overflow-hidden rounded-card bg-surface shadow-card">
            {rows.map((tx, i) => (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                  i > 0 ? "border-t border-border" : ""
                }`}
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
                  <p className="truncate text-[11px] font-medium text-fg-faint">
                    {tx.category?.name ?? UNCATEGORIZED_LABEL}
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
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByDay(transactions: TransactionRow[]): [string, TransactionRow[]][] {
  const groups = new Map<string, TransactionRow[]>();
  for (const tx of transactions) {
    const key = formatShortDate(tx.transactionDate);
    const existing = groups.get(key);
    if (existing) existing.push(tx);
    else groups.set(key, [tx]);
  }
  return Array.from(groups.entries());
}
