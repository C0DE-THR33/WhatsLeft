"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/home";
  const hadError = searchParams.get("error") === "auth";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("redirect", redirect);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl.toString() },
      });
      setStatus(error ? "error" : "sent");
    } catch {
      // createClient() throws synchronously (not a returned `error`) when
      // Supabase isn't configured — without this catch, that exception
      // left the button stuck on "Sending…" forever instead of showing
      // the error state below.
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="text-lg font-extrabold">Check your inbox</span>
        <p className="max-w-xs text-sm text-muted">
          We sent a sign-in link to <b className="text-foreground">{email}</b>. Open it on
          this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={sendLink} className="flex flex-1 flex-col justify-center gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-extrabold">Sign in</h1>
        <p className="text-sm text-muted">We&apos;ll email you a link — no password needed.</p>
      </div>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="rounded-xl border border-border px-3.5 py-3.5 text-sm outline-none placeholder:text-faint"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-2xl bg-accent py-4 text-center text-[15px] font-bold text-white disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send sign-in link"}
      </button>
      {(status === "error" || hadError) && (
        <span className="text-center text-[13px] font-semibold text-danger-fg">
          Something went wrong sending that link. Try again.
        </span>
      )}
    </form>
  );
}

// Full mockup: no dedicated login screen in design/ — Onboarding assumed
// auth already existed. useSearchParams() needs a Suspense boundary so
// this page can still prerender its shell.
export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-col p-7">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
