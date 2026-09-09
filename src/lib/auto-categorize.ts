// The database-touching half of automatic categorization. The rules
// themselves are pure and live in lib/categorize.ts; this module is what
// turns a CategoryIcon into an actual Category row for a given user, and
// is shared by the Setu ingest path and the backfill script so neither
// grows its own copy (CONVENTIONS.md #4).

import { CategorySource } from "@prisma/client";
import { db } from "./db";
import { categorizeByRules } from "./categorize";
import { asCategoryIcon, type CategoryIcon } from "./categories";

/**
 * Maps each category icon to the Category row that should be used for this
 * user — their own override if they have one, otherwise the shipped
 * default (userId: null).
 *
 * Built once per sync/backfill rather than queried per transaction: a
 * statement import is hundreds of rows and this is six.
 */
export async function buildIconCategoryMap(userId: string): Promise<Map<CategoryIcon, string>> {
  const categories = await db.category.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    // User rows last so they overwrite the shipped default of the same icon.
    orderBy: { userId: "asc" },
  });

  const map = new Map<CategoryIcon, string>();
  for (const category of categories) {
    map.set(asCategoryIcon(category.icon), category.id);
  }
  return map;
}

/** Runs the rules and resolves the result to a category id, or null. */
export function pickCategoryId(
  map: Map<CategoryIcon, string>,
  input: { merchantName?: string | null; description?: string | null },
): string | null {
  const match = categorizeByRules(input);
  if (!match) return null;
  return map.get(match.icon) ?? null;
}

export interface BackfillResult {
  examined: number;
  categorized: number;
}

/**
 * Categorizes this user's existing uncategorized transactions.
 *
 * Deliberately skips anything the user touched themselves: a row whose
 * categorySource is MANUAL was a decision, including the decision to clear
 * it back to uncategorized, and a backfill that silently overrode that
 * would be the app arguing with its own user. Everything else — never
 * categorized, or previously categorized by an older RULE pass — is fair
 * game.
 */
export async function backfillCategories(userId: string): Promise<BackfillResult> {
  const uncategorized = await db.transaction.findMany({
    where: {
      linkedAccount: { userId },
      categoryId: null,
      // NOT a `not` filter. Postgres three-valued logic: for a row where
      // categorySource IS NULL, `NOT (categorySource = 'MANUAL')` is NULL
      // rather than true, so the row is filtered out — and every row this
      // backfill exists to fix has a null source. Both Prisma spellings
      // (`NOT: { categorySource }` and `categorySource: { not }`) compile
      // to that, and both silently matched zero rows here. The explicit
      // OR is the only form that includes nulls.
      OR: [{ categorySource: null }, { categorySource: { not: CategorySource.MANUAL } }],
    },
    select: { id: true, merchantName: true, description: true },
  });

  if (uncategorized.length === 0) {
    return { examined: 0, categorized: 0 };
  }

  const map = await buildIconCategoryMap(userId);

  // Group by resolved category so this is one UPDATE per category rather
  // than one per transaction — a fresh import can be thousands of rows.
  const byCategory = new Map<string, string[]>();
  for (const tx of uncategorized) {
    const categoryId = pickCategoryId(map, tx);
    if (!categoryId) continue;
    const bucket = byCategory.get(categoryId);
    if (bucket) bucket.push(tx.id);
    else byCategory.set(categoryId, [tx.id]);
  }

  let categorized = 0;
  for (const [categoryId, ids] of byCategory) {
    const result = await db.transaction.updateMany({
      where: { id: { in: ids } },
      data: { categoryId, categorySource: CategorySource.RULE },
    });
    categorized += result.count;
  }

  return { examined: uncategorized.length, categorized };
}
