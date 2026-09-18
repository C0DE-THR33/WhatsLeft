import { getCurrentUser } from "@/lib/auth";
import { getBudgetData } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { formatMonthLabel } from "@/lib/dates";
import { asCategoryIcon, asCategoryColor } from "@/lib/categories";
import { CategoryTile } from "@/components/transactions/CategoryTile";
import { BudgetPaceBar } from "@/components/budget/BudgetPaceBar";
import { setMonthlyBudget, setCategoryBudget } from "./actions";

export default async function BudgetPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getBudgetData(user.id);
  const budgetedCategoryIds = new Set(data.categories.map((c) => c.categoryId));
  const unbudgetedCategories = data.allCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-5">
        <p className="text-[13px] font-medium text-fg-muted">{formatMonthLabel(data.monthKey)}</p>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Budget</h1>
      </header>

      <section className="mb-5 rounded-card bg-accent-soft p-5 shadow-card">
        {data.totalBudget !== null ? (
          <>
            <div className="mb-1 flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold tracking-tight text-fg tnum">
                {formatCurrency(data.totalSpent)}
              </span>
              <span className="text-sm font-medium text-accent-soft-fg tnum">
                of {formatCurrency(data.totalBudget)}
              </span>
            </div>
            <div className="mt-4">
              <BudgetPaceBar spent={data.totalSpent} budget={data.totalBudget} />
            </div>
          </>
        ) : (
          <p className="text-sm font-medium text-accent-soft-fg">
            No budget set for {formatMonthLabel(data.monthKey)} yet.
          </p>
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
            className="tnum flex-1 rounded-pill border border-border bg-surface px-4 py-2.5 text-sm font-medium text-fg outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg"
          >
            Save
          </button>
        </form>
      </section>

      {data.categories.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-fg-faint">
            By category
          </h2>
          <div className="flex flex-col gap-2.5">
            {data.categories.map((row) => {
              const over = row.budgeted > 0 && row.spent > row.budgeted;
              const pct = row.budgeted > 0 ? Math.min(row.spent / row.budgeted, 1) : 0;
              return (
                <div
                  key={row.categoryId}
                  className="flex items-center gap-3 rounded-card bg-surface p-3.5 shadow-card"
                >
                  <CategoryTile icon={row.icon} color={row.color} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-fg">{row.name}</span>
                      <span className="shrink-0 text-[13px] font-medium text-fg-muted tnum">
                        <span className={over ? "font-bold text-danger-fg" : "font-bold text-fg"}>
                          {formatCurrency(row.spent)}
                        </span>{" "}
                        / {formatCurrency(row.budgeted)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-surface-sunken">
                      <div
                        className="h-full rounded-pill"
                        style={{
                          width: `${pct * 100}%`,
                          // Over-budget wins over the category's own color:
                          // the whole point of this bar is to make overspend
                          // impossible to miss, and a category hue that
                          // happens to be reddish shouldn't read as alarming
                          // while a green one under-sells a real overrun.
                          backgroundColor: over
                            ? "var(--color-danger)"
                            : `var(--color-${row.color})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {unbudgetedCategories.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-fg-faint">
            Add a category budget
          </h2>
          <div className="flex flex-col gap-2.5">
            {unbudgetedCategories.map((category) => (
              <form
                key={category.id}
                action={setCategoryBudget}
                className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card"
              >
                <input type="hidden" name="categoryId" value={category.id} />
                <CategoryTile
                  icon={asCategoryIcon(category.icon)}
                  color={asCategoryColor(category.color)}
                  size="md"
                />
                <span className="flex-1 truncate text-sm font-semibold text-fg">
                  {category.name}
                </span>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Amount"
                  className="tnum w-24 rounded-pill border border-border bg-bg px-3 py-1.5 text-sm font-medium text-fg outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="rounded-pill bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-accent-fg"
                >
                  Add
                </button>
              </form>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
