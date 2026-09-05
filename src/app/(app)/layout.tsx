import { BottomNav } from "@/components/nav/BottomNav";

/** Shell for every tab-bar screen: Home, Transactions, Budget, Analytics, More (+ its sub-pages). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
