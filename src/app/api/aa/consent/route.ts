import { NextResponse } from "next/server";
import { getCurrentUserIdOrResponse } from "@/lib/auth";
import { createConsentRequest, SetuNotConfiguredError } from "@/lib/setu";

// Starts a Setu AA consent request for the signed-in user and hands back
// the redirect URL the browser should follow to complete it in the FIP's
// UI. POST-only: this has a side effect (creating a consent record with
// Setu), so it isn't a plain page load.
export async function POST(request: Request) {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  const origin = new URL(request.url).origin;

  try {
    const consent = await createConsentRequest(userId, `${origin}/connect-bank`);
    return NextResponse.json(consent);
  } catch (error) {
    if (error instanceof SetuNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Setu consent request failed", error);
    return NextResponse.json({ error: "Could not start bank connection" }, { status: 502 });
  }
}
