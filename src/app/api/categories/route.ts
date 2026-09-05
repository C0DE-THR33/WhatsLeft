import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

/** Default categories (userId null) plus any this user added. */
export async function GET() {
  const userId = await getCurrentUserId();

  const categories = await db.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}
