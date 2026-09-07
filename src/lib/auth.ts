import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * The current signed-in user's id, or throws if there isn't one — callers
 * (API routes, server components) are expected to run behind src/proxy.ts,
 * which already redirects unauthenticated requests to /login, so reaching
 * this throw means proxy's public-path list and a route's actual auth
 * requirement have drifted out of sync.
 *
 * Uses getClaims(), not getSession() — getClaims() verifies the JWT
 * signature; getSession() trusts whatever the cookie claims, which isn't
 * safe to base authorization on.
 */
export async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    throw new Error("Not authenticated");
  }

  const userId = data.claims.sub;
  const email = typeof data.claims.email === "string" ? data.claims.email : undefined;

  // Defense in depth: src/app/auth/callback/route.ts is where the matching
  // User row is normally created, right after first sign-in. This upsert
  // only matters for a session that predates that (or a race) — it never
  // overwrites anything on an existing row.
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: email ?? `${userId}@unknown.local` },
  });

  return userId;
}
