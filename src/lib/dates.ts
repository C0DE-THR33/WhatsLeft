/**
 * Plain Date math — no date-fns/dayjs dependency for what's a handful of
 * month-boundary and day-bucket calculations. All local-time, not UTC,
 * matching how a user thinks about "this month" / "today".
 */

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short" });
}

/** e.g. "September 2026" — for the Analytics month header. */
export function monthYearLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export type RecencyBucket = "Today" | "Yesterday" | "This week" | "Earlier";

/** Which bucket a transaction date falls into, for the Transactions list's date grouping. */
export function recencyBucket(date: Date, now = new Date()): RecencyBucket {
  const today = startOfDay(now);
  const target = startOfDay(date);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((today.getTime() - target.getTime()) / dayMs);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This week";
  return "Earlier";
}

/** "Today" / "Yesterday" / "3 days ago" / "Aug 12" — for a transaction row's meta line. */
export function relativeDayLabel(date: Date, now = new Date()): string {
  const today = startOfDay(now);
  const target = startOfDay(date);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((today.getTime() - target.getTime()) / dayMs);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
