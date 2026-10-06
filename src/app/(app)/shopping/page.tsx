import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ShoppingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await db.query.shoppingItems.findMany({
    where: (items, { eq }) => eq(items.userId, session.user.id!),
    orderBy: (items, { asc }) => [asc(items.checked), asc(items.name)],
  });

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/recipes"
          className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
        >
          ← Back to recipes
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Shopping List</h1>
            <p className="mt-1 text-sm text-stone-500">
              {items.length} item{items.length !== 1 ? "s" : ""}
              {checkedCount > 0 && ` · ${checkedCount} checked`}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm overflow-hidden">
        <form action="/api/shopping" method="POST" className="p-4 border-b border-stone-100">
          <div className="flex gap-2">
            <input
              name="name"
              type="text"
              required
              placeholder="Add an item…"
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

        {items.length === 0 ? (
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="text-base font-semibold text-stone-800">Your list is empty</h3>
            <p className="mt-1 text-sm text-stone-500">
              Add items above, or add them from any recipe.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-3 hover:bg-stone-50/70 transition-colors">
                <form action="/api/shopping" method="POST" className="flex items-center gap-3">
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="name" value={item.name} />
                  <input type="hidden" name="unit" value={item.unit || ""} />
                  <input type="hidden" name="quantity" value={item.quantity.toString()} />

                  <input
                    type="checkbox"
                    name="checked"
                    checked={item.checked}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="h-5 w-5 rounded border-stone-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        item.checked ? "line-through text-stone-300" : "text-stone-700"
                      }`}
                    >
                      {item.name}
                      {Number(item.quantity) !== 1 && (
                        <>
                          <span className="text-stone-300"> — </span>
                          <span className="font-mono text-xs text-stone-500">{item.quantity}</span>
                          {item.unit && (
                            <span className="text-stone-400 text-xs"> {item.unit}</span>
                          )}
                        </>
                      )}
                    </span>
                  </div>

                  <button
                    type="submit"
                    name="_method"
                    value="DELETE"
                    className="text-stone-300 hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      if (!confirm("Remove this item?")) e.preventDefault();
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {checkedCount > 0 && (
          <form action="/api/shopping/clear-checked" method="POST" className="p-4 border-t border-stone-100">
            <button
              type="submit"
              className="w-full py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear {checkedCount} checked item{checkedCount !== 1 ? "s" : ""}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
