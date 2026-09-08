import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/setu";
import { ConsentStatus } from "@prisma/client";

// Called by Setu's servers, not a signed-in browser — this is the one
// route on the public allowlist in src/proxy.ts. Trust nothing here
// without the signature check: this endpoint has no session cookie to
// fall back on.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-setu-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  switch (event.type) {
    case "CONSENT_STATUS_UPDATE": {
      const status = mapConsentStatus(event.status);
      if (status) {
        await db.linkedAccount.updateMany({
          where: { consentId: event.consentId },
          data: { consentStatus: status },
        });
      }
      break;
    }
    case "DATA_READY":
      // A real implementation would enqueue a call to
      // fetchDataSession()/the /api/aa/sync route here rather than doing
      // the fetch inline in the webhook handler — left as a TODO since
      // there's no sandbox account wired up to exercise it against.
      break;
    default:
      console.warn(`Unhandled Setu webhook event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

function mapConsentStatus(status: string): ConsentStatus | null {
  switch (status) {
    case "ACTIVE":
      return ConsentStatus.ACTIVE;
    case "PAUSED":
      return ConsentStatus.PAUSED;
    case "REVOKED":
      return ConsentStatus.REVOKED;
    case "EXPIRED":
      return ConsentStatus.EXPIRED;
    default:
      return null;
  }
}
