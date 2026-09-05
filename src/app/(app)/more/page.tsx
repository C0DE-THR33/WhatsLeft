import Link from "next/link";

// Full mockup: design/More.dc.html
const ITEMS = [
  { label: "Bill Scanner", href: "/more/bill-scanner", soon: true },
  { label: "Investments", href: "/more/investments", soon: true },
  { label: "Settings", href: "/more/settings", soon: false },
];

export default function MorePage() {
  return (
    <main className="flex flex-col gap-4 p-5">
      <h1 className="text-lg font-extrabold">More</h1>
      <div className="flex flex-col rounded-[18px] border border-border bg-surface px-4">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 border-b border-border py-3.5 text-sm font-bold text-foreground last:border-b-0"
          >
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-[11px] font-bold text-warn-fg">
                Soon
              </span>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
