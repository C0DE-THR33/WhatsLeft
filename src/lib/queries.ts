import { db } from "@/lib/db";
import { toNum } from "@/lib/utils";
import { asCategoryIcon, asCategoryColor, UNCATEGORIZED_LABEL } from "@/lib/categories";
import { computeDonutSegments, type DonutResult } from "@/lib/donut";
import { currentMonthKey, monthRange, type MonthKey } from "@/lib/dates";
import { TransactionDirection } from "@prisma/client";

// The entire query layer. One function per page's actual need, called
// directly from a Server Component — not a generic repository/DAO
// abstraction (CONVENTIONS.md #4). Shared logic between pages is a private
// helper below, not duplicated in each page's own function.

export interface CategoryBreakdownRow {
  categoryId: string | null;
  name: string;
  icon: ReturnType<typeof asCategoryIcon>;
  color: ReturnType<typeof asCategoryColor>;
  amount: number;
}

/**
 * This month's spend grouped by category, for one user — shared by
 * getHomeData and getAnalyticsData. Uncategorized spend gets its own row
 * (id `null`) rather than being dropped, so percentages always sum to 100%
 * (CONVENTIONS.md #4).
 */
async function getCategoryBreakdown(
  userId: string,
  range: { start: Date; end: Date },
): Promise<{ rows: CategoryBreakdownRow[]; donut: DonutResult; total: number }> {
  const grouped = await db.transaction.groupBy({
    by: ["categoryId"],
    where: {
      linkedAccount: { userId },
      direction: TransactionDirection.DEBIT,
      transactionDate: { gte: range.start, lt: range.end },
    },
    _sum: { amount: true },
  });

  const categoryIds = grouped.map((g) => g.categoryId).filter((id): id is string => id !== null);
  const categories = categoryIds.length
    ? await db.category.findMany({ where: { id: { in: categoryIds } } })
    : [];
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const rows: CategoryBreakdownRow[] = grouped.map((g) => {
    const amount = toNum(g._sum.amount);
    if (g.categoryId === null) {
      return { categoryId: null, name: UNCATEGORIZED_LABEL, icon: "other", color: "cat-other", amount };
    }
    const category = categoryById.get(g.categoryId);
    return {
      categoryId: g.categoryId,
      name: category?.name ?? UNCATEGORIZED_LABEL,
      icon: asCategoryIcon(category?.icon ?? "other"),
      color: asCategoryColor(category?.color ?? "cat-other"),
      amount,
    };
  });

  rows.sort((a, b) => b.amount - a.amount);

  const donut = computeDonutSegments(
    rows.map((r) => ({ id: r.categoryId ?? "uncategorized", value: r.amount })),
  );
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return { rows, donut, total };
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export interface HomeTransactionRow {
  id: string;
  amount: number;
  direction: TransactionDirection;
  description: string;
  merchantName: string | null;
  transactionDate: Date;
  category: { id: string; name: string; icon: string; color: string } | null;
}

export interface HomeData {
  totalSpentThisMonth: number;
  budgetTotal: number | null;
  budgetRemaining: number | null;
  breakdown: CategoryBreakdownRow[];
  donut: DonutResult;
  recentTransactions: HomeTransactionRow[];
  hasLinkedAccounts: boolean;
}

async function getRecentTransactions(userId: string, take: number): Promise<HomeTransactionRow[]> {
  const rows = await db.transaction.findMany({
    where: { linkedAccount: { userId } },
    include: { category: true },
    orderBy: { transactionDate: "desc" },
    take,
  });

  // Decimal never leaves the query layer — converted here, not in the page.
  return rows.map((row) => ({ ...row, amount: toNum(row.amount) }));
}

export async function getHomeData(userId: string): Promise<HomeData> {
  const key = currentMonthKey();
  const range = monthRange(key);

  const [breakdownResult, budget, recentTransactions, linkedAccountCount] = await Promise.all([
    getCategoryBreakdown(userId, range),
    db.monthlyBudget.findUnique({ where: { userId_year_month: { userId, year: key.year, month: key.month } } }),
    getRecentTransactions(userId, 8),
    db.linkedAccount.count({ where: { userId } }),
  ]);

  const budgetTotal = budget ? toNum(budget.totalAmount) : null;

  return {
    totalSpentThisMonth: breakdownResult.total,
    budgetTotal,
    budgetRemaining: budgetTotal === null ? null : budgetTotal - breakdownResult.total,
    breakdown: breakdownResult.rows,
    donut: breakdownResult.donut,
    recentTransactions,
    hasLinkedAccounts: linkedAccountCount > 0,
  };
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export interface BudgetCategoryRow {
  categoryId: string;
  name: string;
  icon: ReturnType<typeof asCategoryIcon>;
  color: ReturnType<typeof asCategoryColor>;
  budgeted: number;
  spent: number;
}

export interface BudgetData {
  monthKey: MonthKey;
  totalBudget: number | null;
  totalSpent: number;
  categories: BudgetCategoryRow[];
  allCategories: Awaited<ReturnType<typeof getCategoriesForUser>>;
}

export async function getCategoriesForUser(userId: string) {
  return db.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: { name: "asc" },
  });
}

