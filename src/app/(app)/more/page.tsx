import Link from "next/link";

// Full mockup: design/More.dc.html
const ITEMS = [
  {
    label: "Bill Scanner",
    href: "/more/bill-scanner",
    soon: true,
    icon: (
      <>
        <path
          d="M5 8a2 2 0 0 1 2-2h1l1-2h6l1 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"
          stroke="var(--accent-soft-fg)"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="3.2" stroke="var(--accent-soft-fg)" strokeWidth="1.7" />
      </>
    ),
  },
  {
    label: "Investments",
    href: "/more/investments",
    soon: true,
    icon: (
      <>
        <path
          d="M4 18l6-7 4 4 6-9"
          stroke="var(--accent-soft-fg)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 6h5v5"
          stroke="var(--accent-soft-fg)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    label: "Settings",
    href: "/more/settings",
    soon: false,
    icon: (
      <>
        <circle cx="12" cy="12" r="3" stroke="var(--accent-soft-fg)" strokeWidth="1.7" />
        <path
          d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18 6l-1.8 1.8M7.8 16.2 6 18M18 18l-1.8-1.8M7.8 7.8 6 6"
          stroke="var(--accent-soft-fg)"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

export default function MorePage() {
  return (
    <main className="flex flex-col gap-4 p-5">
      <span className="text-[19px] font-extrabold">More</span>
      <div className="rounded-[18px] border border-border bg-surface px-4">
        {ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3.5 py-3.5 ${i < ITEMS.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-accent-soft">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                {item.icon}
              </svg>
            </div>
            <span className="flex-1 text-[14.5px] font-bold text-foreground">{item.label}</span>
            {item.soon && (
              <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-[11px] font-bold text-warn-fg">
                Soon
              </span>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5l7 7-7 7"
                stroke="var(--faint)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ))}
      </div>
    </main>
  );
}
