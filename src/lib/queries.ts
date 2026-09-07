import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { asCategoryIcon, type CategoryIcon } from "@/lib/categories";
import { addMonths, monthLabel, monthYearLabel, relativeDayLabel, startOfMonth } from "@/lib/dates";

function toNum(d: Prisma.Decimal | null | undefined): number {
  return d ? d.toNumber() : 0;
}

// ─────────────────────────────────────────────────────────────
// Shared: this month's spend broken down by category
// ─────────────────────────────────────────────────────────────

export interface CategorySpend {
  /** null = the synthetic "Uncategorized" bucket below, not a real Category row. */
  categoryId: string | null;
  icon: CategoryIcon | null;
  label: string;
  amount: number;
  pct: number;
}

async function getCategoryBreakdown(userId: string, monthStart: Date) {
  const monthEnd = addMonths(monthStart, 1);
  const txns = await db.transaction.findMany({
    where: {
      linkedAccount: { userId },
      type: "DEBIT",
      transactionDate: { gte: monthStart, lt: monthEnd },
    },
    include: { category: true },
  });

  const total = txns.reduce((sum, t) => sum + toNum(t.amount), 0);

  const byCategory = new Map<string, CategorySpend>();
  let uncategorized = 0;
  for (const t of txns) {
    if (!t.category) {
      // Tracked separately, not silently dropped: excluding this from the
      // breakdown would make every category's pct sum to less than 100%
      // (and hide exactly the spend the categorize flow exists to surface).
      uncategorized += toNum(t.amount);
      continue;
    }
    const existing = byCategory.get(t.category.id) ?? {
      categoryId: t.category.id,
      icon: asCategoryIcon(t.category.icon),
      label: t.category.name,
      amount: 0,
      pct: 0,
    };
    existing.amount += toNum(t.amount);
    byCategory.set(t.category.id, existing);
  }

  const breakdown = [...byCategory.values()].sort((a, b) => b.amount - a.amount);
  if (uncategorized > 0) {
    breakdown.push({ categoryId: null, icon: null, label: "Uncategorized", amount: uncategorized, pct: 0 });
  }

  return {
    total,
    breakdown: breakdown.map((c) => ({ ...c, pct: total > 0 ? Math.round((c.amount / total) * 100) : 0 })),
  };
}

// ─────────────────────────────────────────────────────────────
// Home dashboard
// ─────────────────────────────────────────────────────────────

export interface DashboardTransaction {
  id: string;
  merchant: string;
  icon: CategoryIcon | null;
  amount: number;
  type: "DEBIT" | "CREDIT";
  meta: string;
}

export interface DashboardData {
  totalBalance: number;
  linkedAccountCount: number;
  budgetAmount: number;
  spentThisMonth: number;
  categoryBreakdown: CategorySpend[];
  recentTransactions: DashboardTransaction[];
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const monthStart = startOfMonth(new Date());