export async function getBudgetData(userId: string, monthKey: MonthKey = currentMonthKey()): Promise<BudgetData> {
  const range = monthRange(monthKey);

  const [monthlyBudget, breakdownResult, allCategories] = await Promise.all([
    db.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year: monthKey.year, month: monthKey.month } },
      include: { categoryBudgets: { include: { category: true } } },
    }),
    getCategoryBreakdown(userId, range),
    getCategoriesForUser(userId),
  ]);

  const spentByCategory = new Map(breakdownResult.rows.map((r) => [r.categoryId, r.amount]));

  const categories: BudgetCategoryRow[] = (monthlyBudget?.categoryBudgets ?? []).map((cb) => ({
    categoryId: cb.categoryId,
    name: cb.category.name,
    icon: asCategoryIcon(cb.category.icon),
    color: asCategoryColor(cb.category.color),
    budgeted: toNum(cb.amount),
    spent: spentByCategory.get(cb.categoryId) ?? 0,
  }));

  return {
    monthKey,
    totalBudget: monthlyBudget ? toNum(monthlyBudget.totalAmount) : null,
    totalSpent: breakdownResult.total,
    categories,
    allCategories,
  };
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface MonthlyTrendPoint {
  monthKey: MonthKey;
  total: number;
}

export interface AnalyticsData {
  monthKey: MonthKey;
  breakdown: CategoryBreakdownRow[];
  donut: DonutResult;
  total: number;
  trend: MonthlyTrendPoint[];
}

export async function getAnalyticsData(userId: string, monthKey: MonthKey = currentMonthKey()): Promise<AnalyticsData> {
  const range = monthRange(monthKey);
  const breakdownResult = await getCategoryBreakdown(userId, range);

  // Trailing 6 months, oldest first, for the trend strip.
  const trendKeys: MonthKey[] = [];
  for (let i = 5; i >= 0; i--) {
    const zeroBased = monthKey.month - 1 - i;
    const year = monthKey.year + Math.floor(zeroBased / 12);
    const month = ((zeroBased % 12) + 12) % 12;
    trendKeys.push({ year, month: month + 1 });
  }

  const trend = await Promise.all(
    trendKeys.map(async (key) => {
      const { start, end } = monthRange(key);
      const result = await db.transaction.aggregate({
        where: {
          linkedAccount: { userId },
          direction: TransactionDirection.DEBIT,
          transactionDate: { gte: start, lt: end },
        },
        _sum: { amount: true },
      });
      return { monthKey: key, total: toNum(result._sum.amount) };
    }),
  );

  return {
    monthKey,
    breakdown: breakdownResult.rows,
    donut: breakdownResult.donut,
    total: breakdownResult.total,
    trend,
  };
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function getTransactionsData(userId: string): Promise<HomeTransactionRow[]> {
  const rows = await db.transaction.findMany({
    where: { linkedAccount: { userId } },
    include: { category: true },
    orderBy: { transactionDate: "desc" },
  });

  return rows.map((row) => ({ ...row, amount: toNum(row.amount) }));
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettingsData(userId: string) {
  const [user, linkedAccounts] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.linkedAccount.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return { user, linkedAccounts };
}

// ---------------------------------------------------------------------------
// Investments
// ---------------------------------------------------------------------------

export async function getInvestmentsData(userId: string) {
  const investments = await db.investment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const totalInvested = investments.reduce((sum, i) => sum + toNum(i.investedAmount), 0);
  const totalCurrent = investments.reduce((sum, i) => sum + toNum(i.currentValue), 0);

  return {
    investments: investments.map((i) => ({
      ...i,
      investedAmount: toNum(i.investedAmount),
      currentValue: toNum(i.currentValue),
    })),
    totalInvested,
    totalCurrent,
    totalGain: totalCurrent - totalInvested,
  };
}

// ---------------------------------------------------------------------------
// Bill scanner
// ---------------------------------------------------------------------------

export async function getBillScansData(userId: string) {
  const scans = await db.billScan.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return scans.map((scan) => ({ ...scan, amount: scan.amount === null ? null : toNum(scan.amount) }));
}
