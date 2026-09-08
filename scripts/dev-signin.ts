// Mints a working sign-in link without sending an email.
//
// Why this exists: Supabase's built-in email service is rate-limited to
// roughly 2 messages per hour project-wide — it's meant for testing, not
// real use — so the normal magic-link flow stalls constantly in local
// development. It's also useless for a demo account like demo@mail.com,
// which is nobody's real mailbox: the email would have nowhere to land
// even if it sent.
//
// This talks to Supabase's admin API with SUPABASE_SECRET_KEY, creates
// the user if needed (already confirmed), and prints a URL pointing at
// our own /auth/callback with a token_hash — the same shape a real email
// link has, so it exercises the real verifyOtp path rather than routing
// around it.
//
// DEVELOPMENT ONLY. This bypasses email verification entirely, which is
// exactly what you want locally and never what you want in production.
// The proper fix for a deployed app is custom SMTP under
// Authentication → SMTP Settings.
//
// Usage:
//   npm run dev:signin -- demo@mail.com
//   npm run dev:signin -- someone@example.com --port 3001

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env");

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"));
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? args[portIndex + 1] : "3000";

  if (!email) {
    console.error("Usage: npm run dev:signin -- <email> [--port 3000]");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must both be set in .env.\n" +
        "The secret key is under Project Settings → API Keys (the sb_secret_... one).",
    );
    process.exit(1);
  }

  const admin = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  // "already been registered" is the expected path on every run after the
  // first — not an error worth stopping for.
  if (createError && !/already/i.test(createError.message)) {
    console.error("Could not create user:", createError.message);
    process.exit(1);
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.hashed_token) {
    console.error("Could not generate link:", error?.message);
    process.exit(1);
  }

  // Point at our own callback rather than data.properties.action_link, so
  // this doesn't depend on the redirect-URL allowlist being configured.
  const signInUrl =
    `http://localhost:${port}/auth/callback` +
    `?token_hash=${data.properties.hashed_token}` +
    `&type=magiclink&redirectTo=%2Fhome`;

  console.log(`\nSign-in link for ${email} (single use, expires shortly):\n`);
  console.log(signInUrl);
  console.log("\nPaste it into the browser you want to be signed in.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
