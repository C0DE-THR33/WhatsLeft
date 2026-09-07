import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  // Same reasoning as src/lib/supabase/proxy.ts's guard: don't crash when
  // Supabase isn't configured yet — just send everyone to the public
  // onboarding screen instead of guessing at auth state.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  redirect(data?.claims ? "/home" : "/onboarding");
}
