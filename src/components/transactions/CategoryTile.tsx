import { cn } from "@/lib/utils";
import type { CategoryIcon, CategoryColor } from "@/lib/categories";

// The one way a category ever renders — a colored rounded-square tile with
// a hand-drawn stroke-SVG icon. Never fall back to a plain colored dot or
// a letter avatar once this exists (CONVENTIONS.md #3): consistency across
// every screen is the entire point, which is also why the uncategorized
// state below gets its own DashedTile rather than silently reusing this
// one with muted colors.

const SIZES = {
  sm: { tile: "size-8", icon: 16 },
  md: { tile: "size-10", icon: 20 },
  lg: { tile: "size-14", icon: 24 },
} as const;

type Size = keyof typeof SIZES;

// Inline stroke-SVG, one consistent grid, currentColor — never emoji, never
// an icon font (CONVENTIONS.md #3).
const ICONS: Record<CategoryIcon, (props: { size: number }) => React.ReactNode> = {
  food: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v7a2 2 0 0 0 2 2v9" />
      <path d="M11 3v9" />
      <path d="M15 3v7a2 2 0 0 1-2 2" />
      <path d="M18 3c-1.5 3-1.5 8 0 9v9" />
    </svg>
  ),
  transport: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <path d="M4 13h16" />
      <circle cx="8" cy="19" r="1.5" />
      <circle cx="16" cy="19" r="1.5" />
      <path d="M6 7l1.5-3h9L18 7" />
    </svg>
  ),
  shopping: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  bills: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h4" />
    </svg>
  ),
  entertainment: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M9 9l5 3-5 3V9Z" />
    </svg>
  ),
  other: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="12" cy="12" r="1.25" />
      <circle cx="19" cy="12" r="1.25" />
    </svg>
  ),
};

export interface CategoryTileProps {
  icon: CategoryIcon;
  color: CategoryColor;
  size?: Size;
  selected?: boolean;
}

export function CategoryTile({ icon, color, size = "md", selected = false }: CategoryTileProps) {
  const { tile, icon: iconSize } = SIZES[size];
  const Icon = ICONS[icon];

  return (
    <div className="relative inline-flex">
      <div
        className={cn(
          tile,
          "flex items-center justify-center rounded-xl",
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-bg",
        )}
        style={{ backgroundColor: `var(--color-${color})`, color: "white" }}
      >
        <Icon size={iconSize} />
      </div>
      {selected ? (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-accent-fg">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      ) : null}
    </div>
  );
}

// "Uncategorized" and "add category" — the only two things that ever
// render as a dashed tile instead of a solid one.
export function DashedTile({ size = "md", label }: { size?: Size; label?: "plus" | "question" }) {
  const { tile, icon: iconSize } = SIZES[size];

  return (
    <div
      className={cn(
        tile,
        "flex items-center justify-center rounded-xl border-2 border-dashed border-border text-fg-muted",
      )}
    >
      {label === "plus" ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
          <path d="M12 17h.01" />
        </svg>
      )}
    </div>
  );
}
