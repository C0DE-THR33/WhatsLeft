// Thin client for Setu's Account Aggregator sandbox
// (https://docs.setu.co/data/account-aggregator). Every call needs a live
// sandbox client id/secret, which this repo doesn't ship — see
// .env.example. Mirrors the Supabase pattern (CONVENTIONS.md #5): missing
// config throws SetuNotConfiguredError, caught by callers to degrade
// gracefully instead of 500ing the connect-bank flow.

export class SetuNotConfiguredError extends Error {
  constructor() {
    super(
      "Setu AA is not configured: set SETU_CLIENT_ID, SETU_CLIENT_SECRET " +
        "and SETU_PRODUCT_INSTANCE_ID (see .env.example).",
    );
    this.name = "SetuNotConfiguredError";
  }
}

function isSetuConfigured(): boolean {
  return Boolean(
    process.env.SETU_CLIENT_ID &&
      process.env.SETU_CLIENT_SECRET &&
      process.env.SETU_PRODUCT_INSTANCE_ID,
  );
}

const SANDBOX_BASE_URL = "https://fiu-sandbox.setu.co";

function authHeaders(): Record<string, string> {
  if (!isSetuConfigured()) {
    throw new SetuNotConfiguredError();
  }
  return {
    "Content-Type": "application/json",
    "x-client-id": process.env.SETU_CLIENT_ID!,
    "x-client-secret": process.env.SETU_CLIENT_SECRET!,
    "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID!,
  };
}

export interface ConsentRequestResult {
  consentId: string;
  consentHandle: string;
  redirectUrl: string;
}

/** Starts a consent request for a user to link one or more bank accounts. */
export async function createConsentRequest(
  userId: string,
  redirectUrl: string,
): Promise<ConsentRequestResult> {
  const response = await fetch(`${SANDBOX_BASE_URL}/consents`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      consentDuration: { unit: "MONTH", value: "12" },
      context: [{ key: "userId", value: userId }],
      redirectUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Setu consent request failed: ${response.status}`);
  }

  return response.json();
}

export type SetuConsentStatus = "PENDING" | "ACTIVE" | "PAUSED" | "REVOKED" | "EXPIRED";

export async function getConsentStatus(consentId: string): Promise<SetuConsentStatus> {
  const response = await fetch(`${SANDBOX_BASE_URL}/consents/${consentId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Setu consent status check failed: ${response.status}`);
  }

  const data = await response.json();
  return data.status as SetuConsentStatus;
}

export interface SetuFetchedTransaction {
  externalId: string;
  amount: string;
  direction: "DEBIT" | "CREDIT";
  description: string;
  mode: string;
  transactionTimestamp: string;
}

/** Pulls newly available statement data for an active consent's data session. */
export async function fetchDataSession(
  dataSessionId: string,
): Promise<SetuFetchedTransaction[]> {
  const response = await fetch(
    `${SANDBOX_BASE_URL}/sessions/${dataSessionId}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(`Setu data session fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return data.transactions ?? [];
}

/**
 * Setu signs webhook payloads; the route handler at
 * src/app/api/aa/webhook/route.ts must verify this before trusting the
 * body. Sandbox docs specify an HMAC-SHA256 over the raw body using the
 * client secret — implement against the current docs before going live,
 * this is a placeholder shape.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!isSetuConfigured()) {
    throw new SetuNotConfiguredError();
  }

  // NOTE: wire up the real HMAC comparison against Setu's current webhook
  // docs before this handles live traffic — left unimplemented here since
  // there's no sandbox secret to verify it against yet.
  void rawBody;
  void signature;
  return false;
}
