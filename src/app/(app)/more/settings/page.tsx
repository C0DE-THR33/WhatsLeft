import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getCurrentUser } from "@/lib/auth";
import { getLinkedAccounts } from "@/lib/queries";

// Full mockup: design/Settings.dc.html
// TODO: "Manage AA consent" opens a per-consent revoke flow, preferences
// persist to the User row (currency/notifications aren't modeled there yet).

const BANK_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 3 8h18L12 3Z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    <path
      d="M5 10v7M9 10v7M15 10v7M19 10v7M3.5 20h17"
      stroke="#fff"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

// Bank tiles don't carry a color in the schema (nothing to key one off of
// for an arbitrary bank name) — cycle through a small fixed palette so
// each row still reads as visually distinct, same as the design.
const BANK_TILE_COLORS = [
  "oklch(0.6 0.14 25)",
  "oklch(0.6 0.13 45)",
  "oklch(0.55 0.1 300)",
  "oklch(0.55 0.13 240)",
  "oklch(0.5 0.03 250)",
];

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 5l7 7-7 7"
      stroke="var(--faint)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const accounts = await getLinkedAccounts(user.id);
  const initial = (user.name ?? user.email)[0]?.toUpperCase() ?? "?";

  return (
    <main className="flex flex-col gap-5.5 p-5">
      <div className="flex items-center gap-3">
        <Link href="/more" aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 5l-7 7 7 7"
              stroke="var(--foreground)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <span className="text-[17px] font-extrabold">Settings</span>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-[19px] font-extrabold text-white">
          {initial}
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold">{user.name ?? "Add your name"}</span>
          <span className="text-[12.5px] text-muted">{user.email}</span>
        </div>
      </div>

      <div>
        <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-muted uppercase">
          Linked accounts
        </div>
        {accounts.length > 0 ? (
          <div className="rounded-[18px] border border-border bg-surface px-4">
            {accounts.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-center gap-3 py-3.5 ${i < accounts.length - 1 ? "border-b border-border" : ""}`}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[9px]"
                  style={{ background: BANK_TILE_COLORS[i % BANK_TILE_COLORS.length] }}
                >
                  {BANK_ICON}
                </div>
                <span className="flex-1 text-[13.5px] font-bold">
                  {a.bankName} {a.maskedAccountNumber}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    a.isActive ? "bg-success-soft text-success-fg" : "bg-border text-muted"
                  }`}
                >
                  {a.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-border bg-surface p-5 text-center">
            <p className="text-[12.5px] text-muted">No banks linked yet.</p>
          </div>
        )}
        <Link
          href="/connect-bank"
          className="mt-2.5 block text-center text-[13px] font-bold text-accent"
        >
          + Link another bank
        </Link>
      </div>

      <div>
        <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-muted uppercase">
          Consent &amp; privacy
        </div>
        <div className="rounded-[18px] border border-border bg-surface px-4">
          <button className="flex w-full items-center gap-3 border-b border-border py-3.5 text-left">
            <span className="flex-1 text-[13.5px] font-bold">Manage AA consent</span>
            <ChevronRight />
          </button>
          <button className="flex w-full items-center gap-3 py-3.5 text-left">
            <span className="flex-1 text-[13.5px] font-bold">Data &amp; privacy policy</span>
            <ChevronRight />
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-muted uppercase">
          Preferences
        </div>
        <div className="rounded-[18px] border border-border bg-surface px-4">
          <div className="flex items-center gap-3 border-b border-border py-3.5">
            <span className="flex-1 text-[13.5px] font-bold">Currency</span>
            <span className="text-[13px] font-bold text-muted">₹ INR</span>
          </div>
          <div className="flex items-center gap-3 py-3.5">
            <span className="flex-1 text-[13.5px] font-bold">Notifications</span>
            <div className="relative h-[22px] w-[38px] rounded-full bg-accent">
              <div className="absolute top-[3px] right-[3px] h-4 w-4 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      <SignOutButton />
    </main>
  );
}
