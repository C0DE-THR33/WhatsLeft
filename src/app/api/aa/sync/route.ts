import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createFiDataSession, fetchFiData } from "@/lib/setu";

/**
 * Triggers a fresh pull of transaction data for one consent. Called after
 * a consent's webhook reports ACTIVE, and can be re-run later for periodic
 * refreshes (v1 has no scheduler for that yet — manual/on-demand only).
 *
 * TODO: once fetchFiData()'s real response shape is confirmed against the
 * sandbox, parse it into Transaction rows here (dedupe on
 * [linkedAccountId, externalTxnId], see prisma/schema.prisma).
 */
export async function POST(req: NextRequest) {
  const { consentId } = (await req.json()) as { consentId: string };

  const consent = await db.consent.findUnique({ where: { id: consentId } });
  if (!consent || consent.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Consent not found or not active" },
      { status: 400 }
    );
  }

  const { sessionId } = await createFiDataSession(consent.setuConsentId);

  // In practice this returns before the FIP has responded — the real flow
  // waits for the FI_NOTIFICATION webhook (see api/aa/webhook) rather than
  // fetching immediately. Fetching straight away here is a placeholder
  // until that webhook-driven path is built.
  const fiData = await fetchFiData(sessionId);

  return NextResponse.json({ sessionId, fiData });
}
