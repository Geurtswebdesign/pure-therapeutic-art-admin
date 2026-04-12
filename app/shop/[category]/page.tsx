import type { CreditScope } from "@/components/shop/ShopCatalog";
import { notFound } from "next/navigation";
import { BookOpenText, Coins, Download, Puzzle, Stethoscope } from "lucide-react";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import PublicAppShell from "@/components/public/PublicAppShell";
import {
  AssignmentCreditsEmptyState,
  CreditPackDetailCard,
  DetailList,
  getCreditShopData,
  ProductDetailCard,
  TherapistSubscriptionDetailCard,
  YearSubscriptionDetailCard,
} from "@/components/shop/ShopCatalog";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import {
  getPublicAppMessages,
  type PublicAppMessages,
} from "@/lib/i18n/publicAppMessages";
import { translateShopCatalogSettings } from "@/lib/i18n/shopCatalogTranslations";
import { getCreditPackPurchaseMode } from "@/lib/iap/credit-pack-purchase-mode";
import {
  getPublicCatalogItemsByCategory,
  getPublicShopCatalog,
} from "@/lib/shop/catalog";
import { getActiveTherapistSubscriptionPacks } from "@/lib/users/therapistSubscriptionPacks";
import { getTherapistDirectoryAccessState } from "@/lib/users/therapistDirectoryAccess";

