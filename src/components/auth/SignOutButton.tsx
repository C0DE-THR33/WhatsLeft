"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // createClient() throws if Supabase isn't configured — still send
      // the user to /login either way rather than leaving them stuck.
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={signOut} className="mt-1.5 text-center text-[13.5px] font-bold text-danger-fg">
      Log out
    </button>
  );
}
