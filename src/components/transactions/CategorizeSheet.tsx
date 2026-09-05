"use client";

import { useState } from "react";
import { CategoryTile, DashedTile } from "@/components/transactions/CategoryTile";
import type { CategoryIcon } from "@/lib/categories";

// Full mockup: design/TransactionAlert.dc.html — just the in-app sheet.
// The OS-level push notification half of that mockup isn't page code at
// all (it's a real system notification, wired up separately later); this
// component is what it opens into.

const PICKABLE: { icon: CategoryIcon; label: string }[] = [
  { icon: "food", label: "Food" },
  { icon: "transport", label: "Transport" },
  { icon: "shopping", label: "Shopping" },
  { icon: "bills", label: "Bills" },
  { icon: "entertainment", label: "Fun" },
];

interface CategorizeSheetProps {
  merchant: string;
  amount: number;
  meta: string;
  detectedIcon?: CategoryIcon;
  onClose: () => void;
  onSave: (icon: CategoryIcon, note: string, splitIntoItems: boolean) => void;
}

export function CategorizeSheet({
  merchant,
  amount,
  meta,
  detectedIcon,
  onClose,
  onSave,
}: CategorizeSheetProps) {
  const [picked, setPicked] = useState<CategoryIcon | undefined>(detectedIcon);
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30">
      <div className="flex w-full max-w-[420px] flex-col gap-4 rounded-t-[26px] bg-surface p-5 pb-7 shadow-[0_-8px_24px_rgba(0,0,0,0.1)]">
        <div className="mx-auto h-1 w-9 rounded-full bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-bold tracking-wide text-muted uppercase">
            New transaction
          </span>
          <button onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="var(--faint)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {picked ? <CategoryTile icon={picked} /> : <DashedTile glyph="?" />}
          <div className="flex flex-1 flex-col">
            <span className="text-base font-extrabold">{merchant}</span>
            <span className="text-[11.5px] text-muted">{meta}</span>
          </div>
          <span className="text-[19px] font-extrabold">
            ₹{Math.abs(amount).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-3">
          <span className="text-[12.5px] text-muted">
            {detectedIcon ? (
              <>
                Detected as <b className="font-extrabold text-foreground">
                  {PICKABLE.find((p) => p.icon === detectedIcon)?.label}
                </b>{" "}
                — tap to change
              </>
            ) : (
              "Pick a category"
            )}
          </span>
          <div className="grid grid-cols-4 gap-3">
            {PICKABLE.map((p) => (
              <button
                key={p.icon}
                onClick={() => setPicked(p.icon)}
                className="flex flex-col items-center gap-1.5"
              >
                <CategoryTile icon={p.icon} size="lg" selected={picked === p.icon} />
                <span
                  className={`text-[11.5px] ${picked === p.icon ? "font-extrabold" : "font-semibold text-muted"}`}
                >
                  {p.label}
                </span>
              </button>
            ))}
            <div className="flex flex-col items-center gap-1.5">
              <DashedTile glyph="+" size="lg" />
              <span className="text-[11.5px] font-semibold text-faint">More</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold">Was this a single purchase?</span>
          <div className="flex rounded-xl border border-border p-1">
            <div className="flex-1 rounded-lg bg-foreground py-2.5 text-center text-[12.5px] font-bold text-white">
              Single expense
            </div>
            <div className="flex flex-1 items-center justify-center gap-1.5 text-[12.5px] font-bold text-faint">
              Split into items
              <span className="rounded-full bg-warn-soft px-1.5 py-0.5 text-[9.5px] font-bold text-warn-fg">
                Soon
              </span>
            </div>
          </div>
          <span className="text-[11px] leading-[1.5] text-faint">
            Splitting one purchase into line items uses Bill Scanner, coming in a future
            update.
          </span>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          className="rounded-xl border border-border px-3.5 py-3 text-[13px] outline-none placeholder:text-faint"
        />

        <button
          disabled={!picked}
          onClick={() => picked && onSave(picked, note, false)}
          className="rounded-2xl bg-accent py-3.5 text-center text-[15px] font-bold text-white disabled:opacity-40"
        >
          Save transaction
        </button>
        <button onClick={onClose} className="text-center text-[12.5px] font-bold text-muted">
          Categorize later
        </button>
      </div>
    </div>
  );
}
