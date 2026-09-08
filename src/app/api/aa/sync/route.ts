import { NextResponse } from "next/server";
import { getCurrentUserIdOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchDataSession, SetuNotConfiguredError } from "@/lib/setu";
import { TransactionDirection } from "@prisma/client";

// Pulls the latest statement data for one of the signed-in user's linked
// accounts and upserts it into `transactions`. `externalId` (the FIP's own
// transaction id) is what makes this idempotent — re-running a sync for
// data already stored just no-ops those rows, since [linkedAccountId,
// externalId] is a real (non-nullable) compound unique, so `upsert` is
// safe here unlike the Category default-row case (CONVENTIONS.md #6).
export async function POST(request: Request) {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  const { linkedAccountId, dataSessionId } = await request.json();
  if (!linkedAccountId || !dataSessionId) {
    return NextResponse.json({ error: "linkedAccountId and dataSessionId are required" }, { status: 400 });
  }

  // Ownership check, same shape as every mutating route: prove the
  // account being synced actually belongs to whoever is signed in
  // (CONVENTIONS.md #5).
  const linkedAccount = await db.linkedAccount.findFirst({
    where: { id: linkedAccountId, userId },
  });
  if (!linkedAccount) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const fetched = await fetchDataSession(dataSessionId);

    await db.$transaction(
      fetched.map((tx) =>
        db.transaction.upsert({
          where: { linkedAccountId_externalId: { linkedAccountId, externalId: tx.externalId } },
          update: {},
          create: {
            linkedAccountId,
            externalId: tx.externalId,
            amount: tx.amount,
            direction: tx.direction === "CREDIT" ? TransactionDirection.CREDIT : TransactionDirection.DEBIT,
            description: tx.description,
            mode: tx.mode,
            transactionDate: new Date(tx.transactionTimestamp),
          },
        }),
      ),
    );

    await db.linkedAccount.update({
      where: { id: linkedAccountId },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({ synced: fetched.length });
  } catch (error) {
    if (error instanceof SetuNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Setu sync failed", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 502 });
  }
}
