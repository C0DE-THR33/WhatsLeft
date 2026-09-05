/**
 * Thin wrapper around Setu's Account Aggregator (FIU) sandbox APIs.
 * Docs: https://docs.setu.co/data/account-aggregator
 *
 * IMPORTANT: the request/response field names below follow the shape
 * described in Setu's docs, but have NOT been verified against a live
 * sandbox call yet (no sandbox credentials existed when this was written).
 * Before wiring this into a real consent flow, cross-check every field
 * name against Setu's Postman collection:
 * https://documenter.getpostman.com/view/16080598/TzzBoun5
 * and fix anything that doesn't match a real request/response.
 */

const SETU_BASE_URL = process.env.SETU_BASE_URL ?? "https://fiu-sandbox.setu.co";

function authHeaders(): HeadersInit {
  const clientId = process.env.SETU_CLIENT_ID;
  const clientSecret = process.env.SETU_CLIENT_SECRET;
  const productInstanceId = process.env.SETU_PRODUCT_INSTANCE_ID;

  if (!clientId || !clientSecret || !productInstanceId) {
    throw new Error(
      "Missing Setu credentials — set SETU_CLIENT_ID, SETU_CLIENT_SECRET, " +
        "SETU_PRODUCT_INSTANCE_ID (from bridge.setu.co) in .env"
    );
  }

  return {
    "Content-Type": "application/json",
    "x-client-id": clientId,
    "x-client-secret": clientSecret,
    "x-product-instance-id": productInstanceId,
  };
}

export interface CreateConsentParams {
  customerMobile: string;
  purposeText: string;
  fiTypes: string[]; // e.g. ["DEPOSIT"]
  dataRangeFrom: Date;
  dataRangeTo: Date;
}

export interface CreateConsentResult {
  id: string; // Setu's consent id — store as Consent.setuConsentId
  status: "PENDING";
  redirectUrl: string; // send the user here to approve
}

/** Step 1 of the consent flow: create a consent request, get a redirect URL. */
export async function createConsent(
  params: CreateConsentParams
): Promise<CreateConsentResult> {
  const res = await fetch(`${SETU_BASE_URL}/consents`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      consentDuration: { unit: "MONTH", value: 12 },
      vua: `${params.customerMobile}@onemoney`, // TODO: confirm identifier format
      dataRange: {
        from: params.dataRangeFrom.toISOString(),
        to: params.dataRangeTo.toISOString(),
      },
      context: [],
      purpose: { text: params.purposeText },
      fiTypes: params.fiTypes,
    }),
  });

  if (!res.ok) {
    throw new Error(`Setu createConsent failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export interface ConsentStatusResult {
  id: string;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "PAUSED" | "REVOKED" | "EXPIRED";
}

/** Poll fallback for when a consent webhook hasn't arrived yet. */
export async function getConsentStatus(
  consentId: string
): Promise<ConsentStatusResult> {
  const res = await fetch(`${SETU_BASE_URL}/consents/${consentId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Setu getConsentStatus failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/** Step 2: once a consent is ACTIVE, ask Setu to prepare FI data at the FIP. */
export async function createFiDataSession(consentId: string): Promise<{ sessionId: string }> {
  const res = await fetch(`${SETU_BASE_URL}/sessions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ consentId, format: "json" }),
  });

  if (!res.ok) {
    throw new Error(`Setu createFiDataSession failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * Step 3: fetch the decrypted FI data once the session's webhook (or a
 * poll of GET /sessions/:id) reports it's ready. Setu's docs describe this
 * response as already-decrypted — no client-side key exchange needed on
 * our end — but that has not been confirmed against a real sandbox
 * response yet. Verify before relying on it.
 */
export async function fetchFiData(sessionId: string): Promise<unknown> {
  const res = await fetch(`${SETU_BASE_URL}/sessions/${sessionId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Setu fetchFiData failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
