import { NextResponse } from "next/server";
import { getCurrentUserIdOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { ingestDataSession, startDataSession } from "@/lib/aa-ingest";
import { SetuApiError, SetuNotConfiguredError } from "@/lib/setu";

// Pulls a data session's statement lines into `transactions`.
//
// Takes a consentId, not a bare linkedAccountId: FI data arrives per FIP
// per account in one payload covering every account under the consent, so
// the account a row belongs to is decided by its linkRefNumber during
// ingest rather than by the caller. The consent is also what anchors the
// ownership check — a data session id on its own says nothing about who it
// belongs to.
export async function POST(request: Request) {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  let body: { consentId?: string; dataSessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const consentId = (body.consentId ?? "").trim();
  if (!consentId) {
    return NextResponse.json({ error: "consentId is required" }, { status: 400 });
  }

  const stored = await db.aaConsent.findFirst({ where: { id: consentId, userId } });
  if (!stored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // No session id means "fetch me the latest" — the normal shape of a
    // pull-to-refresh, as opposed to the connect flow which already has a
    // session id from /api/aa/link.
    const dataSessionId =
      (body.dataSessionId ?? "").trim() || (await startDataSession(consentId))?.dataSessionId;

    if (!dataSessionId) {
      return NextResponse.json(
        { error: "This consent is not active, so there is nothing to sync." },
        { status: 409 },
      );
    }

    const result = await ingestDataSession({ userId, dataSessionId });

    // PENDING is not an error: the FIPs have not delivered yet, and the
    // caller should poll again rather than treat an empty sync as "your
    // bank has no transactions".
    return NextResponse.json({
      status: result.status,
      synced: result.synced,
      dataSessionId,
    });
  } catch (error) {
    if (error instanceof SetuNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof SetuApiError) {
      console.error(error.message);
      return NextResponse.json({ error: "Sync failed" }, { status: 502 });
    }
    console.error("Setu sync failed", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 502 });
  }
}
