"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  {
    label: "Home",
    href: "/home",
    icon: (
      <>
        <path
          d="M4 11.5L12 4l8 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8 8h8M8 12h8M8 16h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    label: "Budget",
    href: "/budget",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.5" cy="14" r="1.3" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: (
      <path
        d="M5 19V10M12 19V5M19 19v-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ),
  },
  {
    label: "More",
    href: "/more",
    icon: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1.3" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="4" width="6" height="6" rx="1.3" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="14" width="6" height="6" rx="1.3" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="14" width="6" height="6" rx="1.3" stroke="currentColor" strokeWidth="1.8" />
      </>
    ),
  },
];

/**
 * Shared bottom tab bar. "More" is active for /more and every page nested
 * under it (bill-scanner, investments, settings) — those screens are one
 * level down in the hub, not their own top-level tab (see More.dc.html's
 * canvas annotation for why).
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-16 items-stretch justify-between border-t border-border bg-surface px-1 pt-1.5 pb-2.5">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/more"
            ? pathname.startsWith("/more")
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-[3px]",
              isActive ? "text-accent" : "text-muted"
            )}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
              {tab.icon}
            </svg>
            <span className={cn("text-[10.5px]", isActive ? "font-bold" : "font-semibold")}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
