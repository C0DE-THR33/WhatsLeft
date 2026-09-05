import type { CategoryIcon } from "@/lib/categories";
import { cn } from "@/lib/utils";

const ICON_SVGS: Record<CategoryIcon, (size: number) => React.ReactNode> = {
  food: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 9h14l-1.4 8.4A2 2 0 0 1 15.6 19H8.4a2 2 0 0 1-2-1.6L5 9Z"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M8 9a4 4 0 0 1 8 0" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  transport: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 16v-4.5a1.5 1.5 0 0 1 .3-.9L7 8h10l1.7 2.6a1.5 1.5 0 0 1 .3.9V16"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <rect x="4" y="13" width="16" height="5" rx="1.5" stroke="#fff" strokeWidth="1.7" />
      <circle cx="8" cy="18.4" r="1.3" fill="#fff" />
      <circle cx="16" cy="18.4" r="1.3" fill="#fff" />
    </svg>
  ),
  shopping: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 8h11l-1 11.2a1.5 1.5 0 0 1-1.5 1.3H9a1.5 1.5 0 0 1-1.5-1.3L6.5 8Z"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 8a3 3 0 0 1 6 0" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  bills: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3.5h10v17l-2-1.3-1.7 1.3-1.8-1.3-1.8 1.3L7 19V3.5Z"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 8h5.4M9.3 11.5h5.4M9.3 15h3.3"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  entertainment: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="7.6" stroke="#fff" strokeWidth="1.6" />
      <path d="M10.2 9.3v5.4l4.6-2.7-4.6-2.7Z" fill="#fff" />
    </svg>
  ),
  income: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4v10.5M7.5 11l4.5 4.5L16.5 11"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 19h14" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const SIZE_CLASSES = {
  sm: "h-5 w-5 rounded-[6px]",
  md: "h-9 w-9 rounded-[11px]",
  lg: "aspect-square w-full rounded-[18px]",
} as const;

const ICON_PX = { sm: 11, md: 18, lg: 27 } as const;

interface CategoryTileProps {
  icon: CategoryIcon;
  size?: keyof typeof SIZE_CLASSES;
  /** Ring + checkmark badge, used for the auto-detected pick in the categorize sheet. */
  selected?: boolean;
  className?: string;
}

/** The colored icon tile used for every category, everywhere in the app. */
export function CategoryTile({ icon, size = "md", selected, className }: CategoryTileProps) {
  return (
    <div className={cn("relative flex-shrink-0", selected && "overflow-visible")}>
      <div
        className={cn("flex items-center justify-center", SIZE_CLASSES[size], className)}
        style={{
          background: `var(--cat-${icon})`,
          boxShadow: selected
            ? "0 0 0 2px var(--surface), 0 0 0 4.5px var(--accent)"
            : undefined,
        }}
      >
        {ICON_SVGS[icon](ICON_PX[size])}
      </div>
      {selected && (
        <div className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-surface bg-accent">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12l5 5L20 6"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

const DASHED_SIZE_CLASSES = {
  sm: "h-5 w-5 rounded-[6px]",
  md: "h-9 w-9 rounded-[11px]",
  lg: "aspect-square w-full rounded-[18px]",
} as const;

/**
 * The dashed tile: "?" for an uncategorized transaction, "+" for "add a
 * category". Shares the tile grammar without pretending to a real category.
 */
export function DashedTile({
  glyph,
  size = "md",
  className,
}: {
  glyph: "?" | "+";
  size?: keyof typeof DASHED_SIZE_CLASSES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center border-[1.5px] border-dashed border-border bg-surface text-faint",
        DASHED_SIZE_CLASSES[size],
        className
      )}
    >
      {glyph === "?" ? (
        <span className="font-extrabold" style={{ fontSize: ICON_PX[size] - 2 }}>
          ?
        </span>
      ) : (
        <svg width={ICON_PX[size]} height={ICON_PX[size]} viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
