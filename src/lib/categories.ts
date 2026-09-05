/**
 * Single source of truth for category metadata — default label, tile color,
 * and type. Mirrors Category.icon in prisma/schema.prisma (that column
 * stores one of these keys) and the CSS vars in app/globals.css
 * (--cat-<key>), so a category renders identically everywhere: the
 * categorize sheet, Home, Transactions, Budget, Analytics.
 *
 * A user-added category (Category.userId != null) still points at one of
 * these icon keys — there's no per-user custom icon in v1.
 */

export type CategoryIcon =
  | "food"
  | "transport"
  | "shopping"
  | "bills"
  | "entertainment"
  | "income";

export const DEFAULT_CATEGORIES: Record<
  CategoryIcon,
  { label: string; type: "EXPENSE" | "INCOME" }
> = {
  food: { label: "Food", type: "EXPENSE" },
  transport: { label: "Transport", type: "EXPENSE" },
  shopping: { label: "Shopping", type: "EXPENSE" },
  bills: { label: "Bills", type: "EXPENSE" },
  entertainment: { label: "Entertainment", type: "EXPENSE" },
  income: { label: "Income", type: "INCOME" },
};

/** Tailwind class for a category's tile background, via the --cat-* vars. */
export function categoryColorClass(icon: CategoryIcon): string {
  return `bg-cat-${icon}`;
}
