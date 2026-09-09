import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestDataSession, linkConsentAccounts } from "@/lib/aa-ingest";
import { isSetuConfigured, isWebhookSecretConfigured, verifyWebhookSignature } from "@/lib/setu";

// Called by Setu's servers, not a signed-in browser — this is the one route
// on the public allowlist in src/proxy.ts. It has no session cookie to fall
// back on, so it trusts nothing in the body except the two ids, and even
// those only as a lookup key:
//
//   - who the consent belongs to comes from the AaConsent row, never from
//     the payload's `context`;
//   - what the consent's status now is, and what data a session holds, come
//     from reading Setu's API back with our own credentials.
//
// That is what makes an unauthenticated notification safe to act on. A
// forged POST can at worst make the server re-read a consent it already
// owns; it cannot assert a status, invent an account, or file a
// transaction. The signature check below is defence in depth on top of
// that, not the thing holding the door shut — which matters because Setu
// documents the notification payloads but not a signing scheme, so the
// secret only exists if the Bridge notification endpoint was configured
// with one.
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (isWebhookSecretConfigured()) {
    const signature = request.headers.get("x-setu-signature") ?? "";
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: { type?: string; consentId?: string; dataSessionId?: string };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  // Without credentials there is no way to verify any claim in this
  // payload, and acting on it unverified is exactly what this route
  // refuses to do. 503 (not 200) so the sender retries once the app is
  // actually configured.
  if (!isSetuConfigured()) {
    return NextResponse.json({ error: "Setu is not configured" }, { status: 503 });
  }

  try {
    switch (event.type) {
      case "CONSENT_STATUS_UPDATE": {
        if (!event.consentId) break;
        // Re-reads the consent from Setu and reconciles it, including
        // creating LinkedAccount rows on approval — so a user who closes
        // the tab before Setu redirects them back still ends up linked.
        await linkConsentAccounts(event.consentId);
        break;
      }

      case "SESSION_STATUS_UPDATE": {
        if (!event.dataSessionId || !event.consentId) break;
        const consent = await db.aaConsent.findUnique({
          where: { id: event.consentId },
          select: { userId: true },
        });
        // An unknown consent id is not an error worth retrying: it is a
        // notification for a consent this app never raised.
        if (!consent) break;
        await ingestDataSession({ userId: consent.userId, dataSessionId: event.dataSessionId });
        break;
      }

      default:
        console.warn(`Unhandled Setu webhook event type: ${event.type}`);
    }
  } catch (error) {
    // 500 on purpose: Setu retries a failed notification, and a transient
    // FIP or database error should not silently cost the user a statement.
    console.error("Setu webhook processing failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
