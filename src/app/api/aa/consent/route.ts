import { NextResponse } from "next/server";
import { getCurrentUserIdOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createConsentRequest,
  isValidMobileNumber,
  SetuApiError,
  SetuNotConfiguredError,
  toVua,
} from "@/lib/setu";

// Starts a Setu AA consent request for the signed-in user and hands back
// the URL of Setu's hosted approval screens. POST-only: this has a side
// effect (a consent record with Setu, and a row here), so it isn't a plain
// page load.

/**
 * How far back to ask for. Twelve months is what makes the first screen
 * worth looking at — analytics compares this month against last, and a
 * 30-day range would show a new user a single bar. The consent is raised
 * over exactly this range and every later data session must stay inside
 * it, so it is stored on the row rather than recomputed.
 */
const MONTHS_OF_HISTORY = 12;

export async function POST(request: Request) {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  let body: { mobileNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const mobileNumber = (body.mobileNumber ?? "").trim();
  if (!isValidMobileNumber(mobileNumber)) {
    return NextResponse.json(
      { error: "Enter the 10-digit mobile number registered with your bank." },
      { status: 400 },
    );
  }

  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - MONTHS_OF_HISTORY);

  const origin = new URL(request.url).origin;

  try {
    const consent = await createConsentRequest({
      vua: toVua(mobileNumber),
      // Setu appends ?success=&id=&errorcode=&errormsg= to this on the way
      // back; /connect-bank reads them and finalises the link.
      redirectUrl: `${origin}/connect-bank`,
      dataRange: { from, to },
      durationMonths: MONTHS_OF_HISTORY,
    });

    // Written before the user is redirected, not after they return: this
    // row is the only thing that maps Setu's consent id back to a user,
    // and the webhook can arrive before the browser does.
    await db.aaConsent.create({
      data: {
        id: consent.consentId,
        userId,
        vua: toVua(mobileNumber),
        dataRangeFrom: from,
        dataRangeTo: to,
      },
    });

    return NextResponse.json({ consentId: consent.consentId, url: consent.url });
  } catch (error) {
    if (error instanceof SetuNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof SetuApiError) {
      console.error(error.message);
      return NextResponse.json({ error: "Could not start bank connection" }, { status: 502 });
    }
    console.error("Setu consent request failed", error);
    return NextResponse.json({ error: "Could not start bank connection" }, { status: 502 });
  }
}
