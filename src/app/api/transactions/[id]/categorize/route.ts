import { NextResponse } from "next/server";
import { getCurrentUserIdOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategorySource } from "@prisma/client";

// PATCH /api/transactions/:id/categorize — sets a transaction's category
// (or clears it back to uncategorized with categoryId: null).
//
// getCurrentUserId() only proves *someone* is signed in, not that this
// transaction is theirs (CONVENTIONS.md #5). A Transaction has no direct
// userId — ownership only exists via linkedAccount.userId — so the guard
// has to be `updateMany({ where: { id, linkedAccount: { userId } } })`,
// checking `result.count === 0` for "not found or not yours." The first
// version of this exact route shipped with a bare `update({ where: { id } })`
// instead, which let any signed-in user recategorize anyone's transaction.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  const { id } = await params;
  const { categoryId } = await request.json();

  if (categoryId !== null && typeof categoryId !== "string") {
    return NextResponse.json({ error: "categoryId must be a string or null" }, { status: 400 });
  }

  if (categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, OR: [{ userId }, { userId: null }] },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
  }

  const result = await db.transaction.updateMany({
    where: { id, linkedAccount: { userId } },
    data: {
      categoryId,
      // MANUAL even when clearing. "Mark as uncategorized" is a decision,
      // and recording it is what stops the automatic pass in
      // lib/auto-categorize.ts from re-filing the row on its next run —
      // with a null source here, a deliberate clear is indistinguishable
      // from "never categorized" and gets silently overridden.
      categorySource: CategorySource.MANUAL,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
