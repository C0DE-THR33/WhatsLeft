import { NextResponse } from "next/server";
import { getCurrentUserIdOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkConsentAccounts, startDataSession } from "@/lib/aa-ingest";
import { SetuApiError, SetuNotConfiguredError } from "@/lib/setu";
import { ConsentStatus } from "@prisma/client";

// Finalises a consent the user has just approved on Setu's screens: reads
// the consent back from Setu, turns the accounts they picked into
// LinkedAccount rows, and kicks off the first data fetch.
//
// Called by /connect-bank when the browser returns with ?success=true&id=…
// The webhook path reaches the same two functions, so whichever arrives
// first does the work and the other is a cheap no-op.
export async function POST(request: Request) {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  let body: { consentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const consentId = (body.consentId ?? "").trim();
  if (!consentId) {
    return NextResponse.json({ error: "consentId is required" }, { status: 400 });
  }

  // Ownership check, same shape as every mutating route: being signed in
  // proves who you are, not that this consent is yours (CONVENTIONS.md #5).
  // A consent id is a bare uuid arriving in a query string, so this matters
  // more here than usual.
  const stored = await db.aaConsent.findFirst({ where: { id: consentId, userId } });
  if (!stored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const linked = await linkConsentAccounts(consentId);
    if (!linked) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (linked.status !== ConsentStatus.ACTIVE) {
      return NextResponse.json({ status: linked.status, accounts: 0, dataSessionId: null });
    }

    const session = await startDataSession(consentId);

    return NextResponse.json({
      status: linked.status,
      accounts: linked.linkedAccountIds.length,
      dataSessionId: session?.dataSessionId ?? null,
    });
  } catch (error) {
    if (error instanceof SetuNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof SetuApiError) {
      console.error(error.message);
      return NextResponse.json({ error: "Could not finish linking your bank" }, { status: 502 });
    }
    console.error("Setu consent link failed", error);
    return NextResponse.json({ error: "Could not finish linking your bank" }, { status: 502 });
  }
}
