import Link from "next/link";
import { redirect } from "next/navigation";
import { createShopCatalogItem } from "@/lib/settings/actions";
import type { CatalogCategory } from "@/lib/shop/catalog";
import { getAdminAreaUrl } from "@/lib/site/urls";

const PRODUCT_TYPES: Array<{
  category: CatalogCategory;
  label: string;
  description: string;
}> = [
  {
    category: "boeken",
    label: "Boek",
    description:
      "Voor fysieke boeken die via de shop en website verkocht worden.",
  },
  {
    category: "spellen",
    label: "Spel",
    description:
      "Voor kaartspellen, werkspellen en andere speelse producten in de shop.",
  },
];

function isCatalogCategory(value: string): value is CatalogCategory {
  return PRODUCT_TYPES.some((productType) => productType.category === value);
}

export default function NewAdminShopProductPage() {
  async function createProductAction(formData: FormData) {
    "use server";

    const categoryValue = formData.get("category");

    if (typeof categoryValue !== "string" || !isCatalogCategory(categoryValue)) {
      throw new Error("Kies eerst een geldig producttype.");
    }

    const itemId = await createShopCatalogItem(categoryValue);
    redirect(getAdminAreaUrl(`/shop/${itemId}`));
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <Link
          href={getAdminAreaUrl("/shop")}
          className="text-sm text-[#2271b1] hover:underline"
        >
          Terug naar shop
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Nieuw product</h1>
          <p className="text-sm text-gray-600">
            Kies eerst welk type product je wilt aanmaken. Daarna open je direct
            de producteditor.
          </p>
        </div>
      </div>

      <form action={createProductAction} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {PRODUCT_TYPES.map((productType) => (
            <label
              key={productType.category}
              className="group flex cursor-pointer flex-col rounded-xl border border-stone-200 bg-white p-5 transition hover:border-[#2271b1] hover:shadow-sm"
            >
              <input
                type="radio"
                name="category"
                value={productType.category}
                className="sr-only peer"
                required
              />
              <span className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-stone-500 peer-checked:border-[#2271b1] peer-checked:bg-[#eef6fb] peer-checked:text-[#2271b1]">
                {productType.label}
              </span>
              <span className="mt-4 text-lg font-semibold text-stone-900">
                {productType.label}
              </span>
              <span className="mt-2 text-sm leading-6 text-stone-600">
                {productType.description}
              </span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#135e96]"
          >
            Product aanmaken
          </button>
          <Link
            href={getAdminAreaUrl("/shop")}
            className="rounded border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Annuleren
          </Link>
        </div>
      </form>
    </div>
  );
}
