"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { formatShortDate } from "@/lib/dates";
import { asCategoryIcon, asCategoryColor } from "@/lib/categories";
import { CategoryTile, DashedTile } from "./CategoryTile";
import { CategorizeSheet, type CategoryOption } from "./CategorizeSheet";

// Server Components fetch, Client Components only hold interaction state
// (CONVENTIONS.md #4): this component receives already-fetched, already-
// toNum()'d rows as props and owns only "which transaction's sheet is
// open" and "which category filter is active."

export interface TransactionRow {
  id: string;
  amount: number;
  direction: "DEBIT" | "CREDIT";
  description: string;
  merchantName: string | null;
  transactionDate: Date;
  category: { id: string; name: string; icon: string; color: string } | null;
}

export function TransactionsList({
  transactions,
  categories,
}: {
  transactions: TransactionRow[];
  categories: CategoryOption[];
}) {
  const [activeTransaction, setActiveTransaction] = useState<TransactionRow | null>(null);
  const [overrides, setOverrides] = useState<Record<string, CategoryOption | null>>({});

  const grouped = useMemo(() => groupByDay(transactions), [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-fg">No transactions yet</p>
        <p className="max-w-xs text-sm text-fg-muted">
          Connect a bank account to start seeing your spending here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(([day, rows]) => (
        <div key={day} className="flex flex-col gap-2">
          <h3 className="px-1 text-xs font-medium uppercase tracking-wide text-fg-muted">{day}</h3>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {rows.map((tx, i) => {
              const override = overrides[tx.id];
              const category = override !== undefined ? override : tx.category;

              return (
                <button
                  key={tx.id}
                  onClick={() => setActiveTransaction(tx)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i > 0 ? "border-t border-border" : ""}`}
                >
                  {category ? (
                    <CategoryTile icon={asCategoryIcon(category.icon)} color={asCategoryColor(category.color)} size="sm" />
                  ) : (
                    <DashedTile size="sm" label="question" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{tx.merchantName ?? tx.description}</p>
                    <p className="truncate text-xs text-fg-muted">{category?.name ?? "Uncategorized"}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.direction === "CREDIT" ? "text-success" : "text-fg"}`}>
                    {tx.direction === "CREDIT" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <CategorizeSheet
        transaction={activeTransaction}
        categories={categories}
        onClose={() => setActiveTransaction(null)}
        onCategorized={(transactionId, category) => {
          setOverrides((prev) => ({ ...prev, [transactionId]: category }));
          setActiveTransaction(null);
        }}
      />
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
