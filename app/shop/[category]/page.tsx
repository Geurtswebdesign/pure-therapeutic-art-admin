import type { CreditScope } from "@/components/shop/ShopCatalog";
import { notFound } from "next/navigation";
import { BookOpenText, Coins, Download, Puzzle } from "lucide-react";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import PublicAppShell from "@/components/public/PublicAppShell";
import {
  AssignmentCreditsEmptyState,
  CreditPackDetailCard,
  DetailList,
  getCreditShopData,
  ProductDetailCard,
  YearSubscriptionDetailCard,
} from "@/components/shop/ShopCatalog";
import {
  getPublicCatalogItemsByCategory,
  getPublicShopCatalog,
} from "@/lib/shop/catalog";

const CATEGORY_CONFIG = {
  credits: {
    title: "Opdrachtcredits",
    intro:
      "Alle actieve opdrachtpakketten en het jaarabonnement voor opdrachten. Hiermee speel je opdrachten vrij of krijg je twaalf maanden volledige toegang.",
    listTitle: "Opdrachtopties",
    icon: Coins,
  },
  boeken: {
    title: "Boeken",
    intro:
      "Overzicht van de fysieke en visuele boeken binnen de shop. Gericht op therapie, coaching en thuisgebruik.",
    listTitle: "Alle boeken",
    icon: BookOpenText,
  },
  ebooks: {
    title: "EBooks",
    intro:
      "Overzicht van de digitale e-books die je na aankoop veilig in de app kunt lezen.",
    listTitle: "Alle e-books",
    icon: Download,
  },
  spellen: {
    title: "Spellen",
    intro:
      "Overzicht van de spelmaterialen binnen de shop, inclusief digitale varianten die nog in ontwikkeling kunnen zijn.",
    listTitle: "Alle spellen",
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

function getCreditScopeConfig(scope: CreditScope): CreditScopeConfig {
  switch (scope) {
    case "book":
      return {
        title: "Boekcredits",
        intro:
          "Koop boekcredits om e-books direct in de app vrij te spelen en veilig te lezen in de reader.",
        listTitle: "Beschikbare boekcredits",
        emptyTitle: "Nog geen boekcredits actief",
        emptyDescription:
          "Activeer eerst een of meer boekcredit-pakketten in de administratie. Dan verschijnen ze automatisch hier.",
      };
    case "game":
      return {
        title: "Spelcredits",
        intro:
          "Koop spelcredits om digitale spellen of spelcontent binnen de app vrij te spelen.",
        listTitle: "Beschikbare spelcredits",
        emptyTitle: "Nog geen spelcredits actief",
        emptyDescription:
          "Activeer eerst een of meer spelcredit-pakketten in de administratie. Dan verschijnen ze automatisch hier.",
      };
    case "referral":
      return {
        title: "Verwijscredits",
        intro:
          "Koop verwijscredits om beschermde verwijscontent binnen de app vrij te spelen.",
        listTitle: "Beschikbare verwijscredits",
        emptyTitle: "Nog geen verwijscredits actief",
        emptyDescription:
          "Activeer eerst een of meer verwijscredit-pakketten in de administratie. Dan verschijnen ze automatisch hier.",
      };
    case "assignment":
    default:
      return {
        title: "Opdrachtcredits",
        intro:
          "Alle actieve opdrachtpakketten en het jaarabonnement voor opdrachten. Hiermee speel je opdrachten vrij of krijg je twaalf maanden volledige toegang.",
        listTitle: "Opdrachtopties",
        emptyTitle: "Nog geen opdrachtpakketten actief",
        emptyDescription:
          "Activeer eerst een of meer assignment credit packs of het jaarabonnement in de administratie. Dan verschijnen ze automatisch hier.",
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
  const creditScopeConfig = getCreditScopeConfig(creditScope);
  const config =
    category === "credits"
      ? {
          ...CATEGORY_CONFIG.credits,
          title: creditScopeConfig.title,
          intro: creditScopeConfig.intro,
          listTitle: creditScopeConfig.listTitle,
        }
      : CATEGORY_CONFIG[category];
  const creditShopData =
    category === "credits"
      ? await getCreditShopData(creditScope)
      : { creditPacks: [], yearSubscriptionPack: null };
  const { creditPacks, yearSubscriptionPack } = creditShopData;
  const catalog = await getPublicShopCatalog();
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
          Terug naar shop
        </HistoryBackButton>

        <div className="rounded-[1.6rem] border border-[#e5d8ca] bg-[linear-gradient(180deg,#fffaf6_0%,#f8f1e8_100%)] p-5 shadow-[0_18px_36px_rgba(59,40,28,0.07)]">
          <div className="flex items-center gap-2 text-[#6f5949]">
            <config.icon size={18} strokeWidth={1.8} />
            <span className="text-xs font-medium uppercase tracking-[0.22em]">
              Shop categorie
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#6b5d50]">
            {config.intro}
          </p>
        </div>

        <DetailList icon={config.icon} title={config.listTitle}>
          {category === "credits" ? (
            creditPacks.length || yearSubscriptionPack ? (
              <div className="space-y-4">
                {yearSubscriptionPack ? (
                  <YearSubscriptionDetailCard pack={yearSubscriptionPack} />
                ) : null}
                {creditPacks.length ? (
                  <div className="grid gap-3">
                    {creditPacks.map((pack) => (
                      <CreditPackDetailCard key={pack.id} pack={pack} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <AssignmentCreditsEmptyState
                title={creditScopeConfig.emptyTitle}
                description={creditScopeConfig.emptyDescription}
              />
            )
          ) : category === "boeken" || category === "ebooks" ? (
            <div className="grid gap-3">
              {categoryItems.map((item) => (
                <ProductDetailCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {categoryItems.map((item) => (
                <ProductDetailCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </DetailList>
      </section>
    </PublicAppShell>
  );
}
