import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * Where a magic-link email sends the user back. Exchanges the PKCE `code`
 * for a session, creates the matching User row (see the User model's
 * comment in prisma/schema.prisma for why that row has to exist
 * separately from auth.users), then continues to wherever /login was
 * asked to redirect back to.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect") || "/home";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await db.user.upsert({
        where: { id: data.user.id },
        update: { email: data.user.email ?? undefined },
        create: {
          id: data.user.id,
          email: data.user.email ?? `${data.user.id}@unknown.local`,
        },
      });
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
