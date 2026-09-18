"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryTile, DashedTile } from "./CategoryTile";
import {
  asCategoryIcon,
  asCategoryColor,
  UNCATEGORIZED_LABEL,
  type CategoryOption,
} from "@/lib/categories";


// The category block on the detail page: shows what the transaction is
// filed under, why, and lets that be changed in place.
//
// It reuses the same PATCH route the list's sheet uses rather than adding a
// second way to write a category — one endpoint, one ownership check.
export function TransactionCategoryEditor({
  transactionId,
  category,
  categories,
  sourceLabel,
}: {
  transactionId: string;
  category: { id: string; name: string; icon: string; color: string } | null;
  categories: CategoryOption[];
  sourceLabel: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(next: CategoryOption | null) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${transactionId}/categorize`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: next?.id ?? null }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save that");
      }
      setOpen(false);
      setSaving(false);
      // The page is a Server Component, so the new category, its source
      // line, and every total that depends on it come from a refresh.
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save that");
      setSaving(false);
    }
  }

  return (
    <section className="mb-5">
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-fg-faint">Category</h2>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-card bg-surface p-3.5 text-left shadow-card"
      >
        {category ? (
          <CategoryTile
            icon={asCategoryIcon(category.icon)}
            color={asCategoryColor(category.color)}
            size="md"
          />
        ) : (
          <DashedTile size="md" label="question" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-fg">
            {category?.name ?? UNCATEGORIZED_LABEL}
          </span>
          <span className="block truncate text-[11px] font-medium text-fg-faint">
            {sourceLabel ?? "Tap to choose"}
          </span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-fg-faint">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      {error ? <p className="mt-2 text-sm font-medium text-danger-fg">{error}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-surface p-5 pb-8 shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-pill bg-border" />
            <p className="mb-5 text-lg font-bold tracking-tight text-fg">Choose a category</p>

            <div className="grid grid-cols-4 gap-y-4">
              {categories.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={saving}
                  onClick={() => pick(option)}
                  className="flex flex-col items-center gap-1.5 disabled:opacity-60"
                >
                  <CategoryTile
                    icon={asCategoryIcon(option.icon)}
                    color={asCategoryColor(option.color)}
                    size="md"
                    selected={option.id === category?.id}
                  />
                  <span className="max-w-[4.5rem] truncate text-[11px] font-medium text-fg-muted">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => pick(null)}
              className="mt-5 w-full rounded-pill border border-border py-3 text-sm font-semibold text-fg-muted disabled:opacity-60"
            >
              Mark as uncategorized
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
