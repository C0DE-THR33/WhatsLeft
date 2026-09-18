import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUserIdOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateCashAccount } from "@/lib/cash";
import { buildIconCategoryMap, pickCategoryId } from "@/lib/auto-categorize";
import { CategorySource, TransactionDirection } from "@prisma/client";

// POST /api/transactions — records a cash transaction the user entered by
// hand. Bank rows arrive through api/aa/sync; this is the other way in.
//
// The category is resolved in the same order the rest of the app uses: an
// explicit pick wins, otherwise the merchant rules get a go
// (lib/categorize.ts), otherwise it stays honestly uncategorized. Typing
// "Auto rickshaw" and having it land in Transport without being asked is
// the whole point of having rules at all.
export async function POST(request: Request) {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, merchantName, categoryId, direction, transactionDate } = (body ?? {}) as {
    amount?: unknown;
    merchantName?: unknown;
    categoryId?: unknown;
    direction?: unknown;
    transactionDate?: unknown;
  };

  // Amount arrives as a string from a number input. Parse before trusting
  // it: NaN, Infinity and negatives all reach here otherwise, and a
  // negative DEBIT would quietly reduce the month's spend total.
  const parsedAmount = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }
  if (parsedAmount > 100_000_000) {
    return NextResponse.json({ error: "amount is implausibly large" }, { status: 400 });
  }

  const name = typeof merchantName === "string" ? merchantName.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "merchantName is required" }, { status: 400 });
  }
  if (name.length > 120) {
    return NextResponse.json({ error: "merchantName is too long" }, { status: 400 });
  }

  const dir =
    direction === "CREDIT" ? TransactionDirection.CREDIT : TransactionDirection.DEBIT;

  // An explicit date is optional; anything unparseable falls back to now
  // rather than writing an Invalid Date into the column.
  let occurredAt = new Date();
  if (typeof transactionDate === "string" && transactionDate) {
    const parsed = new Date(transactionDate);
    if (!Number.isNaN(parsed.getTime())) occurredAt = parsed;
  }

  // An explicitly chosen category still has to belong to this user (or be
  // a shipped default) — same check as the categorize route, for the same
  // reason (CONVENTIONS.md #5).
  let resolvedCategoryId: string | null = null;
  let source: CategorySource | null = null;

  if (typeof categoryId === "string" && categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, OR: [{ userId }, { userId: null }] },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    resolvedCategoryId = category.id;
    source = CategorySource.MANUAL;
  } else {
    const map = await buildIconCategoryMap(userId);
    resolvedCategoryId = pickCategoryId(map, { merchantName: name });
    source = resolvedCategoryId ? CategorySource.RULE : null;
  }

  const cashAccount = await getOrCreateCashAccount(userId);

  const created = await db.transaction.create({
    data: {
      linkedAccountId: cashAccount.id,
      // externalId is unique per account and exists to de-dupe FIP
      // re-syncs; a manual row has no upstream id, so it gets a generated
      // one rather than something guessable that could collide.
      externalId: `manual-${randomUUID()}`,
      amount: parsedAmount.toFixed(2),
      direction: dir,
      description: name,
      merchantName: name,
      mode: "CASH",
      transactionDate: occurredAt,
      categoryId: resolvedCategoryId,
      categorySource: source,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
