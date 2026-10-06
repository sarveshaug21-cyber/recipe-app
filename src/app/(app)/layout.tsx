import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200/70 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/recipes" className="text-base font-bold tracking-tight text-stone-900">
              🍳 RecipeVault
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <Link
                href="/recipes"
                className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Recipes
              </Link>
              <Link
                href="/shopping"
                className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Shopping
              </Link>
              <Link
                href="/tags"
                className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Tags
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/recipes/new"
              className="text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              + New
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
