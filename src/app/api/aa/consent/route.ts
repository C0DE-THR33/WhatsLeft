import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { createConsent } from "@/lib/setu";

/**
 * Step 1 of the Bank Connect flow (design/BankConnect.dc.html): create a
 * consent request with Setu and hand the client back a redirect URL to
 * Setu's hosted consent screen.
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  const { fipId } = (await req.json()) as { fipId: string };

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  // TODO: look up the user's mobile number (needed by Setu's consent
  // request) once auth is wired up.
  const result = await createConsent({
    customerMobile: "",
    purposeText: "Track transactions and spending in SpendWise",
    fiTypes: ["DEPOSIT"],
    dataRangeFrom: oneYearAgo,
    dataRangeTo: now,
  });

  await db.consent.create({
    data: {
      userId,
      setuConsentId: result.id,
      status: "PENDING",
      fiTypes: ["DEPOSIT"],
      purposeText: "Track transactions and spending in SpendWise",
      dataRangeFrom: oneYearAgo,
      dataRangeTo: now,
    },
  });

  return NextResponse.json({ redirectUrl: result.redirectUrl, fipId });
}
