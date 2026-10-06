import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const recipe = await db.query.recipes.findFirst({
    where: (recipes, { eq }) => eq(recipes.id, id),
    with: {
      ingredients: true,
      recipeTags: { with: { tag: true } },
      user: { columns: { email: true } },
    },
  });

  if (!recipe) {
    notFound();
  }

  const isOwner = recipe.userId === session.user.id;
  const canView = recipe.isPublic || isOwner;

  if (!canView) {
    notFound();
  }

  function formatIngredients(ingredients: NonNullable<typeof recipe>["ingredients"]) {
    return ingredients.map((ing) => {
      const parts = [];
      if (ing.quantity !== null) parts.push(ing.quantity.toString());
      if (ing.unit) parts.push(ing.unit);
      parts.push(ing.name);
      return parts.join(" ");
    });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/recipes"
          className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
        >
          ← Back to recipes
        </Link>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              href={`/recipes/${id}/edit`}
              className="px-3.5 py-1.5 text-sm font-medium text-stone-600 border border-stone-300 rounded-lg hover:bg-white hover:border-stone-400 transition-colors"
            >
              Edit
            </Link>
            <form action={`/api/recipes/${id}`} method="POST">
              <input type="hidden" name="_method" value="DELETE" />
              <button
                type="submit"
                className="px-3.5 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                onClick={(e) => {
                  if (!confirm("Delete this recipe?")) e.preventDefault();
                }}
              >
                Delete
              </button>
            </form>
          </div>
        )}
      </div>

      <article className="bg-white rounded-2xl border border-stone-200/70 shadow-sm overflow-hidden">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
            <span className="text-6xl opacity-70">🍽️</span>
          </div>
        )}

        <div className="p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-lg">
              {recipe.servings} servings
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                recipe.isPublic
                  ? "bg-green-100 text-green-700"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {recipe.isPublic ? "Public" : "Private"}
            </span>
            {recipe.recipeTags.map((rt) => (
              <span
                key={rt.tag.id}
                className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-600 rounded-lg"
              >
                {rt.tag.name}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{recipe.title}</h1>

          {recipe.sourceUrl && (
            <p className="mt-2 text-sm text-stone-400">
              Source:{" "}
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline font-medium"
              >
                {recipe.sourceUrl}
              </a>
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-stone-100">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Ingredients</h2>
            <ul className="space-y-2.5">
              {formatIngredients(recipe.ingredients).map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <span className="text-stone-700">{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Instructions</h2>
            <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
              {recipe.instructions}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 text-xs text-stone-400 flex items-center gap-4">
            <span>By {recipe.user.email}</span>
            <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </article>

      <div className="mt-6 bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6">
        <h3 className="text-base font-bold text-stone-900 mb-1">Add to Shopping List</h3>
        <p className="text-sm text-stone-500 mb-4">Pick ingredients you need to buy.</p>
        <form action="/api/shopping/from-recipe" method="POST" className="space-y-4">
          <input type="hidden" name="recipeId" value={id} />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recipe.ingredients.map((ing, i) => (
              <label
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  name="ingredientIds"
                  value={ing.id}
                  className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-stone-700">{formatIngredients([ing])[0]}</span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-500 transition-colors shadow-sm"
          >
            Add Selected to Shopping List
          </button>
        </form>
      </div>
    </div>
  );
}
