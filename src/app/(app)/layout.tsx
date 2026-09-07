import { BottomNav } from "@/components/nav/BottomNav";

// Every page under this group reads the signed-in user's own data — never
// safe to statically prerender/cache across users. Forcing it here (rather
// than relying on Next's default "calls cookies() so it must be dynamic"
// inference) also sidesteps a real gap that inference has: lib/supabase/
// server.ts's guard throws SupabaseNotConfiguredError *before* it reaches
// the cookies() call, so with no .env configured, Next's build-time
// prerender attempt never learns these pages are dynamic and hard-fails
// the whole build instead of falling back to the runtime error boundary.
export const dynamic = "force-dynamic";

/** Shell for every tab-bar screen: Home, Transactions, Budget, Analytics, More (+ its sub-pages). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
