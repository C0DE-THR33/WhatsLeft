import { CategoryTile } from "@/components/transactions/CategoryTile";
import type { CategoryIcon } from "@/lib/categories";

// Full mockup: design/Budget.dc.html
// TODO: db.monthlyBudget + db.categoryBudget for the current periodMonth,
// with spend sums from db.transaction. The two-table split (rather than one
// nullable-category table) is explained in prisma/schema.prisma.
const CATEGORY_BUDGETS: {
  icon: CategoryIcon;
  label: string;
  spent: number;
  budget: number;
  fill: "accent" | "warn" | "danger";
}[] = [
  { icon: "food", label: "Food", spent: 4750, budget: 6000, fill: "warn" },
  { icon: "transport", label: "Transport", spent: 1200, budget: 3000, fill: "accent" },
  { icon: "shopping", label: "Shopping", spent: 2400, budget: 4000, fill: "accent" },
  { icon: "bills", label: "Bills", spent: 4500, budget: 5000, fill: "danger" },
  { icon: "entertainment", label: "Entertainment", spent: 600, budget: 2000, fill: "accent" },
];

const FILL_CLASS = { accent: "bg-accent", warn: "bg-warn", danger: "bg-danger" } as const;

export default function BudgetPage() {
  return (
    <main className="flex flex-col gap-5 p-5">
      <span className="text-[19px] font-extrabold">Budget</span>

      <div className="rounded-[18px] border border-border bg-surface p-4.5">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-muted">Monthly budget</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 20l1-4L16 5l3 3-11 11-4 1Z"
              stroke="var(--muted)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="mt-1.5 text-[26px] font-extrabold">₹20,000</div>
        <span className="text-xs text-muted">₹13,450 spent so far this month</span>
      </div>

      <div>
        <span className="text-[13.5px] font-bold">By category</span>
        <div className="mt-2.5 rounded-[18px] border border-border bg-surface px-4">
          {CATEGORY_BUDGETS.map((c, i) => {
            const pct = Math.round((c.spent / c.budget) * 100);
            return (
              <div
                key={c.icon}
                className={`flex flex-col gap-2.5 py-3.5 ${i < CATEGORY_BUDGETS.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <CategoryTile icon={c.icon} size="md" />
                  <span className="flex-1 text-[13.5px] font-bold">{c.label}</span>
                  <span
                    className={`text-[12.5px] ${c.fill === "danger" ? "font-bold text-danger-fg" : "text-muted"}`}
                  >
                    ₹{c.spent.toLocaleString("en-IN")} / ₹{c.budget.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${FILL_CLASS[c.fill]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="rounded-2xl border border-dashed border-border py-3.5 text-center text-[13.5px] font-bold text-muted">
        + Add category budget
      </button>

      <button className="mt-auto rounded-2xl bg-accent py-4 text-center text-[15px] font-bold text-white">
        Save budget
      </button>
    </main>
  );
}