const CATEGORY_CONFIG = {
  credits: {
    icon: Coins,
  },
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

type ShopCategory = keyof typeof CATEGORY_CONFIG;

type CreditScopeConfig = {
  title: string;
  intro: string;
  listTitle: string;
  emptyTitle: string;
  emptyDescription: string;
};

function isShopCategory(value: string): value is ShopCategory {
  return value in CATEGORY_CONFIG;
}

function normalizeCreditScope(value: string | undefined): CreditScope {
  if (value === "book" || value === "game" || value === "referral") {
    return value;
  }
  return "assignment";
}

function getCreditScopeConfig(
  scope: CreditScope,
  messages: PublicAppMessages
): CreditScopeConfig {
  const { shop, shopCatalog } = messages;
  switch (scope) {
    case "book":
      return {
        title: shop.bookCreditsTitle,
        intro: shop.bookCreditsDescription,
        listTitle: shop.bookCreditsListTitle,
        emptyTitle: shop.bookCreditsEmptyTitle,
        emptyDescription: shop.bookCreditsEmptyDescription,
      };
    case "game":
      return {
        title: shop.gameCreditsTitle,
        intro: shop.gameCreditsDescription,
        listTitle: shop.gameCreditsListTitle,
        emptyTitle: shop.gameCreditsEmptyTitle,
        emptyDescription: shop.gameCreditsEmptyDescription,
      };
    case "referral":
      return {
        title: shop.referralCreditsTitle,
        intro: shop.referralCreditsDescription,
        listTitle: shop.referralCreditsListTitle,
        emptyTitle: shop.referralCreditsEmptyTitle,
        emptyDescription: shop.referralCreditsEmptyDescription,
      };
    case "assignment":
    default:
      return {
        title: shop.assignmentCreditsTitle,
        intro: shop.assignmentCreditsDescription,
        listTitle: shop.assignmentCreditsListTitle,
        emptyTitle: shopCatalog.noAssignmentPacksTitle,
        emptyDescription: shopCatalog.noAssignmentPacksDescription,
      };
  }
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ scope?: string | string[] | undefined }>;
}) {
  const { category } = await params;
  if (!isShopCategory(category)) notFound();

  const rawSearchParams = await searchParams;
  const requestedScope = Array.isArray(rawSearchParams.scope)
    ? rawSearchParams.scope[0]
    : rawSearchParams.scope;
  const creditScope = normalizeCreditScope(requestedScope);
  const language = resolveUiLanguage(await getAppLanguage());
  const t = getPublicAppMessages(language);
  const creditScopeConfig = getCreditScopeConfig(creditScope, t);
  const config =
    category === "credits"
      ? {
          ...CATEGORY_CONFIG.credits,
          title: creditScopeConfig.title,
          intro: creditScopeConfig.intro,
          listTitle: creditScopeConfig.listTitle,
        }
      : category === "boeken"
        ? {
            ...CATEGORY_CONFIG.boeken,
            title: t.shop.booksTitle,
            intro: t.shop.booksDescription,
            listTitle: t.shop.booksListTitle,
          }
        : category === "ebooks"
          ? {
              ...CATEGORY_CONFIG.ebooks,
              title: t.shop.ebooksTitle,
              intro: t.shop.ebooksDescription,
              listTitle: t.shop.ebooksListTitle,
            }
          : {
              ...CATEGORY_CONFIG.spellen,
              title: t.shop.gamesTitle,
              intro: t.shop.gamesDescription,
              listTitle: t.shop.gamesListTitle,
            };
  const creditShopData =
    category === "credits"
      ? await getCreditShopData(creditScope)
      : { creditPacks: [], yearSubscriptionPack: null };
  const user = category === "credits" ? await getCurrentUser() : null;
  const therapistDirectoryAccess =
    category === "credits" && user
      ? await getTherapistDirectoryAccessState(user.id)
      : null;
  const therapistSubscriptionPacks =
    therapistDirectoryAccess?.shouldShowTherapistSubscriptionShopOption
      ? await getActiveTherapistSubscriptionPacks()
      : [];
  const creditPackPurchaseMode =
    category === "credits" ? getCreditPackPurchaseMode() : "disabled";
  const { creditPacks, yearSubscriptionPack } = creditShopData;
  const catalog = translateShopCatalogSettings(
    await getPublicShopCatalog(),
    language
  );
  const categoryItems =
    category === "boeken" || category === "ebooks" || category === "spellen"
      ? getPublicCatalogItemsByCategory(catalog, category)
      : [];

  return (
    <PublicAppShell activeTab="shop" title={config.title}>
      <section className="space-y-5">
        <HistoryBackButton
          fallbackHref="/shop"
          className="inline-flex items-center rounded-full border border-[#decfbe] bg-white/80 px-4 py-2 text-sm text-stone-700 shadow-sm"
        >
          {t.shop.backToShop}
        </HistoryBackButton>

        <div className="rounded-[1.6rem] border border-[#e5d8ca] bg-[linear-gradient(180deg,#fffaf6_0%,#f8f1e8_100%)] p-5 shadow-[0_18px_36px_rgba(59,40,28,0.07)]">
          <div className="flex items-center gap-2 text-[#6f5949]">
            <config.icon size={18} strokeWidth={1.8} />
            <span className="text-xs font-medium uppercase tracking-[0.22em]">
              {t.shop.categoryEyebrow}
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#6b5d50]">
            {config.intro}
          </p>
        </div>

        {category === "credits" && therapistSubscriptionPacks.length ? (
          <div id="therapeut-abonnement">
            <DetailList icon={Stethoscope} title={t.shop.therapistSubscriptionTitle}>
              <div className="space-y-4">
                <p className="max-w-sm text-sm leading-6 text-[#6b5d50]">
                  {t.shop.therapistSubscriptionDetailDescription}
                </p>
                <div className="grid gap-3">
                  {therapistSubscriptionPacks.map((pack) => (
                    <TherapistSubscriptionDetailCard
                      key={pack.id}
                      language={language}
                      pack={pack}
                    />
                  ))}
                </div>
              </div>
            </DetailList>
          </div>
        ) : null}

        <DetailList icon={config.icon} title={config.listTitle}>
          {category === "credits" ? (
            creditPacks.length || yearSubscriptionPack ? (
              <div className="space-y-4">
                {yearSubscriptionPack ? (
                  <YearSubscriptionDetailCard
                    pack={yearSubscriptionPack}
                    isLoggedIn={Boolean(user)}
                    language={language}
                    purchaseMode={creditPackPurchaseMode}
                  />
                ) : null}
                {creditPacks.length ? (
                  <div className="grid gap-3">
                    {creditPacks.map((pack) => (
                      <CreditPackDetailCard
                        key={pack.id}
                        pack={pack}
                        isLoggedIn={Boolean(user)}
                        language={language}
                        purchaseMode={creditPackPurchaseMode}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <AssignmentCreditsEmptyState
                language={language}
                title={creditScopeConfig.emptyTitle}
                description={creditScopeConfig.emptyDescription}
              />
            )
          ) : (
            <div className="grid gap-3">
              {categoryItems.map((item) => (
                <ProductDetailCard key={item.id} item={item} language={language} />
              ))}
            </div>
          )}
        </DetailList>
      </section>
    </PublicAppShell>
  );
}
