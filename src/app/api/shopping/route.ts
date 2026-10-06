import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  unit: z.string().nullable().optional(),
  quantity: z.number().default(1),
  checked: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const method = formData.get("_method");

  if (method === "DELETE") {
    const itemId = formData.get("itemId") as string;
    if (!itemId) {
      return Response.json({ error: "Item ID required" }, { status: 400 });
    }

    const item = await db.query.shoppingItems.findFirst({
      where: and(
        eq(schema.shoppingItems.id, itemId),
        eq(schema.shoppingItems.userId, session.user.id)
      ),
    });

    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    await db.delete(schema.shoppingItems).where(eq(schema.shoppingItems.id, itemId));
    return Response.redirect(new URL("/shopping", req.url));
  }

  const name = formData.get("name") as string;
  const unit = (formData.get("unit") as string) || null;
  const quantity = parseFloat(formData.get("quantity") as string) || 1;
  const checked = formData.get("checked") === "true";

  const parsed = createItemSchema.safeParse({ name, unit, quantity, checked });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await db.query.shoppingItems.findFirst({
    where: and(
      eq(schema.shoppingItems.userId, session.user.id),
      eq(schema.shoppingItems.name, name)
    ),
  });

  if (existing) {
    await db
      .update(schema.shoppingItems)
      .set({
        quantity: (Number(existing.quantity) + quantity).toString(),
        checked: false,
      })
      .where(eq(schema.shoppingItems.id, existing.id));
  } else {
    await db.insert(schema.shoppingItems).values({
      id: uuidv4(),
      userId: session.user.id,
      name,
      unit,
      quantity: quantity.toString(),
      checked: false,
    });
  }

  return Response.redirect(new URL("/shopping", req.url));
}