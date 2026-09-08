import type { Prisma } from "@prisma/client";

/**
 * The one place a Prisma Decimal becomes a JS number. Every query function
 * in lib/queries.ts converts at this boundary — a Decimal should never
 * reach a component prop or a `.toLocaleString()` call directly
 * (CONVENTIONS.md #4).
 */
export function toNum(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

/** ₹12,345.67-style formatting for INR amounts already converted with toNum(). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Minimal `clsx`-style class-name joiner — no need for a dependency for this. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
