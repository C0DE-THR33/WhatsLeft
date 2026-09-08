import { getCurrentUser } from "@/lib/auth";
import { getBudgetData } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { formatMonthLabel } from "@/lib/dates";
import { asCategoryIcon, asCategoryColor } from "@/lib/categories";
import { CategoryTile } from "@/components/transactions/CategoryTile";
import { setMonthlyBudget, setCategoryBudget } from "./actions";

export default async function BudgetPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getBudgetData(user.id);
  const budgetedCategoryIds = new Set(data.categories.map((c) => c.categoryId));
  const unbudgetedCategories = data.allCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-1 text-xl font-semibold text-fg">Budget</h1>
      <p className="mb-6 text-sm text-fg-muted">{formatMonthLabel(data.monthKey)}</p>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        {data.totalBudget !== null ? (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-fg-muted">Spent</span>
              <span className="text-sm font-medium text-fg">
                {formatCurrency(data.totalSpent)} / {formatCurrency(data.totalBudget)}
              </span>
            </div>
            <ProgressBar spent={data.totalSpent} budget={data.totalBudget} />
          </>
        ) : (
          <p className="mb-4 text-sm text-fg-muted">No budget set for {formatMonthLabel(data.monthKey)} yet.</p>
        )}

        <form action={setMonthlyBudget} className="mt-4 flex gap-2">
          <input
            type="number"
            name="totalAmount"
            step="0.01"
            min="0"
            required
            placeholder="Total monthly budget"
            defaultValue={data.totalBudget ?? undefined}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          />
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg">
            Save
          </button>
        </form>
      </section>

      {data.categories.length > 0 ? (
        <section className="mb-6 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-fg">By category</h2>
          {data.categories.map((row) => (
            <div key={row.categoryId} className="flex items-center gap-3">
              <CategoryTile icon={row.icon} color={row.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="truncate text-sm text-fg">{row.name}</span>
                  <span className="text-xs text-fg-muted">
                    {formatCurrency(row.spent)} / {formatCurrency(row.budgeted)}
                  </span>
                </div>
                <ProgressBar spent={row.spent} budget={row.budgeted} thin />
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {unbudgetedCategories.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-fg">Add a category budget</h2>
          {unbudgetedCategories.map((category) => (
            <form key={category.id} action={setCategoryBudget} className="flex items-center gap-3">
              <input type="hidden" name="categoryId" value={category.id} />
              <CategoryTile icon={asCategoryIcon(category.icon)} color={asCategoryColor(category.color)} size="sm" />
              <span className="flex-1 truncate text-sm text-fg">{category.name}</span>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0"
                required
                placeholder="Amount"
                className="w-28 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-accent"
              />
              <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg">
                Add
              </button>
            </form>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function ProgressBar({ spent, budget, thin = false }: { spent: number; budget: number; thin?: boolean }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const overBudget = budget > 0 && spent > budget;

  return (
    <div className={`w-full overflow-hidden rounded-full bg-border ${thin ? "h-1.5" : "h-2.5"}`}>
      <div
        className={`h-full rounded-full ${overBudget ? "bg-danger" : "bg-accent"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
