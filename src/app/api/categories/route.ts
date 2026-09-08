import { NextResponse } from "next/server";
import { getCurrentUserIdOrResponse } from "@/lib/auth";
import { getCategoriesForUser } from "@/lib/queries";
import { db } from "@/lib/db";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/categories";

export async function GET() {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;

  const categories = await getCategoriesForUser(auth.userId);
  return NextResponse.json({ categories });
}

// Creates a user's own custom category (Category.userId non-null — see
// CONVENTIONS.md #6 for why default vs. custom categories are told apart
// by a nullable column rather than a boolean flag).
export async function POST(request: Request) {
  const auth = await getCurrentUserIdOrResponse();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  const { name, icon, color } = await request.json();

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!CATEGORY_ICONS.includes(icon)) {
    return NextResponse.json({ error: `icon must be one of ${CATEGORY_ICONS.join(", ")}` }, { status: 400 });
  }
  if (!CATEGORY_COLORS.includes(color)) {
    return NextResponse.json({ error: `color must be one of ${CATEGORY_COLORS.join(", ")}` }, { status: 400 });
  }

  try {
    const category = await db.category.create({
      data: { userId, name: name.trim(), icon, color },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    // Most likely the @@unique([userId, name]) constraint — the user
    // already has a category with this name.
    return NextResponse.json({ error: "You already have a category with that name" }, { status: 409 });
  }
}
