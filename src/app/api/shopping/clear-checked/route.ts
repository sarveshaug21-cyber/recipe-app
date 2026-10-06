import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db
      .delete(schema.shoppingItems)
      .where(
        and(
          eq(schema.shoppingItems.userId, session.user.id),
          eq(schema.shoppingItems.checked, true)
        )
      );

    return Response.redirect(new URL("/shopping", req.url));
  } catch (error) {
    console.error("Clear checked items error:", error);
    return Response.json({ error: "Failed to clear items" }, { status: 500 });
  }
}