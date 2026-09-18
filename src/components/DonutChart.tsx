import type { DonutResult } from "@/lib/donut";

// Shared by Home and Analytics — both render the same "spend by category
// this month" ring, just with different surrounding chrome, so the chart
// itself lives here rather than being duplicated (CONVENTIONS.md #4).
export function DonutChart({
  donut,
  colors,
  centerLabel,
  centerValue,
  size = "md",
}: {
  donut: DonutResult;
  colors: Record<string, string>;
  centerLabel: string;
  centerValue: string;
  size?: "md" | "lg";
}) {
  const radius = 15.9155; // circumference works out to exactly 100
  // A thick ring with rounded caps reads as a deliberate object; the thin
  // hairline it replaced looked like a loading spinner.
  const strokeWidth = 5.5;

  const box = size === "lg" ? "size-52" : "size-44";
  const valueText = size === "lg" ? "text-[28px]" : "text-2xl";

  return (
    <div className={`relative mx-auto ${box}`}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90 overflow-visible">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="var(--color-surface-sunken)"
          strokeWidth={strokeWidth}
        />
        {donut.segments.map((segment) => (
          <circle
            key={segment.id}
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke={colors[segment.id] ?? "var(--color-cat-other)"}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            // Rounded caps overlap adjacent segments by half a stroke width,
            // so they're only safe on a single-segment ring; with several,
            // butt caps keep each share's arc length honest.
            strokeLinecap={donut.segments.length === 1 ? "round" : "butt"}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className={`${valueText} font-bold tracking-tight text-fg tnum`}>{centerValue}</span>
        <span className="text-xs font-medium text-fg-muted">{centerLabel}</span>
      </div>
    </div>
  );
}
