// Exercises the Setu AA sandbox end to end from the terminal, without the
// app, a database row, or a signed-in browser.
//
// Why this exists: every shape in lib/setu.ts is written from Setu's docs,
// and the docs do not show an expanded consent's `accounts` array or a real
// FI data payload — those were inferred. The only way to know whether the
// parsers match reality is to look at a real response, and "click through
// the whole app to find out" is a slow way to discover a renamed field.
// This prints the raw payload next to what lib/setu-parse.ts made of it, so
// a mismatch is one line of output rather than an afternoon (CONVENTIONS.md
// #8).
//
// Nothing here writes to the database — it is a probe, not a sync.
//
// Usage:
//   npm run setu:smoke -- consent 9876543210    raise a consent, print the approval URL
//   npm run setu:smoke -- status <consentId>    read it back (run after approving)
//   npm run setu:smoke -- fetch <consentId>     create a data session and poll it
//   ... add --raw to any of them to dump Setu's untouched JSON as well.

process.loadEnvFile(".env");

import {
  createConsentRequest,
  createDataSession,
  getConsent,
  getDataSession,
  isSetuConfigured,
  SetuApiError,
  setuRequest,
  toVua,
} from "../src/lib/setu";

const MONTHS_OF_HISTORY = 12;
const POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

function dataRange() {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - MONTHS_OF_HISTORY);
  return { from, to };
}

function dump(label: string, value: unknown) {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(value, null, 2));
}

async function raiseConsent(mobileNumber: string, raw: boolean) {
  const vua = toVua(mobileNumber);
  console.log(`Raising a consent for ${vua} over the last ${MONTHS_OF_HISTORY} months…`);

  const consent = await createConsentRequest({
    vua,
    redirectUrl: "http://localhost:3000/connect-bank",
    dataRange: dataRange(),
    durationMonths: MONTHS_OF_HISTORY,
  });

  console.log(`\nConsent id: ${consent.consentId}`);
  console.log(`Status:     ${consent.status}`);
  console.log(`\nOpen this and approve it:\n  ${consent.url}`);
  console.log(`\nThen:\n  npm run setu:smoke -- status ${consent.consentId}`);

  if (raw) dump("raw consent", await setuRequest(`/consents/${consent.consentId}?expanded=true`));
}

async function readConsent(consentId: string, raw: boolean) {
  if (raw) dump("raw consent", await setuRequest(`/consents/${consentId}?expanded=true`));

  const consent = await getConsent(consentId);
  console.log(`Status:  ${consent.status}`);
  console.log(`Expires: ${consent.consentExpiry?.toISOString() ?? "(not reported)"}`);
  console.log(`Accounts parsed: ${consent.accounts.length}`);
  for (const account of consent.accounts) {
    console.log(
      `  ${account.fipId} · ${account.maskedAccountNumber} · ${account.accountType ?? "type?"} · linkRef ${account.linkRefNumber}`,
    );
  }

  // The check that matters: an ACTIVE consent with zero parsed accounts
  // means the payload nests them somewhere parseConsentAccounts does not
  // look, and every link would silently create no LinkedAccount rows.
  if (consent.status === "ACTIVE" && consent.accounts.length === 0) {
    console.warn(
      "\n⚠ ACTIVE consent but no accounts parsed — re-run with --raw and compare against parseConsentAccounts() in src/lib/setu-parse.ts.",
    );
  }
}

async function fetchData(consentId: string, raw: boolean) {
  const session = await createDataSession({ consentId, dataRange: dataRange() });
  console.log(`Data session: ${session.dataSessionId} (${session.status})`);

  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
    const parsed = await getDataSession(session.dataSessionId);
    console.log(`  attempt ${attempt}: status ${parsed.status ?? "?"}`);

    if (parsed.status === "COMPLETED" || parsed.status === "PARTIAL") {
      if (raw) dump("raw data session", await setuRequest(`/sessions/${session.dataSessionId}`));

      for (const account of parsed.accounts) {
        console.log(
          `\n${account.fipId} · linkRef ${account.linkRefNumber} · ${account.status ?? "status?"} · ` +
            `${account.transactions.length} transaction(s) · balance ${account.currentBalance ?? "?"}`,
        );
        for (const tx of account.transactions.slice(0, 5)) {
          console.log(
            `  ${tx.transactionDate.toISOString().slice(0, 10)}  ${tx.direction.padEnd(6)} ` +
              `${tx.amount.padStart(10)}  ${tx.mode ?? "-"}  ${tx.description}`,
          );
        }
      }

      const total = parsed.accounts.reduce((sum, a) => sum + a.transactions.length, 0);
      if (total === 0) {
        console.warn(
          "\n⚠ Session is ready but nothing parsed — re-run with --raw and compare against parseDataSession() in src/lib/setu-parse.ts.",
        );
      }
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.warn("Session never left PENDING. Check the FIP's status on the Bridge.");
}

async function main() {
  const args = process.argv.slice(2);
  const raw = args.includes("--raw");
  const [command, value] = args.filter((a) => !a.startsWith("--"));

  if (!isSetuConfigured()) {
    console.error(
      "Setu is not configured. Fill SETU_CLIENT_ID, SETU_CLIENT_SECRET and\n" +
        "SETU_PRODUCT_INSTANCE_ID in .env — see README's \"Connecting the Setu AA sandbox\".",
    );
    process.exit(1);
  }

  switch (command) {
    case "consent":
      if (!value) return usage();
      return raiseConsent(value, raw);
    case "status":
      if (!value) return usage();
      return readConsent(value, raw);
    case "fetch":
      if (!value) return usage();
      return fetchData(value, raw);
    default:
      return usage();
  }
}

function usage() {
  console.log(
    [
      "Usage:",
      "  npm run setu:smoke -- consent <mobileNumber>   raise a consent, print the approval URL",
      "  npm run setu:smoke -- status  <consentId>      read it back after approving",
      "  npm run setu:smoke -- fetch   <consentId>      create a data session and poll it",
      "",
      "  --raw   also dump Setu's untouched JSON",
    ].join("\n"),
  );
  process.exit(1);
}

main().catch((error) => {
  // A SetuApiError carries the response body, which is where the actual
  // reason lives — "400" alone tells you nothing about which field Setu
  // rejected.
  if (error instanceof SetuApiError) {
    console.error(`\n${error.message}`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
