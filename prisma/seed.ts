import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/categories";

const db = new PrismaClient();

// Seeds the shipped default categories (userId: null) — see
// src/lib/categories.ts for the single source of truth these come from.
//
// Deliberately findFirst + create rather than upsert: Category's
// @@unique([userId, name]) can't back an upsert here because Postgres
// treats every NULL as distinct for a unique constraint, so ON CONFLICT
// never matches a null userId against another null userId — the same
// caveat documented on MonthlyBudget/CategoryBudget in schema.prisma.
// An upsert would silently insert a fresh duplicate row every re-run.
async function main() {
  for (const [icon, meta] of Object.entries(DEFAULT_CATEGORIES)) {
    const existing = await db.category.findFirst({
      where: { userId: null, name: meta.label },
    });
    if (!existing) {
      await db.category.create({
        data: { userId: null, name: meta.label, icon, type: meta.type },
      });
    }
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
