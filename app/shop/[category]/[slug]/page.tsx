import { notFound } from "next/navigation";
import { BookOpenText, Download, Puzzle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import PublicAppShell from "@/components/public/PublicAppShell";
import InAppEbookPurchaseCard from "@/components/shop/InAppEbookPurchaseCard";
import {
  ProductInfoHero,
  ProductPurchaseCard,
} from "@/components/shop/ShopCatalog";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPublishedContentByReference } from "@/lib/content/public-queries";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import {
  getPublicCatalogItem,
  getPublicShopCatalog,
  isCatalogItemInDevelopment,
  type CatalogCategory,
} from "@/lib/shop/catalog";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getBalanceByScope } from "@/lib/users/getBalanceByScope";

const PRODUCT_CATEGORY_CONFIG = {
  boeken: {
    icon: BookOpenText,
  },
  ebooks: {
    icon: Download,
  },
  spellen: {
    icon: Puzzle,
  },
} as const;

function isProductCategory(value: string): value is CatalogCategory {
  return value === "boeken" || value === "ebooks" || value === "spellen";
}

function ProductContentBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[#6f5949]">
        <Icon size={18} strokeWidth={1.8} />
        <span className="text-xs font-medium uppercase tracking-[0.22em]">
          {title}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  if (!isProductCategory(category)) notFound();

  const catalog = await getPublicShopCatalog();
  const item = getPublicCatalogItem(catalog, category, slug);
  if (!item) notFound();

  const language = resolveUiLanguage(await getAppLanguage());
  const config = PRODUCT_CATEGORY_CONFIG[category];
  const isInDevelopment = isCatalogItemInDevelopment(item);
  const user = category === "ebooks" ? await getCurrentUser() : null;
  const linkedContentItem =
    category === "ebooks" && item.contentSlug?.trim()
      ? await getPublishedContentByReference(item.contentSlug.trim())
      : null;
  const ebookRequiresUnlock =
    category === "ebooks" ? (linkedContentItem?.credit_cost ?? 0) > 0 : false;
  const ebookHasAccess =
    category === "ebooks" && linkedContentItem && user
      ? ebookRequiresUnlock
        ? await hasAccess(user.id, linkedContentItem.id)
        : true
      : false;
  const ebookBalance =
    category === "ebooks" && linkedContentItem && user && ebookRequiresUnlock && !ebookHasAccess
      ? await getBalanceByScope(user.id, "book")
      : 0;

  return (
    <PublicAppShell activeTab="shop" title={item.title}>
      <section className="space-y-5">
        <HistoryBackButton
          fallbackHref={`/shop/${category}`}
          className="inline-flex items-center rounded-full border border-[#decfbe] bg-white/80 px-4 py-2 text-sm text-stone-700 shadow-sm"
        >
          Terug naar {category}
        </HistoryBackButton>

        <ProductInfoHero item={item} />

        <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/85 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#6f5949]">
            <config.icon size={18} strokeWidth={1.8} />
            <span className="text-xs font-medium uppercase tracking-[0.22em]">
              {item.introTitle}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#6b5d50]">
            {item.introText}
          </p>
        </div>

        {item.body ? (
          <ProductContentBlock
            icon={config.icon}
            title={item.descriptionTitle}
          >
            <div
              className="prose prose-sm max-w-none prose-headings:text-stone-900 prose-p:text-stone-800 prose-li:text-stone-800 prose-strong:text-stone-900 prose-a:text-stone-900"
              dangerouslySetInnerHTML={{ __html: normalizeImages(item.body) }}
            />
          </ProductContentBlock>
        ) : null}

        <ProductContentBlock icon={config.icon} title={item.detailsTitle}>
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
        </ProductContentBlock>

        <ProductContentBlock icon={config.icon} title={item.purchaseTitle}>
          {category === "ebooks" ? (
            <InAppEbookPurchaseCard
              contentId={linkedContentItem?.id ?? null}
              contentSlug={linkedContentItem?.slug ?? null}
              cost={linkedContentItem?.credit_cost ?? 0}
              balance={ebookBalance}
              isLoggedIn={!!user}
              hasAccess={ebookHasAccess}
              language={language}
            />
          ) : (
            <ProductPurchaseCard
              item={item}
              showTitle={false}
              className="border-0 bg-transparent p-0 shadow-none"
            />
          )}
        </ProductContentBlock>

        {isInDevelopment ? (
          <div className="rounded-[1.4rem] border border-dashed border-[#dccdbf] bg-white/70 p-4 text-sm leading-6 text-stone-600">
            {item.developmentNotice}
          </div>
        ) : null}
      </section>
    </PublicAppShell>
  );
}
