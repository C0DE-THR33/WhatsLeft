"use client";

import { useMemo, useState } from "react";
import { CategoryTile, DashedTile } from "@/components/transactions/CategoryTile";
import { CategorizeSheet } from "@/components/transactions/CategorizeSheet";
import type { CategoryIcon } from "@/lib/categories";

// Full mockup: design/Transactions.dc.html
// TODO: replace with db.transaction.findMany grouped by transactionDate,
// with server-side filtering by category once real data (and auth) exist.

type Txn = {
  id: string;
  merchant: string;
  icon: CategoryIcon | null; // null = uncategorized
  amount: number;
  bank: string;
  group: "Today" | "Yesterday" | "This week";
};

const SEED: Txn[] = [
  { id: "1", merchant: "Swiggy", icon: "food", amount: -450, bank: "HDFC ••1234", group: "Today" },
  { id: "2", merchant: "Uber", icon: "transport", amount: -180, bank: "ICICI ••5678", group: "Today" },
  { id: "3", merchant: "Zomato", icon: null, amount: -610, bank: "ICICI ••5678", group: "Today" },
  { id: "4", merchant: "Amazon", icon: "shopping", amount: -1299, bank: "HDFC ••1234", group: "Yesterday" },
  { id: "5", merchant: "Electricity Bill", icon: "bills", amount: -1850, bank: "ICICI ••5678", group: "Yesterday" },
  { id: "6", merchant: "Salary credit", icon: "income", amount: 45000, bank: "HDFC ••1234", group: "This week" },
  { id: "7", merchant: "Netflix", icon: "entertainment", amount: -499, bank: "HDFC ••1234", group: "This week" },
];

const FILTERS: { label: string; icon: CategoryIcon | "all" }[] = [
  { label: "All", icon: "all" },
  { label: "Food", icon: "food" },
  { label: "Transport", icon: "transport" },
  { label: "Shopping", icon: "shopping" },
  { label: "Bills", icon: "bills" },
];

export default function TransactionsPage() {
  const [txns, setTxns] = useState(SEED);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["icon"]>("all");
  const [editing, setEditing] = useState<Txn | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? txns : txns.filter((t) => t.icon === filter)),
    [txns, filter]
  );

  const groups = useMemo(() => {
    const order: Txn["group"][] = ["Today", "Yesterday", "This week"];
    return order
      .map((group) => ({ group, items: filtered.filter((t) => t.group === group) }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

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

      {groups.map(({ group, items }) => (
        <div key={group}>
          <div className="mt-1.5 mb-0.5 text-[11.5px] font-bold tracking-wide text-faint uppercase">
            {group}
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
                {t.icon ? (
                  <span className="text-[11.5px] text-muted">
                    {t.icon[0].toUpperCase() + t.icon.slice(1)} · {t.bank}
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
                className={`text-[13.5px] font-bold ${t.amount < 0 ? "text-danger-fg" : "text-success-fg"}`}
              >
                {t.amount < 0 ? "−" : "+"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      ))}

      {editing && (
        <CategorizeSheet
          merchant={editing.merchant}
          amount={editing.amount}
          meta={`${editing.group} · ${editing.bank}`}
          onClose={() => setEditing(null)}
          onSave={(icon) => {
            setTxns((prev) => prev.map((t) => (t.id === editing.id ? { ...t, icon } : t)));
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}
