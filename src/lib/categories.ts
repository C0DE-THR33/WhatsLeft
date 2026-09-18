// Category.icon is a plain `string` column in Postgres — nothing in the
// database stops a bad value getting in — but the app only ever ships
// hand-drawn stroke-SVG icons for this closed set of six (see
// components/transactions/CategoryTile.tsx, and CONVENTIONS.md #4: "needs
// a runtime narrowing function at the read boundary, not a cast").

export const CATEGORY_ICONS = [
  "food",
  "transport",
  "shopping",
  "bills",
  "entertainment",
  "other",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

const CATEGORY_ICON_SET: ReadonlySet<string> = new Set(CATEGORY_ICONS);

/**
 * Narrows an untrusted `string` (fresh out of the database) to a
 * CategoryIcon. Never throws — an unexpected value is logged and mapped to
 * "other" so one bad row can't crash a whole page render.
 */
export function asCategoryIcon(value: string): CategoryIcon {
  if (CATEGORY_ICON_SET.has(value)) {
    return value as CategoryIcon;
  }

  console.error(`Unexpected category icon "${value}", falling back to "other"`);
  return "other";
}

// Every color a category tile can use is one of these CSS custom-property
// names, mapped to real Tailwind utilities (bg-cat-food, etc.) in
// globals.css — see CONVENTIONS.md #3. Kept in sync with :root by hand.
export const CATEGORY_COLORS = [
  "cat-food",
  "cat-transport",
  "cat-shopping",
  "cat-bills",
  "cat-entertainment",
  "cat-other",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

const CATEGORY_COLOR_SET: ReadonlySet<string> = new Set(CATEGORY_COLORS);

export function asCategoryColor(value: string): CategoryColor {
  if (CATEGORY_COLOR_SET.has(value)) {
    return value as CategoryColor;
  }

  console.error(`Unexpected category color "${value}", falling back to "cat-other"`);
  return "cat-other";
}

export const UNCATEGORIZED_LABEL = "Uncategorized";

/**
 * A category as the UI needs it — the shape every picker renders from.
 * Lives here rather than beside one component because three different
 * components take it as a prop, and a type owned by whichever component
 * happened to define it first is how import cycles start (#2: does it
 * return JSX? No → lib/).
 */
export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}
