"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Ingredient {
  id?: string;
  quantity: string;
  unit: string;
  name: string;
  rawText: string;
}

interface RecipeData {
  id: string;
  title: string;
  sourceUrl: string | null;
  servings: number;
  instructions: string;
  imageUrl: string | null;
  isPublic: boolean;
  ingredients: Ingredient[];
  tags: string[];
}

const inputClass =
  "w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors";
const labelClass = "block text-sm font-semibold text-stone-700 mb-1.5";

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [servings, setServings] = useState(4);
  const [instructions, setInstructions] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { quantity: "", unit: "", name: "", rawText: "" },
  ]);
  const [tagsInput, setTagsInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) {
          if (res.status === 404) router.push("/recipes");
          throw new Error("Failed to load recipe");
        }
        const data = await res.json();
        setRecipe(data);
        setTitle(data.title);
        setSourceUrl(data.sourceUrl || "");
        setServings(data.servings);
        setInstructions(data.instructions);
        setImageUrl(data.imageUrl || "");
        setIsPublic(data.isPublic);
        setIngredients(
          data.ingredients.map((ing: Ingredient & { quantity: number | string }) => ({
            id: ing.id,
            quantity: ing.quantity?.toString() || "",
            unit: ing.unit || "",
            name: ing.name,
            rawText: ing.rawText,
          }))
        );
        setTagsInput(data.tags.join(", "));
      } catch {
        router.push("/recipes");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecipe();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-24">
        <div className="text-sm text-stone-400">Loading recipe…</div>
      </div>
    );
  }

  if (!recipe) return null;

  function addIngredient() {
    setIngredients([...ingredients, { quantity: "", unit: "", name: "", rawText: "" }]);
  }

  function removeIngredient(index: number) {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!instructions.trim()) {
      setError("Instructions are required");
      return;
    }
    if (ingredients.some((i) => !i.name.trim())) {
      setError("All ingredients must have a name");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          sourceUrl: sourceUrl.trim() || null,
          servings,
          instructions: instructions.trim(),
          imageUrl: imageUrl.trim() || null,
          ingredients: ingredients.map((i) => ({
            id: i.id,
            quantity: i.quantity ? parseFloat(i.quantity) : null,
            unit: i.unit.trim() || null,
            name: i.name.trim(),
            rawText: i.rawText.trim() || `${i.quantity} ${i.unit} ${i.name}`.trim(),
          })),
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          isPublic,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update recipe");
        return;
      }

      router.push(`/recipes/${id}`);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete recipe");
        return;
      }

      router.push("/recipes");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/recipes/${id}`}
        className="mb-6 inline-flex items-center text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
      >
        ← Back to recipe
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Edit Recipe</h1>
            <p className="mt-1 text-sm text-stone-500">Update your recipe details.</p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            Delete
          </button>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className={labelClass}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="sourceUrl" className={labelClass}>
                Source URL
              </label>
              <input
                id="sourceUrl"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="servings" className={labelClass}>
                Servings <span className="text-red-500">*</span>
              </label>
              <input
                id="servings"
                type="number"
                min="1"
                max="100"
                required
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="imageUrl" className={labelClass}>
              Image URL
            </label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="instructions" className={labelClass}>
              Instructions <span className="text-red-500">*</span>
            </label>
            <textarea
              id="instructions"
              required
              rows={6}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={inputClass + " resize-y"}
            />
          </div>

          <div>
            <h3 className="text-base font-bold text-stone-900 mb-1">Ingredients</h3>
            <p className="text-sm text-stone-500 mb-3">Add each ingredient on a row.</p>
            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id || index} className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <label className="sr-only">Quantity</label>
                    <input
                      type="text"
                      placeholder="Qty"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="sr-only">Unit</label>
                    <input
                      type="text"
                      placeholder="Unit"
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-[2] min-w-0">
                    <label className="sr-only">Name</label>
                    <input
                      type="text"
                      placeholder="Name (e.g., flour)"
                      required
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-[2] min-w-0">
                    <label className="sr-only">Raw text</label>
                    <input
                      type="text"
                      placeholder="Raw text"
                      value={ingredient.rawText}
                      onChange={(e) => updateIngredient(index, "rawText", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length <= 1}
                    className="mt-2.5 text-stone-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="w-full flex justify-center py-2.5 px-4 border border-dashed border-stone-300 rounded-xl text-sm font-medium text-stone-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/50 transition-colors"
              >
                + Add Ingredient
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="tags" className={labelClass}>
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className={inputClass}
              placeholder="dinner, italian, pasta"
            />
            <p className="mt-1 text-xs text-stone-400">Separate with commas</p>
          </div>

          <label className="flex items-center gap-3 px-4 py-3 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100/70 transition-colors">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
            />
            <div>
              <span className="text-sm font-medium text-stone-700">Make this recipe public</span>
              <p className="text-xs text-stone-400">Anyone with the link can view it</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-5 border-t border-stone-100">
            <Link
              href={`/recipes/${id}`}
              className="px-5 py-2.5 border border-stone-300 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
