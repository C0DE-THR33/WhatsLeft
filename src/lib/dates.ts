// Pure date-bucketing helpers — no database, no browser, so they get a
// standalone verification script rather than being trusted on read
// (CONVENTIONS.md #8). See scripts run during development: month-boundary
// rollover across a year boundary is exactly the kind of edge case that's
// easy to get backwards with plain Date arithmetic.

export interface MonthKey {
  year: number;
  month: number; // 1-12
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** The [start, end) half-open range covering every millisecond of a given month. */
export function monthRange({ year, month }: MonthKey): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

/** Steps a MonthKey by `delta` months, correctly rolling over a year boundary either direction. */
export function shiftMonth({ year, month }: MonthKey, delta: number): MonthKey {
  const zeroBased = month - 1 + delta;
  const newYear = year + Math.floor(zeroBased / 12);
  const newMonth = ((zeroBased % 12) + 12) % 12;
  return { year: newYear, month: newMonth + 1 };
}

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonthLabel({ year, month }: MonthKey): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date);
}

export function isSameMonth(date: Date, key: MonthKey): boolean {
  return date.getUTCFullYear() === key.year && date.getUTCMonth() + 1 === key.month;
}

/** Total days in a month, leap years included. */
export function daysInMonth({ year, month }: MonthKey): number {
  // Day 0 of the *next* month is the last day of this one, which sidesteps
  // needing a leap-year rule of our own.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Days left in the current month, counting today as one of them — the
 * denominator for "you can keep spending X a day".
 *
 * Counting today matters: on the last day of the month this returns 1, not
 * 0, so the caller divides by 1 rather than dividing by zero and rendering
 * an Infinity. The elapsed portion of today is deliberately ignored; a
 * daily allowance that shrank hour by hour would be unusable.
 */
export function daysRemainingInMonth(now: Date = new Date()): number {
  const total = daysInMonth(currentMonthKey(now));
  return total - now.getDate() + 1;
}

/** How far through the month we are, 0-1 — the "Today" marker's position. */
export function monthProgress(now: Date = new Date()): number {
  const total = daysInMonth(currentMonthKey(now));
  return (now.getDate() - 1) / total;
}
