// Rich demo data for ONE named user — explicitly separate from seed.ts's
// shipped defaults, and NOT safe to run blindly (CONVENTIONS.md #6). Takes
// an identifying argument (the user's email) and fails loudly if that
// precondition — a real signed-in user already exists — isn't met, rather
// than silently creating an orphaned demo user of its own.
//
// Usage:
//   npx tsx prisma/seed-demo.ts you@example.com

import { PrismaClient, AccountType, ConsentStatus, TransactionDirection, InvestmentType } from "@prisma/client";
import { currentMonthKey, shiftMonth, monthRange } from "../src/lib/dates";

const db = new PrismaClient();

const MERCHANTS: Record<string, string[]> = {
  "Food & Dining": ["Zomato", "Swiggy", "Starbucks", "Local Diner"],
  "Transport": ["Uber", "Ola", "IRCTC", "Metro Card Recharge"],
  "Shopping": ["Amazon", "Myntra", "Flipkart", "Decathlon"],
  "Bills & Utilities": ["Airtel Postpaid", "Tata Power", "Jio Fiber", "LIC Premium"],
  "Entertainment": ["Netflix", "BookMyShow", "Spotify", "PVR Cinemas"],
};

function randomAmount(min: number, max: number): string {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randomDateInMonth(year: number, month: number): Date {
  const { start, end } = monthRange({ year, month });
  const ms = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(ms);
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error("Usage: npx tsx prisma/seed-demo.ts <user-email>");
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(
      `No user with email "${email}" found. Sign in through the app once first — ` +
        `this script seeds demo data for an existing user, it doesn't create one.`,
    );
  }

  const categories = await db.category.findMany({ where: { userId: null } });
  if (categories.length === 0) {
    throw new Error(`No default categories found. Run "npm run db:seed" first.`);
  }
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  const linkedAccount = await db.linkedAccount.create({
    data: {
      userId: user.id,
      fipId: "DEMO-FIP",
      fipName: "Demo Bank",
      maskedAccountNumber: "XXXXXXXX4321",
      accountType: AccountType.SAVINGS,
      consentId: "demo-consent-1",
      consentStatus: ConsentStatus.ACTIVE,
      consentExpiresAt: shiftMonthDate(12),
      lastSyncedAt: new Date(),
    },
  });
  console.log(`Created linked account for ${email}.`);

  const thisMonth = currentMonthKey();
  let created = 0;

  for (let monthsAgo = 0; monthsAgo < 3; monthsAgo++) {
    const key = shiftMonth(thisMonth, -monthsAgo);
    const transactionCount = monthsAgo === 0 ? 14 : 22;

    for (let i = 0; i < transactionCount; i++) {
      const categoryNames = Object.keys(MERCHANTS);
      const categoryName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
      const merchants = MERCHANTS[categoryName];
      const merchantName = merchants[Math.floor(Math.random() * merchants.length)];
      const category = categoryByName.get(categoryName);

      // ~10% left deliberately uncategorized, so the "uncategorized" row
      // in the breakdown has something real to show (CONVENTIONS.md #4).
      const leaveUncategorized = Math.random() < 0.1;

      await db.transaction.create({
        data: {
          linkedAccountId: linkedAccount.id,
          externalId: `demo-${key.year}-${key.month}-${i}`,
          amount: randomAmount(150, 4500),
          direction: TransactionDirection.DEBIT,
          description: `${merchantName} purchase`,
          merchantName,
          mode: "UPI",
          transactionDate: randomDateInMonth(key.year, key.month),
          categoryId: leaveUncategorized ? null : category?.id,
        },
      });
      created++;
    }
  }
  console.log(`Created ${created} demo transactions across 3 months.`);

  const monthlyBudget = await db.monthlyBudget.upsert({
    where: { userId_year_month: { userId: user.id, year: thisMonth.year, month: thisMonth.month } },
    update: { totalAmount: "35000.00" },
    create: { userId: user.id, year: thisMonth.year, month: thisMonth.month, totalAmount: "35000.00" },
  });

  const categoryBudgetAmounts: Record<string, string> = {
    "Food & Dining": "8000.00",
    "Transport": "4000.00",
    "Shopping": "6000.00",
    "Bills & Utilities": "5000.00",
    "Entertainment": "2500.00",
  };

  for (const [name, amount] of Object.entries(categoryBudgetAmounts)) {
    const category = categoryByName.get(name);
    if (!category) continue;
    await db.categoryBudget.upsert({
      where: { monthlyBudgetId_categoryId: { monthlyBudgetId: monthlyBudget.id, categoryId: category.id } },
      update: { amount },
      create: { monthlyBudgetId: monthlyBudget.id, categoryId: category.id, amount },
    });
  }
  console.log(`Created budget for ${email} with ${Object.keys(categoryBudgetAmounts).length} category budgets.`);

  await db.investment.createMany({
    data: [
      { userId: user.id, name: "Nifty 50 Index Fund", type: InvestmentType.MUTUAL_FUND, investedAmount: "50000.00", currentValue: "58400.00" },
      { userId: user.id, name: "HDFC Bank", type: InvestmentType.STOCK, investedAmount: "20000.00", currentValue: "18650.00" },
      { userId: user.id, name: "SBI Fixed Deposit", type: InvestmentType.FIXED_DEPOSIT, investedAmount: "100000.00", currentValue: "106200.00" },
    ],
  });
  console.log(`Created 3 demo investments.`);
}

function shiftMonthDate(monthsFromNow: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsFromNow, now.getUTCDate()));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
