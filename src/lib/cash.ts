// The synthetic Cash account that manual entries hang off.
//
// Why this exists rather than a nullable Transaction.linkedAccountId: that
// column is the ONLY path from a transaction to its owner
// (`linkedAccount.userId`), and every ownership guard in the app is
// written against it (CONVENTIONS.md #5). Making it nullable would leave
// manual rows unreachable by those guards and force a second, parallel
// owner check in every route — two ways to answer "is this yours" is
// exactly how the original missing-ownership bug happened. One synthetic
// account per user keeps the invariant intact and costs one row.

import { AccountType, ConsentStatus } from "@prisma/client";
import { db } from "./db";

export const CASH_FIP_ID = "MANUAL-CASH";

/**
 * Returns the user's cash account, creating it on first use.
 *
 * findFirst + create rather than upsert: there is no unique constraint on
 * (userId, fipId), and adding a nullable-column compound unique to back an
 * upsert is the exact trap #6 warns about. The race here is one user
 * double-tapping "add" and ending up with two cash accounts — cosmetically
 * untidy, harmless to correctness, and preferable to a schema change that
 * would not actually fire ON CONFLICT.
 */
export async function getOrCreateCashAccount(userId: string) {
  const existing = await db.linkedAccount.findFirst({
    where: { userId, accountType: AccountType.CASH },
  });

  // Re-check the type instead of trusting the filter. Prisma treats an
  // `undefined` value in a where clause as "no condition", so if
  // AccountType.CASH is ever undefined at runtime this query silently
  // becomes "any account of this user" and hands back a real bank — which
  // is exactly what happened once: a dev server holding a Prisma client
  // generated before CASH existed attached a cash entry to a savings
  // account, with no error anywhere. Cheap insurance against a whole class
  // of stale-enum bug.
  if (existing?.accountType === AccountType.CASH) return existing;

  return db.linkedAccount.create({
    data: {
      userId,
      fipId: CASH_FIP_ID,
      fipName: "Cash",
      maskedAccountNumber: "—",
      accountType: AccountType.CASH,
      // Not backed by an AA consent at all; NOT_APPLICABLE says so rather
      // than claiming a live consent that was never granted.
      consentId: CASH_FIP_ID,
      consentStatus: ConsentStatus.NOT_APPLICABLE,
    },
  });
}
