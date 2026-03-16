import { notFound } from "next/navigation";
import { BookOpenText, Puzzle } from "lucide-react";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import PublicAppShell from "@/components/public/PublicAppShell";
import {
  DetailList,
  ProductInfoHero,
  ProductPurchaseCard,
} from "@/components/shop/ShopCatalog";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import {
  getCatalogItem,
  getPublicShopCatalog,
  isCatalogItemInDevelopment,
  type CatalogCategory,
} from "@/lib/shop/catalog";

const PRODUCT_CATEGORY_CONFIG = {
  boeken: {
    title: "Boekinformatie",
    icon: BookOpenText,
  },
  spellen: {
    title: "Spelinformatie",
    icon: Puzzle,
  },
} as const;

function isProductCategory(value: string): value is CatalogCategory {
  return value === "boeken" || value === "spellen";
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  if (!isProductCategory(category)) notFound();

  const catalog = await getPublicShopCatalog();
  const item = getCatalogItem(catalog, category, slug);
  if (!item) notFound();

  const config = PRODUCT_CATEGORY_CONFIG[category];
  const isInDevelopment = isCatalogItemInDevelopment(item);

  return (
    <PublicAppShell activeTab="shop" title={item.title}>
      <section className="space-y-5">
        <HistoryBackButton
          fallbackHref={`/shop/${category}`}
          className="inline-flex items-center rounded-full border border-[#decfbe] bg-white/80 px-4 py-2 text-sm text-stone-700 shadow-sm"
        >
          Terug naar {category}
        </HistoryBackButton>

        <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/85 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#6f5949]">
            <config.icon size={18} strokeWidth={1.8} />
            <span className="text-xs font-medium uppercase tracking-[0.22em]">
              {config.title}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#6b5d50]">
            Bekijk eerst de productinformatie in de app. Daarna kun je
            desgewenst doorklikken om het product via De Troostboom te kopen.
          </p>
        </div>

        <ProductInfoHero item={item} />

        {item.body ? (
          <DetailList icon={config.icon} title="Beschrijving">
            <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-5 shadow-sm">
              <div
                className="prose prose-sm max-w-none prose-headings:text-stone-900 prose-p:text-stone-800 prose-li:text-stone-800 prose-strong:text-stone-900 prose-a:text-stone-900"
                dangerouslySetInnerHTML={{ __html: normalizeImages(item.body) }}
              />
            </div>
          </DetailList>
        ) : null}

        <DetailList icon={config.icon} title="Meer informatie">
          <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
            <ul className="space-y-3 text-sm leading-6 text-[#6b5d50]">
              {item.details.map((detail) => (
                <li
                  key={detail}
                  className="rounded-[1rem] bg-[#f8f1e8] px-3 py-3"
                >
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </DetailList>

        <DetailList icon={config.icon} title="Volgende stap">
          <ProductPurchaseCard item={item} />
        </DetailList>

        {isInDevelopment ? (
          <div className="rounded-[1.4rem] border border-dashed border-[#dccdbf] bg-white/70 p-4 text-sm leading-6 text-stone-600">
            Deze optie blijft alvast zichtbaar in de shop, maar is nog niet te
            bestellen. Zodra de digitale versie klaar is, kan hier direct een
            koopknop aan gekoppeld worden.
          </div>
        ) : null}
      </section>
    </PublicAppShell>
  );
}
