import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tags = await db.query.tags.findMany({
    where: (tags, { eq }) => eq(tags.userId, session.user.id!),
    orderBy: (tags, { asc }) => [asc(tags.name)],
    with: {
      recipeTags: {
        with: { recipe: { columns: { id: true } } },
      },
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/recipes"
          className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
        >
          ← Back to recipes
        </Link>
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-stone-900">Tags</h1>
          <p className="mt-1 text-sm text-stone-500">
            {tags.length} tag{tags.length !== 1 ? "s" : ""} · organize your recipes
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm overflow-hidden">
        <form action="/api/tags" method="POST" className="p-4 border-b border-stone-100">
          <div className="flex gap-2">
            <input
              name="name"
              type="text"
              required
              placeholder="New tag (e.g., vegetarian, quick)"
              className="flex-1 px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-500 transition-colors shadow-sm"
            >
              Add
            </button>
          </div>
        </form>

        {tags.length === 0 ? (
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 mb-4">
              <span className="text-2xl">🏷️</span>
            </div>
            <h3 className="text-base font-semibold text-stone-800">No tags yet</h3>
            <p className="mt-1 text-sm text-stone-500">
              Create tags above to organize your recipes.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {tags.map((tag) => (
              <li key={tag.id} className="px-4 py-3 flex items-center justify-between hover:bg-stone-50/70 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-sm font-semibold bg-orange-100 text-orange-700 rounded-lg">
                    {tag.name}
                  </span>
                  <span className="text-sm text-stone-400">
                    {tag.recipeTags.length} recipe{tag.recipeTags.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <form
                  action="/api/tags"
                  method="POST"
                  onSubmit={(e) => {
                    if (!confirm(`Delete tag "${tag.name}"?`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="tagId" value={tag.id} />
                  <input type="hidden" name="_method" value="DELETE" />
                  <button
                    type="submit"
                    className="text-sm font-medium text-stone-300 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
