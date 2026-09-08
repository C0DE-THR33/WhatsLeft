"use client";

import { useState } from "react";
import { asCategoryIcon, asCategoryColor } from "@/lib/categories";
import { CategoryTile } from "./CategoryTile";
import type { TransactionRow } from "./TransactionsList";

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function CategorizeSheet({
  transaction,
  categories,
  onClose,
  onCategorized,
}: {
  transaction: TransactionRow | null;
  categories: CategoryOption[];
  onClose: () => void;
  onCategorized: (transactionId: string, category: CategoryOption | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  async function pick(category: CategoryOption | null) {
    if (!transaction) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${transaction.id}/categorize`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: category?.id ?? null }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save that. Please try again.");
        setSaving(false);
        return;
      }

      onCategorized(transaction.id, category);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">Categorize</p>
        <h2 className="mb-4 text-sm font-medium text-fg">
          {transaction.merchantName ?? transaction.description}
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              disabled={saving}
              onClick={() => pick(category)}
              className="flex flex-col items-center gap-1.5 disabled:opacity-60"
            >
              <CategoryTile
                icon={asCategoryIcon(category.icon)}
                color={asCategoryColor(category.color)}
                size="lg"
                selected={transaction.category?.id === category.id}
              />
              <span className="max-w-[4.5rem] truncate text-[11px] text-fg-muted">{category.name}</span>
            </button>
          ))}
        </div>

        <button
          disabled={saving}
          onClick={() => pick(null)}
          className="mt-4 w-full rounded-lg border border-border py-2.5 text-sm font-medium text-fg-muted disabled:opacity-60"
        >
          Mark as uncategorized
        </button>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
