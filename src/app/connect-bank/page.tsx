"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "connecting" | "error";

export default function ConnectBankPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConnect() {
    setStatus("connecting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/aa/consent", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Could not start bank connection.");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-3xl">
        🏦
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-fg">Connect your bank</h1>
        <p className="max-w-sm text-sm text-fg-muted">
          SpendWise uses Setu&apos;s Account Aggregator network — a
          RBI-regulated way to share statement data without handing over
          your net-banking password.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={handleConnect}
          disabled={status === "connecting"}
          className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-fg disabled:opacity-60"
        >
          {status === "connecting" ? "Connecting…" : "Connect with Setu"}
        </button>
        <Link href="/home" className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-fg">
          Skip for now
        </Link>
        {status === "error" && errorMessage ? (
          <p className="text-sm text-danger">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
