import { CategoryTile } from "@/components/transactions/CategoryTile";
import { getCurrentUserId } from "@/lib/auth";
import { getBudgetData } from "@/lib/queries";

// Full mockup: design/Budget.dc.html
export default async function BudgetPage() {
  const userId = await getCurrentUserId();
  const { monthlyBudgetAmount, totalSpent, categoryRows } = await getBudgetData(userId);

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
        {monthlyBudgetAmount > 0 ? (
          <>
            <div className="mt-1.5 text-[26px] font-extrabold">
              ₹{monthlyBudgetAmount.toLocaleString("en-IN")}
            </div>
            <span className="text-xs text-muted">
              ₹{totalSpent.toLocaleString("en-IN")} spent so far this month
            </span>
          </>
        ) : (
          <div className="mt-1.5 text-sm text-muted">Not set yet — tap below to add one.</div>
        )}
      </div>

      <div>
        <span className="text-[13.5px] font-bold">By category</span>
        {categoryRows.length > 0 ? (
          <div className="mt-2.5 rounded-[18px] border border-border bg-surface px-4">
            {categoryRows.map((c, i) => {
              const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
              const fillClass = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warn" : "bg-accent";
              const overBudget = c.spent > c.budget;
              return (
                <div
                  key={c.categoryId}
                  className={`flex flex-col gap-2.5 py-3.5 ${i < categoryRows.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <CategoryTile icon={c.icon} size="md" />
                    <span className="flex-1 text-[13.5px] font-bold">{c.label}</span>
                    <span className={`text-[12.5px] ${overBudget ? "font-bold text-danger-fg" : "text-muted"}`}>
                      ₹{c.spent.toLocaleString("en-IN")} / ₹{c.budget.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full ${fillClass}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-2.5 rounded-[18px] border border-dashed border-border bg-surface p-5 text-center">
            <p className="text-[12.5px] text-muted">No category budgets set for this month yet.</p>
          </div>
        )}
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
