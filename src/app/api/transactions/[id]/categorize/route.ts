import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

/**
 * Backs the categorize sheet (design/TransactionAlert.dc.html): confirm or
 * override a transaction's category, and optionally attach a note.
 * categorySource becomes MANUAL whenever a human picked the category here —
 * even if they just confirmed the AUTO suggestion — so re-categorization
 * events could be tracked separately from first-pass auto-detection later.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const { categoryId, note } = (await req.json()) as {
    categoryId: string;
    note?: string;
  };

  // updateMany (not update) + a userId ownership filter: this is the only
  // check standing between one user and another user's transactions, since
  // Transaction doesn't carry userId directly (only via linkedAccount) and
  // Prisma's `update` has no built-in way to fail on a non-owned row.
  const result = await db.transaction.updateMany({
    where: { id, linkedAccount: { userId } },
    data: {
      categoryId,
      categorySource: "MANUAL",
      note: note ?? undefined,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const transaction = await db.transaction.findUnique({ where: { id } });
  return NextResponse.json(transaction);
}
