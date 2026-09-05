import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
  const { id } = await params;
  const { categoryId, note } = (await req.json()) as {
    categoryId: string;
    note?: string;
  };

  const transaction = await db.transaction.update({
    where: { id },
    data: {
      categoryId,
      categorySource: "MANUAL",
      note: note ?? undefined,
    },
  });

  return NextResponse.json(transaction);
}
