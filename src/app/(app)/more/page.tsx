import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

const LINKS = [
  { href: "/more/investments", label: "Investments", icon: "📈" },
  { href: "/more/bill-scanner", label: "Bill scanner", icon: "🧾" },
  { href: "/connect-bank", label: "Connect a bank account", icon: "🏦" },
  { href: "/more/settings", label: "Settings", icon: "⚙️" },
];

export default function MorePage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-6 text-xl font-semibold text-fg">More</h1>

      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">
        {LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-fg ${i > 0 ? "border-t border-border" : ""}`}
          >
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      <SignOutButton />
    </div>
  );
}
