import { CategoryTile } from "@/components/transactions/CategoryTile";

// Full mockup: design/Home.dc.html
// TODO: replace this sample data with a real query once /api routes are
// wired to auth (db.transaction.findMany(...) ordered by transactionDate).
const SAMPLE_RECENT = [
  { id: "1", merchant: "Swiggy", icon: "food", amount: -450 },
  { id: "2", merchant: "Uber", icon: "transport", amount: -180 },
  { id: "3", merchant: "Salary credit", icon: "income", amount: 45000 },
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-col gap-4 p-5 pb-2">
      <h1 className="text-lg font-extrabold">Hi, Mark</h1>

      <div className="flex flex-col gap-2 rounded-[18px] border border-border bg-surface p-4">
        {SAMPLE_RECENT.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-1">
            <CategoryTile icon={t.icon} />
            <span className="flex-1 text-sm font-bold">{t.merchant}</span>
            <span
              className={`text-sm font-bold ${t.amount < 0 ? "text-danger-fg" : "text-success-fg"}`}
            >
              {t.amount < 0 ? "−" : "+"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
      {/* TODO: port the rest of design/Home.dc.html — balance card, budget card, category donut */}
    </main>
  );
}
