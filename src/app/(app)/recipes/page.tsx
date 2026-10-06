import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

const emojiFor = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("pasta") || t.includes("spaghetti") || t.includes("noodle")) return "🍝";
  if (t.includes("salad")) return "🥗";
  if (t.includes("soup")) return "🍜";
  if (t.includes("cake") || t.includes("cookie") || t.includes("dessert")) return "🍰";
  if (t.includes("pizza")) return "🍕";
  if (t.includes("burger")) return "🍔";
  if (t.includes("rice") || t.includes("sushi")) return "🍚";
  if (t.includes("chicken")) return "🍗";
  if (t.includes("bread") || t.includes("toast")) return "🍞";
  if (t.includes("coffee") || t.includes("latte")) return "☕";
  return "🍽️";
};

export default async function RecipesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const recipes = await db.query.recipes.findMany({
    where: (recipes, { eq }) => eq(recipes.userId, session.user.id!),
    orderBy: [desc(schema.recipes.createdAt)],
    with: {
      ingredients: true,
      recipeTags: { with: { tag: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">My Recipes</h1>
          <p className="mt-1 text-sm text-stone-500">
            {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Link
          href="/recipes/new"
          className="text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
        >
          + New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 mb-5">
            <span className="text-3xl">🍳</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-800">No recipes yet</h3>
          <p className="mt-1.5 text-sm text-stone-500 max-w-sm mx-auto">
            Start building your collection — add your first recipe and it&apos;ll show up here.
          </p>
          <div className="mt-6">
            <Link
              href="/recipes/new"
              className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-orange-600 hover:bg-orange-500 transition-colors shadow-sm shadow-orange-200"
            >
              + Add your first recipe
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group bg-white rounded-2xl border border-stone-200/70 hover:border-stone-300 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="h-36 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center border-b border-stone-100">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-5xl opacity-60 group-hover:opacity-80 transition-opacity">
                    {emojiFor(recipe.title)}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-stone-900 truncate group-hover:text-orange-600 transition-colors">
                  {recipe.title}
                </h3>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-400">
                  <span>{recipe.servings} servings</span>
                  <span>·</span>
                  <span>{recipe.ingredients.length} ingredients</span>
                </div>
                {recipe.recipeTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {recipe.recipeTags.slice(0, 3).map((rt) => (
                      <span
                        key={rt.tag.id}
                        className="px-2 py-0.5 text-[11px] font-medium bg-stone-100 text-stone-600 rounded-md"
                      >
                        {rt.tag.name}
                      </span>
                    ))}
                    {recipe.recipeTags.length > 3 && (
                      <span className="px-2 py-0.5 text-[11px] font-medium text-stone-400">
                        +{recipe.recipeTags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
