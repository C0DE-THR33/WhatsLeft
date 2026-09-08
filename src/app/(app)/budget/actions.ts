"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentMonthKey } from "@/lib/dates";

// Budget mutations, co-located with the one page that uses them — there's
// no /api/budget route because nothing outside this page ever needs to
// create or edit a budget, so a Server Action is the whole story (unlike
// /api/transactions/[id]/categorize, which the CategorizeSheet client
// component calls with `fetch`).
//
// [userId, year, month] is a real (non-nullable) compound unique key, so
// `upsert` is safe here — unlike Category's nullable `userId`
// (CONVENTIONS.md #6).
export async function setMonthlyBudget(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const totalAmount = formData.get("totalAmount");
  if (typeof totalAmount !== "string" || !totalAmount.trim()) {
    throw new Error("totalAmount is required");
  }

  const { year, month } = currentMonthKey();

  await db.monthlyBudget.upsert({
    where: { userId_year_month: { userId, year, month } },
    update: { totalAmount },
    create: { userId, year, month, totalAmount },
  });

  revalidatePath("/budget");
  revalidatePath("/home");
}

export async function setCategoryBudget(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const categoryId = formData.get("categoryId");
  const amount = formData.get("amount");
  if (typeof categoryId !== "string" || typeof amount !== "string" || !amount.trim()) {
    throw new Error("categoryId and amount are required");
  }

  // Ownership check: a category picked here must be a shipped default or
  // actually belong to this user (CONVENTIONS.md #5).
  const category = await db.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
  });
  if (!category) throw new Error("Category not found");

  const { year, month } = currentMonthKey();

  const monthlyBudget = await db.monthlyBudget.upsert({
    where: { userId_year_month: { userId, year, month } },
    update: {},
    create: { userId, year, month, totalAmount: 0 },
  });

  await db.categoryBudget.upsert({
    where: { monthlyBudgetId_categoryId: { monthlyBudgetId: monthlyBudget.id, categoryId } },
    update: { amount },
    create: { monthlyBudgetId: monthlyBudget.id, categoryId, amount },
  });

  revalidatePath("/budget");
  revalidatePath("/home");
}
