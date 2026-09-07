import { redirect } from "next/navigation";
import { createClient, SupabaseNotConfiguredError } from "@/lib/supabase/server";

export default async function RootPage() {
  let target = "/onboarding";

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    target = data?.claims ? "/home" : "/onboarding";
  } catch (err) {
    // Same reasoning as src/lib/supabase/proxy.ts's guard: don't crash when
    // Supabase isn't configured yet — just send everyone to the public
    // onboarding screen instead of guessing at auth state.
    if (!(err instanceof SupabaseNotConfiguredError)) throw err;
  }

  // redirect() throws internally by design (to interrupt rendering) — kept
  // outside the try block so that throw is never mistaken for a caught error.
  redirect(target);
}
