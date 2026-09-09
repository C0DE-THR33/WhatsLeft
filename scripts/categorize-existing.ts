// Applies the merchant rules in lib/categorize.ts to transactions that are
// already in the database.
//
// New transactions are categorized on the way in (api/aa/sync), so this is
// for data that predates the rules — or for after the rules table grows and
// you want previously unmatched rows re-examined.
//
// Safe to re-run: it only looks at rows that are still uncategorized, and
// it never touches anything the user set by hand (categorySource MANUAL),
// including a deliberate "mark as uncategorized".
//
// Usage:
//   npm run db:categorize -- demo@mail.com
//   npm run db:categorize -- demo@mail.com --dry-run

import { PrismaClient } from "@prisma/client";
import { categorizeByRules } from "../src/lib/categorize";
import { backfillCategories } from "../src/lib/auto-categorize";

const db = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");

  if (!email) {
    console.error("Usage: npm run db:categorize -- <email> [--dry-run]");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email "${email}".`);
    process.exit(1);
  }

  if (dryRun) {
    // Show what would happen, matched phrase included, without writing.
    const rows = await db.transaction.findMany({
      where: {
        linkedAccount: { userId: user.id },
        categoryId: null,
        // See the note in lib/auto-categorize.ts: a `not` filter drops
        // null-source rows, which is all of them.
        OR: [{ categorySource: null }, { categorySource: { not: "MANUAL" } }],
      },
      select: { merchantName: true, description: true },
    });

    let would = 0;
    for (const row of rows) {
      const match = categorizeByRules(row);
      const label = row.merchantName ?? row.description;
      if (match) {
        would++;
        console.log(`  ${label}  ->  ${match.icon}  (matched "${match.matched}")`);
      } else {
        console.log(`  ${label}  ->  (no rule matched, stays uncategorized)`);
      }
    }
    console.log(`\nDry run: ${would} of ${rows.length} uncategorized would be categorized.`);
    return;
  }

  const { examined, categorized } = await backfillCategories(user.id);

  if (examined === 0) {
    console.log("Nothing uncategorized to work on.");
    return;
  }

  console.log(`Categorized ${categorized} of ${examined} uncategorized transactions.`);
  if (categorized < examined) {
    console.log(
      `${examined - categorized} had no matching rule and stay uncategorized — ` +
        "which is a real state the UI renders, not a failure.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
