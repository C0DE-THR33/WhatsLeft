import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Seeds a rich demo dataset — linked accounts, transactions, and a budget —
 * for ONE existing user, found by email. Deliberately separate from
 * seed.ts (which only seeds the shipped default categories and is safe to
 * run against any environment): this script is demo/dev data, and it
 * requires a real signed-in user to attach to, since Prisma's User rows
 * are only ever created by the /auth/callback route after a real
 * Supabase sign-in (see that route, and the User model's comment in
 * schema.prisma, for why).
 *
 * Every number here matches design/*.dc.html and the numbers used
 * throughout this project's case study: ₹1,42,318 total balance, ₹20,000
 * monthly budget, and this month's 5 categorized totals (Food 4750 /
 * Bills 4500 / Shopping 2400 / Transport 1200 / Entertainment 600 =
 * ₹13,450, exactly what the design canvas shows). Zomato (₹610) is left
 * uncategorized on purpose, to demo the categorize sheet — which also
 * means the "spent so far" figure on Home/Budget correctly reads ₹14,060
 * (13,450 categorized + that 610), not 13,450: total spend is supposed
 * to include uncategorized spend (see getCategoryBreakdown's comment in
 * lib/queries.ts), the static design mockup just didn't have an
 * uncategorized transaction to account for.
 *
 * Usage: npm run db:seed:demo -- you@example.com
 */
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:seed:demo -- you@example.com");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No User row for "${email}". Sign in at /login with this email first — ` +
        "the User row is created by src/app/auth/callback/route.ts on first sign-in."
    );
    process.exit(1);
  }

  const categories = await db.category.findMany({ where: { userId: null } });
  const byIcon = new Map(categories.map((c) => [c.icon, c]));
  const need = ["food", "transport", "shopping", "bills", "entertainment", "income"];
  const missing = need.filter((icon) => !byIcon.has(icon));
  if (missing.length > 0) {
    console.error(`Missing default categories: ${missing.join(", ")}. Run "npm run db:seed" first.`);
    process.exit(1);
  }
  const food = byIcon.get("food")!;
  const transport = byIcon.get("transport")!;
  const shopping = byIcon.get("shopping")!;
  const bills = byIcon.get("bills")!;
  const entertainment = byIcon.get("entertainment")!;
  const income = byIcon.get("income")!;

  // ---- Linked accounts (+ one Consent each — LinkedAccount requires one) ----
  const banks = [
    { fipId: "HDFC-FIP", bankName: "HDFC Bank", masked: "••1234", balance: 98000 },
    { fipId: "ICICI-FIP", bankName: "ICICI Bank", masked: "••5678", balance: 32000 },
    { fipId: "AXIS-FIP", bankName: "Axis Bank", masked: "••9012", balance: 12318 },
  ];
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const accounts: Record<string, string> = {}; // fipId -> LinkedAccount.id
  for (const bank of banks) {
    const consent = await db.consent.create({
      data: {
        userId: user.id,
        setuConsentId: `demo-consent-${bank.fipId}`,
        status: "ACTIVE",
        fiTypes: ["DEPOSIT"],
        purposeText: "Track transactions and spending in SpendWise",
        dataRangeFrom: oneYearAgo,
        dataRangeTo: now,
      },
    });
    const account = await db.linkedAccount.create({
      data: {
        userId: user.id,
        consentId: consent.id,
        fipId: bank.fipId,
        bankName: bank.bankName,
        maskedAccountNumber: bank.masked,
        accountType: "SAVINGS",
        currentBalance: bank.balance,
        lastSyncedAt: now,
      },
    });
    accounts[bank.fipId] = account.id;
  }

  // ---- This month's transactions — named + rounding entries so each
  // category lands exactly on the design's numbers ----
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };

  interface SeedTxn {
    id: string;
    account: string;
    merchant: string;
    narration: string;
    amount: number;
    type: "DEBIT" | "CREDIT";
    categoryId: string | null;
    date: Date;
  }

  const thisMonth: SeedTxn[] = [
    { id: "txn-swiggy", account: "HDFC-FIP", merchant: "Swiggy", narration: "UPI-SWIGGY-450-TODAY", amount: 450, type: "DEBIT", categoryId: food.id, date: daysAgo(0) },
    { id: "txn-grocery", account: "HDFC-FIP", merchant: "Grocery Store", narration: "POS-BIGBASKET-4300", amount: 4300, type: "DEBIT", categoryId: food.id, date: daysAgo(3) },
    { id: "txn-uber", account: "ICICI-FIP", merchant: "Uber", narration: "UPI-UBER-180-TODAY", amount: 180, type: "DEBIT", categoryId: transport.id, date: daysAgo(0) },
    { id: "txn-metro", account: "ICICI-FIP", merchant: "Metro Card Recharge", narration: "UPI-DMRC-1020", amount: 1020, type: "DEBIT", categoryId: transport.id, date: daysAgo(4) },
    { id: "txn-zomato", account: "ICICI-FIP", merchant: "Zomato", narration: "UPI-ZOMATO-610-TODAY", amount: 610, type: "DEBIT", categoryId: null, date: daysAgo(0) },
    { id: "txn-amazon", account: "HDFC-FIP", merchant: "Amazon", narration: "POS-AMAZON-1299", amount: 1299, type: "DEBIT", categoryId: shopping.id, date: daysAgo(1) },
    { id: "txn-myntra", account: "HDFC-FIP", merchant: "Myntra", narration: "POS-MYNTRA-1101", amount: 1101, type: "DEBIT", categoryId: shopping.id, date: daysAgo(5) },
    { id: "txn-electricity", account: "ICICI-FIP", merchant: "Electricity Bill", narration: "AUTOPAY-BESCOM-1850", amount: 1850, type: "DEBIT", categoryId: bills.id, date: daysAgo(1) },
    { id: "txn-broadband", account: "ICICI-FIP", merchant: "Broadband Bill", narration: "AUTOPAY-ACT-2650", amount: 2650, type: "DEBIT", categoryId: bills.id, date: daysAgo(6) },
    { id: "txn-netflix", account: "HDFC-FIP", merchant: "Netflix", narration: "UPI-NETFLIX-499", amount: 499, type: "DEBIT", categoryId: entertainment.id, date: daysAgo(2) },
    { id: "txn-spotify", account: "HDFC-FIP", merchant: "Spotify", narration: "UPI-SPOTIFY-101", amount: 101, type: "DEBIT", categoryId: entertainment.id, date: daysAgo(7) },
    { id: "txn-salary", account: "HDFC-FIP", merchant: "Salary credit", narration: "NEFT-SALARY-CREDIT-45000", amount: 45000, type: "CREDIT", categoryId: income.id, date: daysAgo(2) },
  ];

  // ---- Prior months — one lump transaction each, sized to match the
  // trend bars in design/Analytics.dc.html. August is split so the
  // "highest category" +18%-vs-last-month insight comes out to the same
  // figure as the design (Food: 4025 -> 4750 this month).
  const monthsAgo = (n: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() - n, 5);
    return d;
  };
  const priorMonths: SeedTxn[] = [
    { id: "txn-apr-lump", account: "HDFC-FIP", merchant: "April spending", narration: "MISC-APR", amount: 15200, type: "DEBIT", categoryId: bills.id, date: monthsAgo(5) },
    { id: "txn-may-lump", account: "HDFC-FIP", merchant: "May spending", narration: "MISC-MAY", amount: 16800, type: "DEBIT", categoryId: bills.id, date: monthsAgo(4) },
    { id: "txn-jun-lump", account: "HDFC-FIP", merchant: "June spending", narration: "MISC-JUN", amount: 14100, type: "DEBIT", categoryId: bills.id, date: monthsAgo(3) },
    { id: "txn-jul-lump", account: "HDFC-FIP", merchant: "July spending", narration: "MISC-JUL", amount: 17300, type: "DEBIT", categoryId: bills.id, date: monthsAgo(2) },
    { id: "txn-aug-food", account: "HDFC-FIP", merchant: "August groceries", narration: "MISC-AUG-FOOD", amount: 4025, type: "DEBIT", categoryId: food.id, date: monthsAgo(1) },
    { id: "txn-aug-transport", account: "ICICI-FIP", merchant: "August transport", narration: "MISC-AUG-TRANSPORT", amount: 2053, type: "DEBIT", categoryId: transport.id, date: monthsAgo(1) },
    { id: "txn-aug-shopping", account: "HDFC-FIP", merchant: "August shopping", narration: "MISC-AUG-SHOPPING", amount: 4105, type: "DEBIT", categoryId: shopping.id, date: monthsAgo(1) },
    { id: "txn-aug-bills", account: "ICICI-FIP", merchant: "August bills", narration: "MISC-AUG-BILLS", amount: 7690, type: "DEBIT", categoryId: bills.id, date: monthsAgo(1) },
    { id: "txn-aug-entertainment", account: "HDFC-FIP", merchant: "August entertainment", narration: "MISC-AUG-FUN", amount: 1027, type: "DEBIT", categoryId: entertainment.id, date: monthsAgo(1) },
  ];

  for (const t of [...thisMonth, ...priorMonths]) {
    await db.transaction.upsert({
      where: { linkedAccountId_externalTxnId: { linkedAccountId: accounts[t.account], externalTxnId: t.id } },
      update: {},
      create: {
        linkedAccountId: accounts[t.account],
        externalTxnId: t.id,
        amount: t.amount,
        type: t.type,
        narration: t.narration,
        merchant: t.merchant,
        categoryId: t.categoryId,
        categorySource: t.categoryId ? "AUTO" : "UNCATEGORIZED",
        transactionDate: t.date,
      },
    });
  }

  // ---- Budget — matches design/Budget.dc.html exactly ----
  const periodMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  await db.monthlyBudget.upsert({
    where: { userId_periodMonth: { userId: user.id, periodMonth } },
    update: { amount: 20000 },
    create: { userId: user.id, periodMonth, amount: 20000 },
  });

  const categoryBudgets = [
    { category: food, amount: 6000 },
    { category: transport, amount: 3000 },
    { category: shopping, amount: 4000 },
    { category: bills, amount: 5000 },
    { category: entertainment, amount: 2000 },
  ];
  for (const cb of categoryBudgets) {
    await db.categoryBudget.upsert({
      where: {
        userId_categoryId_periodMonth: { userId: user.id, categoryId: cb.category.id, periodMonth },
      },
      update: { amount: cb.amount },
      create: { userId: user.id, categoryId: cb.category.id, periodMonth, amount: cb.amount },
    });
  }

  console.log(`Seeded demo data for ${email}: 3 linked accounts, ${thisMonth.length + priorMonths.length} transactions, 1 monthly budget + ${categoryBudgets.length} category budgets.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
