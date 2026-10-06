import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const recipeId = formData.get("recipeId") as string;
  const ingredientIds = formData.getAll("ingredientIds") as string[];

  if (!recipeId || ingredientIds.length === 0) {
    return Response.json({ error: "Recipe ID and ingredient IDs required" }, { status: 400 });
  }

  const recipe = await db.query.recipes.findFirst({
    where: (recipes, { eq }) => eq(recipes.id, recipeId),
    with: { ingredients: true },
  });

  if (!recipe) {
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  }

  const isOwner = recipe.userId === session.user.id;
  const canView = recipe.isPublic || isOwner;

  if (!canView) {
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  }

  const selectedIngredients = recipe.ingredients.filter((ing) =>
    ingredientIds.includes(ing.id)
  );

  try {
    await db.transaction(async (tx) => {
      for (const ing of selectedIngredients) {
        const existing = await tx.query.shoppingItems.findFirst({
          where: and(
            eq(schema.shoppingItems.userId, session.user.id!),
            eq(schema.shoppingItems.name, ing.name)
          ),
        });

        if (existing) {
          const currentQty = Number(existing.quantity);
          const addQty = Number(ing.quantity) || 1;
          await tx
            .update(schema.shoppingItems)
            .set({
              quantity: (currentQty + addQty).toString(),
              unit: ing.unit ?? existing.unit,
              checked: false,
            })
            .where(eq(schema.shoppingItems.id, existing.id));
        } else {
          await tx.insert(schema.shoppingItems).values({
            id: uuidv4(),
            userId: session.user.id!,
            name: ing.name,
            unit: ing.unit,
            quantity: ing.quantity?.toString() ?? "1",
            checked: false,
          });
        }
      }
    });

    return Response.redirect(new URL("/shopping", req.url));
  } catch (error) {
    console.error("Add to shopping list error:", error);
    return Response.json({ error: "Failed to add items" }, { status: 500 });
  }
}