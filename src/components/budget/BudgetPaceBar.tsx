import { daysRemainingInMonth, monthProgress } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Shared by Home and Budget — both answer "am I on track this month", so
// the bar and the arithmetic behind it live in one place rather than being
// duplicated per screen (CONVENTIONS.md #4).
//
// The point of the Today marker is that a progress bar alone can't tell you
// anything: 75% spent is healthy on the 25th and alarming on the 8th. The
// marker puts the month's own progress on the same axis, so "am I ahead of
// pace" becomes a thing you see rather than a thing you calculate.

export function BudgetPaceBar({
  spent,
  budget,
  now = new Date(),
}: {
  spent: number;
  budget: number;
  now?: Date;
}) {
  const remaining = budget - spent;
  const daysLeft = daysRemainingInMonth(now);
  const spentFraction = budget > 0 ? spent / budget : 0;
  const timeFraction = monthProgress(now);

  const overBudget = remaining < 0;
  // Ahead of pace only counts once you're meaningfully ahead — a couple of
  // percent either side of the marker is noise, not a warning.
  const aheadOfPace = !overBudget && spentFraction > timeFraction + 0.05;

  const tone = overBudget ? "danger" : aheadOfPace ? "warn" : "accent";
  const perDay = remaining > 0 ? remaining / daysLeft : 0;

  return (
    <div>
      <div className="relative">
        <div className="h-3.5 w-full overflow-hidden rounded-pill bg-surface-sunken">
          <div
            className={cn(
              "h-full rounded-pill transition-[width] duration-500",
              tone === "danger" && "bg-danger",
              tone === "warn" && "bg-warn",
              tone === "accent" && "bg-accent",
            )}
            style={{ width: `${Math.min(spentFraction, 1) * 100}%` }}
          />
        </div>

        {/* The month's own progress, drawn over the bar. */}
        <div
          className="absolute -top-1 bottom-[-0.25rem] w-0.5 rounded-pill bg-fg/45"
          style={{ left: `${timeFraction * 100}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-fg-muted">
          {overBudget ? (
            <>
              <span className="font-semibold text-danger-fg tnum">{formatCurrency(-remaining)}</span> over
              budget
            </>
          ) : (
            <>
              <span className="font-semibold text-fg tnum">{formatCurrency(perDay)}</span> a day for{" "}
              {daysLeft} more {daysLeft === 1 ? "day" : "days"}
            </>
          )}
        </p>
        <p className="shrink-0 text-[13px] font-semibold text-fg-muted tnum">
          {Math.round(spentFraction * 100)}%
        </p>
      </div>

      {aheadOfPace ? (
        <p className="mt-1.5 text-[13px] text-warn-fg">
          Spending faster than the month is passing.
        </p>
      ) : null}
    </div>
  );
}
