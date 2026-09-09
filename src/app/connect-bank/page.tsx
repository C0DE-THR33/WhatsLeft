"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "connecting" | "finishing" | "done" | "error";

// useSearchParams() opts a client component out of static prerendering
// unless it's wrapped in Suspense — same reason as /login.
export default function ConnectBankPage() {
  return (
    <Suspense>
      <ConnectBankFlow />
    </Suspense>
  );
}

/**
 * How long to wait for the FIPs to deliver. A data session is PENDING until
 * every bank in it responds, which in the sandbox is seconds and in
 * production can be a minute — so this polls rather than assuming the first
 * read has data, and gives up into a "we'll keep syncing in the background"
 * message rather than an error, because the webhook finishes the job either
 * way.
 */
const SYNC_POLL_ATTEMPTS = 12;
const SYNC_POLL_INTERVAL_MS = 2500;

function ConnectBankFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Setu appends these on the way back from its approval screens.
  const returnedConsentId = searchParams.get("id");
  const succeeded = searchParams.get("success") === "true";
  const returnedError = searchParams.get("errormsg");

  // A rejected or cancelled consent is fully determined by the query string,
  // so it is derived at initialisation rather than written by an effect —
  // setState in an effect body is a cascading render, and here it would also
  // mean one frame of "Connect your bank" before the failure appears.
  const returning = Boolean(returnedConsentId) && succeeded;
  const rejected = Boolean(returnedConsentId) && !succeeded;

  const [mobileNumber, setMobileNumber] = useState("");
  const [status, setStatus] = useState<Status>(
    returning ? "finishing" : rejected ? "error" : "idle",
  );
  const [message, setMessage] = useState<string | null>(
    returning ? "Linking your accounts…" : null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    rejected ? (returnedError ?? "You cancelled the bank connection.") : null,
  );

  // React runs effects twice in dev StrictMode; without this the whole
  // link-and-sync sequence would fire twice on every return from Setu.
  const finishedRef = useRef(false);

  const finishLinking = useCallback(async (consentId: string) => {
    try {
      const linkResponse = await fetch("/api/aa/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentId }),
      });
      const link = await linkResponse.json();

      if (!linkResponse.ok) {
        setStatus("error");
        // 404 here means the consent id in the URL isn't one we raised for
        // this user — a stale link, or someone else's. "Not found" is the
        // right thing for the API to say and the wrong thing to show a
        // person mid-flow.
        setErrorMessage(
          linkResponse.status === 404
            ? "We couldn't find that bank connection. Please start again."
            : (link.error ?? "Could not finish linking your bank."),
        );
        return;
      }

      if (link.status !== "ACTIVE") {
        setStatus("error");
        setErrorMessage("That consent isn't active, so no accounts were linked.");
        return;
      }

      setMessage(
        link.accounts === 1
          ? "Linked 1 account. Fetching your transactions…"
          : `Linked ${link.accounts} accounts. Fetching your transactions…`,
      );

      let dataSessionId: string | null = link.dataSessionId ?? null;

      for (let attempt = 0; attempt < SYNC_POLL_ATTEMPTS; attempt += 1) {
        const syncResponse = await fetch("/api/aa/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consentId, dataSessionId }),
        });
        const sync = await syncResponse.json();

        if (!syncResponse.ok) {
          setStatus("error");
          setErrorMessage(sync.error ?? "Your accounts are linked, but the first sync failed.");
          return;
        }

        dataSessionId = sync.dataSessionId ?? dataSessionId;

        // PARTIAL means some banks delivered and others failed — worth
        // keeping, and no amount of waiting will change it.
        if (sync.status === "COMPLETED" || sync.status === "PARTIAL") {
          setStatus("done");
          setMessage(
            sync.synced === 1
              ? "Imported 1 transaction."
              : `Imported ${sync.synced} transactions.`,
          );
          router.push("/home");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, SYNC_POLL_INTERVAL_MS));
      }

      // Not a failure: the SESSION_STATUS_UPDATE webhook will ingest the
      // data whenever the FIPs get around to delivering it.
      setStatus("done");
      setMessage("Your bank is linked. Transactions will appear here shortly.");
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    if (!returning || !returnedConsentId || finishedRef.current) return;
    finishedRef.current = true;
    void finishLinking(returnedConsentId);
  }, [returning, returnedConsentId, finishLinking]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("connecting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/aa/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Could not start bank connection.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Please try again.");
    }
  }

  const busy = status === "connecting" || status === "finishing";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-card bg-accent-soft text-accent-soft-fg">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 9.5 12 4l8.5 5.5" /><path d="M5.5 9.5v8M10 9.5v8M14 9.5v8M18.5 9.5v8" /><path d="M3 20.5h18" /></svg>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-fg">
          {status === "finishing" || status === "done" ? "Almost there" : "Connect your bank"}
        </h1>
        <p className="max-w-sm text-sm text-fg-muted">
          {status === "finishing" || status === "done"
            ? (message ?? "Finishing up…")
            : "SpendWise uses Setu's Account Aggregator network — a RBI-regulated way to share statement data without handing over your net-banking password."}
        </p>
      </div>

      {status === "finishing" || status === "done" ? (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Link
            href="/home"
            className="rounded-pill border border-border px-4 py-3 text-sm font-medium text-fg"
          >
            Go to home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
          <label htmlFor="mobile" className="text-left text-sm font-medium text-fg">
            Mobile number registered with your bank
          </label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9876543210"
            value={mobileNumber}
            onChange={(event) => setMobileNumber(event.target.value)}
            disabled={busy}
            className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-faint"
          />
          <p className="text-left text-xs text-fg-faint">
            Your Account Aggregator finds accounts by this number. Setu asks you to verify it with
            an OTP on the next screen.
          </p>
          <button
            type="submit"
            disabled={busy || mobileNumber.trim().length === 0}
            className="rounded-pill bg-accent px-4 py-3 text-sm font-medium text-accent-fg disabled:opacity-60"
          >
            {status === "connecting" ? "Connecting…" : "Connect with Setu"}
          </button>
          <Link
            href="/home"
            className="rounded-pill border border-border px-4 py-3 text-sm font-medium text-fg"
          >
            Skip for now
          </Link>
        </form>
      )}

      {status === "error" && errorMessage ? (
        <p className="max-w-sm text-sm text-danger-fg">{errorMessage}</p>
      ) : null}
    </div>
  );
}