  const [accounts, monthlyBudget, { total: spentThisMonth, breakdown }, recent] = await Promise.all([
    db.linkedAccount.findMany({ where: { userId, isActive: true } }),
    db.monthlyBudget.findUnique({
      where: { userId_periodMonth: { userId, periodMonth: monthStart } },
    }),
    getCategoryBreakdown(userId, monthStart),
    db.transaction.findMany({
      where: { linkedAccount: { userId } },
      include: { category: true, linkedAccount: true },
      orderBy: { transactionDate: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalBalance: accounts.reduce((sum, a) => sum + toNum(a.currentBalance), 0),
    linkedAccountCount: accounts.length,
    budgetAmount: toNum(monthlyBudget?.amount),
    spentThisMonth,
    categoryBreakdown: breakdown,
    recentTransactions: recent.map((t) => ({
      id: t.id,
      merchant: t.merchant ?? t.narration,
      icon: t.category ? asCategoryIcon(t.category.icon) : null,
      amount: toNum(t.amount),
      type: t.type,
      meta: `${t.category?.name ?? "Uncategorized"} · ${relativeDayLabel(t.transactionDate)} · ${t.linkedAccount.bankName} ${t.linkedAccount.maskedAccountNumber}`,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Transactions list
// ─────────────────────────────────────────────────────────────

export interface TransactionRow {
  id: string;
  merchant: string;
  categoryId: string | null;
  categoryLabel: string | null;
  icon: CategoryIcon | null;
  amount: number;
  type: "DEBIT" | "CREDIT";
  bank: string;
  transactionDate: string; // serialized for client components
}

export async function getTransactions(userId: string): Promise<TransactionRow[]> {
  const txns = await db.transaction.findMany({
    where: { linkedAccount: { userId } },
    include: { category: true, linkedAccount: true },
    orderBy: { transactionDate: "desc" },
    take: 100,
  });

  return txns.map((t) => ({
    id: t.id,
    merchant: t.merchant ?? t.narration,
    categoryId: t.categoryId,
    categoryLabel: t.category?.name ?? null,
    icon: t.category ? asCategoryIcon(t.category.icon) : null,
    amount: toNum(t.amount),
    type: t.type,
    bank: `${t.linkedAccount.bankName} ${t.linkedAccount.maskedAccountNumber}`,
    transactionDate: t.transactionDate.toISOString(),
  }));
}

export interface CategoryOption {
  id: string;
  icon: CategoryIcon;
  label: string;
}

/** Default categories plus this user's own, for the categorize sheet's grid. */
export async function getCategoryOptions(userId: string): Promise<CategoryOption[]> {
  const categories = await db.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: { name: "asc" },
  });
  return categories.map((c) => ({ id: c.id, icon: asCategoryIcon(c.icon), label: c.name }));
}

// ─────────────────────────────────────────────────────────────
// Budget
// ─────────────────────────────────────────────────────────────

export interface BudgetCategoryRow {
  categoryId: string;
  icon: CategoryIcon;
  label: string;
  spent: number;
  budget: number;
}

export interface BudgetData {
  monthlyBudgetAmount: number;
  totalSpent: number;
  categoryRows: BudgetCategoryRow[];
}

export async function getBudgetData(userId: string): Promise<BudgetData> {
  const monthStart = startOfMonth(new Date());

  const [monthlyBudget, categoryBudgets, { total: totalSpent, breakdown }] = await Promise.all([
    db.monthlyBudget.findUnique({
      where: { userId_periodMonth: { userId, periodMonth: monthStart } },
    }),
    db.categoryBudget.findMany({
      where: { userId, periodMonth: monthStart },
      include: { category: true },
    }),
    getCategoryBreakdown(userId, monthStart),
  ]);

  const spentByCategoryId = new Map(breakdown.map((c) => [c.categoryId, c.amount]));

  return {
    monthlyBudgetAmount: toNum(monthlyBudget?.amount),
    totalSpent,
    categoryRows: categoryBudgets.map((cb) => ({
      categoryId: cb.categoryId,
      icon: asCategoryIcon(cb.category.icon),
      label: cb.category.name,
      budget: toNum(cb.amount),
      spent: spentByCategoryId.get(cb.categoryId) ?? 0,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────

export interface TrendMonth {
  label: string;
  amount: number;
  current: boolean;
}

/** A CategorySpend that's guaranteed to be a real category, never the synthetic "Uncategorized" row. */
type RealCategorySpend = CategorySpend & { categoryId: string; icon: CategoryIcon };

export interface AnalyticsData {
  monthLabel: string;
  totalSpent: number;
  breakdown: CategorySpend[];
  highest: RealCategorySpend | null;
  /** % change vs. the same category last month — null if there's no prior-month figure to compare. */
  highestChangePct: number | null;
  trend: TrendMonth[];
}

export async function getAnalyticsData(userId: string, monthsBack = 6): Promise<AnalyticsData> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = addMonths(monthStart, -1);
  const trendStart = addMonths(monthStart, -(monthsBack - 1));

  const [{ total: totalSpent, breakdown }, prev, trendTxns] = await Promise.all([
    getCategoryBreakdown(userId, monthStart),
    getCategoryBreakdown(userId, prevMonthStart),
    db.transaction.findMany({
      where: { linkedAccount: { userId }, type: "DEBIT", transactionDate: { gte: trendStart } },
      select: { amount: true, transactionDate: true },
    }),
  ]);

  // Never "Uncategorized" — that's not an actionable insight the way a
  // real category is, and it's appended after sorting so it could
  // otherwise end up first when it's the only spend this month. The cast
  // is safe: categoryId and icon are always set together (or both null)
  // in getCategoryBreakdown, so filtering on one guarantees the other.
  const highest = (breakdown.find((c) => c.categoryId !== null) ?? null) as RealCategorySpend | null;
  const prevForHighest = highest ? prev.breakdown.find((c) => c.categoryId === highest.categoryId) : undefined;
  const highestChangePct =
    highest && prevForHighest && prevForHighest.amount > 0
      ? Math.round(((highest.amount - prevForHighest.amount) / prevForHighest.amount) * 100)
      : null;

  const trendBuckets = new Map<string, number>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = addMonths(monthStart, -i);
    trendBuckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const t of trendTxns) {
    const d = startOfMonth(t.transactionDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (trendBuckets.has(key)) {
      trendBuckets.set(key, (trendBuckets.get(key) ?? 0) + toNum(t.amount));
    }
  }
  const trend: TrendMonth[] = [...trendBuckets.entries()].map(([key, amount]) => {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m, 1);
    return {
      label: monthLabel(d),
      amount,
      current: y === monthStart.getFullYear() && m === monthStart.getMonth(),
    };
  });

  return { monthLabel: monthYearLabel(now), totalSpent, breakdown, highest, highestChangePct, trend };
}

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────

export interface LinkedAccountRow {
  id: string;
  bankName: string;
  maskedAccountNumber: string;
  isActive: boolean;
}

export async function getLinkedAccounts(userId: string): Promise<LinkedAccountRow[]> {
  const accounts = await db.linkedAccount.findMany({
    where: { userId },
    orderBy: { linkedAt: "asc" },
  });
  return accounts.map((a) => ({
    id: a.id,
    bankName: a.bankName,
    maskedAccountNumber: a.maskedAccountNumber,
    isActive: a.isActive,
  }));
}
