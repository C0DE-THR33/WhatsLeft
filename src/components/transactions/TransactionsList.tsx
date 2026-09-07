"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryTile, DashedTile } from "@/components/transactions/CategoryTile";
import { CategorizeSheet } from "@/components/transactions/CategorizeSheet";
import { recencyBucket, type RecencyBucket } from "@/lib/dates";
import type { CategoryIcon } from "@/lib/categories";
import type { CategoryOption, TransactionRow } from "@/lib/queries";

const FILTERS: { label: string; icon: CategoryIcon | "all" }[] = [
  { label: "All", icon: "all" },
  { label: "Food", icon: "food" },
  { label: "Transport", icon: "transport" },
  { label: "Shopping", icon: "shopping" },
  { label: "Bills", icon: "bills" },
];

const BUCKET_ORDER: RecencyBucket[] = ["Today", "Yesterday", "This week", "Earlier"];

interface TransactionsListProps {
  initialTransactions: TransactionRow[];
  categories: CategoryOption[];
}

export function TransactionsList({ initialTransactions, categories }: TransactionsListProps) {
  const router = useRouter();
  const [txns, setTxns] = useState(initialTransactions);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["icon"]>("all");
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? txns : txns.filter((t) => t.icon === filter)),
    [txns, filter]
  );

  const groups = useMemo(() => {
    const now = new Date();
    return BUCKET_ORDER.map((bucket) => ({
      bucket,
      items: filtered.filter((t) => recencyBucket(new Date(t.transactionDate), now) === bucket),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  async function saveCategory(categoryId: string, note: string) {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${editing.id}/categorize`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, note }),
      });
      if (!res.ok) throw new Error(await res.text());

      const category = categories.find((c) => c.id === categoryId);
      setTxns((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? { ...t, categoryId, categoryLabel: category?.label ?? null, icon: category?.icon ?? null }
            : t
        )
      );
      setEditing(null);
      router.refresh(); // keep the server-fetched data in sync for the next navigation
    } catch {
      // TODO: surface a real error toast — for now the sheet just stays
      // open with its Save button re-enabled so the user can retry.
    } finally {
      setSaving(false);
    }
  }

  if (txns.length === 0) {
    return (
      <main className="flex flex-col gap-4 p-5">
        <span className="text-[19px] font-extrabold">Transactions</span>
        <div className="mt-8 rounded-[18px] border border-dashed border-border bg-surface p-6 text-center">
          <p className="text-[13px] text-muted">
            No transactions yet. Once your bank is connected, they&apos;ll show up here
            automatically.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[19px] font-extrabold">Transactions</span>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="var(--foreground)" strokeWidth="1.8" />
          <path d="M20 20l-4-4" stroke="var(--foreground)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.icon)}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold whitespace-nowrap ${
              filter === f.icon
                ? "border-foreground bg-foreground text-white"
                : "border-border bg-surface"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.map(({ bucket, items }) => (
        <div key={bucket}>
          <div className="mt-1.5 mb-0.5 text-[11.5px] font-bold tracking-wide text-faint uppercase">
            {bucket}
          </div>
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-border py-2.5">
              {t.icon ? (
                <CategoryTile icon={t.icon} size="md" />
              ) : (
                <DashedTile glyph="?" size="md" />
              )}
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[13.5px] font-bold">{t.merchant}</span>
                {t.categoryLabel ? (
                  <span className="text-[11.5px] text-muted">
                    {t.categoryLabel} · {t.bank}
                  </span>
                ) : (
                  <button
                    onClick={() => setEditing(t)}
                    className="w-fit rounded-full bg-warn-soft px-3 py-1 text-[11.5px] font-bold text-warn-fg"
                  >
                    Set category ▾
                  </button>
                )}
              </div>
              <span
                className={`text-[13.5px] font-bold ${t.type === "DEBIT" ? "text-danger-fg" : "text-success-fg"}`}
              >
                {t.type === "DEBIT" ? "−" : "+"}₹{t.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      ))}

      {editing && (
        <CategorizeSheet
          merchant={editing.merchant}
          amount={editing.amount}
          meta={`${recencyBucket(new Date(editing.transactionDate))} · ${editing.bank}`}
          categories={categories}
          detectedCategoryId={editing.categoryId ?? undefined}
          onClose={() => !saving && setEditing(null)}
          onSave={saveCategory}
        />
      )}
    </main>
  );
}
