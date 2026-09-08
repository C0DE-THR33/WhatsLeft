// Shipped defaults only — six default categories, one per icon in
// lib/categories.ts's CATEGORY_ICONS. Safe to run against ANY environment,
// any number of times (CONVENTIONS.md #6). Contrast with seed-demo.ts,
// which needs a real signed-in user and is explicitly NOT safe to run
// blindly.
//
// `Category.userId` is nullable (null = default), which is exactly the
// shape a nullable-key upsert can't handle reliably — Postgres treats
// every NULL as distinct for @@unique purposes, so `ON CONFLICT` never
// fires. findFirst + conditional create instead (CONVENTIONS.md #6).

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "food", color: "cat-food" },
  { name: "Transport", icon: "transport", color: "cat-transport" },
  { name: "Shopping", icon: "shopping", color: "cat-shopping" },
  { name: "Bills & Utilities", icon: "bills", color: "cat-bills" },
  { name: "Entertainment", icon: "entertainment", color: "cat-entertainment" },
  { name: "Other", icon: "other", color: "cat-other" },
] as const;

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await db.category.findFirst({
      where: { userId: null, name: category.name },
    });

    if (existing) {
      console.log(`Skipping "${category.name}" — already seeded.`);
      continue;
    }

    await db.category.create({ data: { ...category, userId: null } });
    console.log(`Created default category "${category.name}".`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
