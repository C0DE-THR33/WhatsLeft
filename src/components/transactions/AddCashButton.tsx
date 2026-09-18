"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryTile, DashedTile } from "./CategoryTile";
import { asCategoryIcon, asCategoryColor, type CategoryOption } from "@/lib/categories";


// The circular add button on Home, plus the sheet it opens. Bank rows come
// from the AA sync; this is how cash — the spending a bank feed can never
// see — gets in.
//
// Category is optional on purpose. Leaving it blank runs the merchant
// rules server-side (lib/categorize.ts), so "Auto rickshaw" files itself
// under Transport without the user being made to choose. Picking one
// explicitly overrides that and records MANUAL.
export function AddCashButton({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add a cash transaction"
        // Sits above the fixed bottom nav (which is ~61px plus the safe
        // area), so it can never overlap the tab bar on a device with a
        // home indicator.
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50%-13rem))] z-20 flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-card transition-transform active:scale-95"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open ? <AddCashSheet categories={categories} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function AddCashSheet({
  categories,
  onClose,
}: {
  categories: CategoryOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountValue = Number(amount);
  const canSave =
    !saving && merchantName.trim().length > 0 && Number.isFinite(amountValue) && amountValue > 0;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          merchantName: merchantName.trim(),
          categoryId,
          direction: "DEBIT",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save that");
      }

      onClose();
      // Server Components hold this page's data, so a refresh is what makes
      // the new row, the donut and the budget bar agree with the database.
      router.refresh();
    } catch (caught) {
      // Catches the synchronous throws too, not just rejected fetches —
      // the login button's "stuck on Sending…" bug was exactly this shape.
      setError(caught instanceof Error ? caught.message : "Could not save that");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-surface p-5 pb-8 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-pill bg-border" />
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-fg-faint">
          Cash transaction
        </p>
        <h2 className="mb-5 text-lg font-bold tracking-tight text-fg">What did you spend on?</h2>

        <label className="mb-2 block text-[13px] font-semibold text-fg-muted" htmlFor="cash-amount">
          Amount
        </label>
        <div className="mb-4 flex items-center gap-2 rounded-tile border border-border bg-bg px-4 py-3">
          <span className="text-xl font-bold text-fg-faint">₹</span>
          <input
            id="cash-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            autoFocus
            className="tnum w-full bg-transparent text-xl font-bold text-fg outline-none placeholder:text-fg-faint"
          />
        </div>

        <label className="mb-2 block text-[13px] font-semibold text-fg-muted" htmlFor="cash-merchant">
          Where
        </label>
        <input
          id="cash-merchant"
          type="text"
          value={merchantName}
          onChange={(event) => setMerchantName(event.target.value)}
          placeholder="Auto rickshaw, chai, groceries…"
          maxLength={120}
          className="mb-5 w-full rounded-tile border border-border bg-bg px-4 py-3 text-sm font-medium text-fg outline-none placeholder:text-fg-faint focus:border-accent"
        />

        <p className="mb-3 text-[13px] font-semibold text-fg-muted">
          Category <span className="font-normal text-fg-faint">— optional, we&apos;ll guess</span>
        </p>
        <div className="mb-5 grid grid-cols-4 gap-y-4">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className="flex flex-col items-center gap-1.5"
          >
            <span className={categoryId === null ? "rounded-[0.95rem] ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}>
              <DashedTile size="md" label="question" />
            </span>
            <span className="max-w-[4.5rem] truncate text-[11px] font-medium text-fg-muted">
              Auto
            </span>
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <CategoryTile
                icon={asCategoryIcon(category.icon)}
                color={asCategoryColor(category.color)}
                size="md"
                selected={categoryId === category.id}
              />
              <span className="max-w-[4.5rem] truncate text-[11px] font-medium text-fg-muted">
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {error ? <p className="mb-3 text-sm font-medium text-danger-fg">{error}</p> : null}

        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="w-full rounded-pill bg-accent py-3.5 text-sm font-bold text-accent-fg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add transaction"}
        </button>
      </div>
    </div>
  );
}
