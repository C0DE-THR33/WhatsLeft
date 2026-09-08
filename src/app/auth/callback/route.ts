import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

// Where a magic-link click lands. Creates the matching Prisma User row
// right here — this is the primary path (lib/auth.ts's getCurrentUser()
// upsert is only a defensive fallback for sessions that predate this
// route, per CONVENTIONS.md #5).
//
// Handles BOTH shapes an email link can arrive in, which is not optional:
//
//   ?code=...                  PKCE. Only works when the *same browser*
//                              started the sign-in, because exchanging it
//                              needs the code_verifier cookie that
//                              signInWithOtp() set.
//   ?token_hash=...&type=...   Verification by token hash. What Supabase's
//                              default email templates and the admin
//                              generateLink() API produce, and the only
//                              one that survives the extremely common case
//                              of clicking the link in a different browser
//                              (phone mail app, say) than the one that
//                              requested it.
//
// Supporting only `code` looks fine in local testing — you request and
// click in the same browser — and then breaks for real users.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const redirectTo = searchParams.get("redirectTo") ?? "/home";

  const supabase = await createClient();

  const { data, error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { data: null, error: new Error("No code or token_hash in callback URL") };

  if (error || !data?.user?.email) {
    console.error("Auth callback failed", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  await db.user.upsert({
    where: { id: data.user.id },
    update: {},
    create: { id: data.user.id, email: data.user.email },
  });

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
