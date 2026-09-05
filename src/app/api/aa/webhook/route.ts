import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Setu POSTs both consent-status and FI-data-session notifications to this
 * one endpoint (configured as the AA product's notification URL on
 * bridge.setu.co). We store the raw payload first, unconditionally — that's
 * what makes this idempotent and debuggable (see the WebhookEvent model's
 * schema comment) — and only interpret it after it's safely persisted.
 *
 * TODO: verify the actual discriminator field(s) Setu sends against a real
 * sandbox payload — docs.setu.co describes the two notification shapes in
 * prose, but this hasn't been checked against a live delivery yet. Once
 * confirmed, add the actual processing step here (update Consent /
 * LinkedAccount / Transaction rows from the event).
 */
export async function POST(req: NextRequest) {
  const payload = await req.json();

  const isFiNotification = "sessionId" in payload || "session" in payload;
  const eventType = isFiNotification ? "FI_NOTIFICATION" : "CONSENT_STATUS";
  const setuReferenceId: string | undefined =
    payload.sessionId ?? payload.consentId ?? payload.id;

  if (!setuReferenceId) {
    // Can't dedupe or route a payload with no reference id — log it and
    // still 200, so Setu doesn't treat this as a failed delivery and retry.
    console.error("AA webhook payload had no recognizable reference id", payload);
    return NextResponse.json({ ok: true });
  }

  await db.webhookEvent.create({
    data: { eventType, setuReferenceId, payload },
  });

  return NextResponse.json({ ok: true });
}
