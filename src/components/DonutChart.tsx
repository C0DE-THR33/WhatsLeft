import type { DonutResult } from "@/lib/donut";

// Shared by Home and Analytics — both render the same "spend by category
// this month" ring, just with different surrounding chrome, so the chart
// itself lives here rather than being duplicated (CONVENTIONS.md #4).
export function DonutChart({
  donut,
  colors,
  centerLabel,
  centerValue,
}: {
  donut: DonutResult;
  colors: Record<string, string>;
  centerLabel: string;
  centerValue: string;
}) {
  const radius = 15.9155; // circumference works out to exactly 100
  const strokeWidth = 4;

  return (
    <div className="relative mx-auto size-40">
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
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
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-fg">{centerValue}</span>
        <span className="text-[11px] text-fg-muted">{centerLabel}</span>
      </div>
    </div>
  );
}
