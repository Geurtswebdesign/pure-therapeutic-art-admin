import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ExternalLink, Image as ImageIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreditPackPurchaseMode } from "@/lib/iap/credit-pack-purchase-mode";
import {
  getCreditPackStoreProducts,
  getDefaultCreditPackStoreProductId,
} from "@/lib/iap/credit-pack-products";
import { getDefaultSubscriptionStoreProductIds } from "@/lib/iap/subscription-products";
import { isTherapistSubscriptionPackSlug } from "@/lib/users/entitlements";
import type { TherapistSubscriptionPackOption } from "@/lib/users/therapistSubscriptionPacks";
import {
  getCatalogItemPath,
  isCatalogItemInDevelopment,
  type CatalogItem,
} from "@/lib/shop/catalog";
import {
  resolveBaseUiLanguage,
  resolveLanguageLocale,
  type UiLanguage,
} from "@/lib/i18n/runtime";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";
import NativeCreditPackPurchaseSurface from "@/components/shop/NativeCreditPackPurchaseSurface";
import NativeSubscriptionPurchaseSurface from "@/components/shop/NativeSubscriptionPurchaseSurface";

export type CreditScope = "assignment" | "book" | "game" | "referral";

export type CreditPack = {
  id: string;
  slug: string;
  name: string;
  credit_scope: CreditScope;
  credits_base: number;
  bonus_credits: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  appleStoreProductId?: string;
  googleStoreProductId?: string;
};

type AssignmentCreditShopData = {
  creditPacks: CreditPack[];
  yearSubscriptionPack: CreditPack | null;
};

export async function getCreditShopData(
  scope: CreditScope
): Promise<AssignmentCreditShopData> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("credit_packs")
      .select(
        "id, slug, name, credit_scope, credits_base, bonus_credits, price_cents, currency, is_active, sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<CreditPack[]>();

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []).filter((pack) => {
      if (!pack.is_active) return false;
      if (pack.credit_scope !== scope) return false;
      if (scope === "assignment" && isTherapistSubscriptionPackSlug(pack.slug)) {
        return false;
      }
      return true;
    });

    const storeProducts = await getCreditPackStoreProducts(
      rows.map((pack) => pack.id)
    );

    const rowsWithStoreProducts = rows.map((pack) => {
      const mappedProducts = storeProducts.get(pack.id);
      const fallbackStoreProductId = getDefaultCreditPackStoreProductId(pack);
      const fallbackSubscriptionProductIds =
        getDefaultSubscriptionStoreProductIds(pack);

      return {
        ...pack,
        appleStoreProductId:
          mappedProducts?.appleStoreProductId ??
          fallbackSubscriptionProductIds?.appleStoreProductId ??
          fallbackStoreProductId ??
          "",
        googleStoreProductId:
          mappedProducts?.googleStoreProductId ??
          fallbackSubscriptionProductIds?.googleStoreProductId ??
          fallbackStoreProductId ??
          "",
      } satisfies CreditPack;
    });

    return {
      creditPacks:
        scope === "assignment"
          ? rowsWithStoreProducts.filter((pack) => pack.slug !== "jaarabonnement")
          : rowsWithStoreProducts,
      yearSubscriptionPack:
        scope === "assignment"
          ? rowsWithStoreProducts.find((pack) => pack.slug === "jaarabonnement") ??
            null
          : null,
    };
  } catch {
    return {
      creditPacks: [],
      yearSubscriptionPack: null,
    };
  }
}

export async function getAssignmentCreditShopData(): Promise<AssignmentCreditShopData> {
  return getCreditShopData("assignment");
}

export async function getAssignmentCreditPacks() {
  const data = await getAssignmentCreditShopData();
  return data.creditPacks;
}

export function formatMoney(
  amount: number,
  currency = "EUR",
  language: UiLanguage = "nl"
) {
  try {
    return new Intl.NumberFormat(resolveLanguageLocale(language), {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const baseLanguage = resolveBaseUiLanguage(language);
    const fallbackAmount =
      baseLanguage === "nl"
        ? amount.toFixed(2).replace(".", ",")
        : amount.toFixed(2);
    return `${currency} ${fallbackAmount}`;
  }
}

export function formatPackPrice(
  pack: CreditPack,
  language: UiLanguage = "nl"
) {
  return formatMoney(pack.price_cents / 100, pack.currency || "EUR", language);
}

export function formatCatalogPrice(
  item: CatalogItem,
  language: UiLanguage = "nl"
) {
  return formatMoney(item.price, "EUR", language);
}

export function getPackCount(pack: CreditPack) {
  return pack.credits_base + pack.bonus_credits;
}

export function isMostChosenPack(pack: CreditPack) {
  return pack.credit_scope === "assignment" && getPackCount(pack) === 100;
}

export function getPackUnitLabel(
  scope: CreditScope,
  amount: number,
  language: UiLanguage = "nl"
) {
  const baseLanguage = language === "en" || language === "de" ? language : "nl";
  if (scope === "book") {
    if (baseLanguage === "en") {
      return amount === 1 ? "book credit" : "book credits";
    }
    if (baseLanguage === "de") {
      return amount === 1 ? "Buch-Credit" : "Buch-Credits";
    }
    return amount === 1 ? "boekcredit" : "boekcredits";
  }

  if (scope === "game") {
    if (baseLanguage === "en") {
      return amount === 1 ? "game credit" : "game credits";
    }
    if (baseLanguage === "de") {
      return amount === 1 ? "Spiel-Credit" : "Spiel-Credits";
    }
    return amount === 1 ? "spelcredit" : "spelcredits";
  }

  if (scope === "referral") {
    if (baseLanguage === "en") {
      return amount === 1 ? "referral credit" : "referral credits";
    }
    if (baseLanguage === "de") {
      return amount === 1 ? "Verweis-Credit" : "Verweis-Credits";
    }
    return amount === 1 ? "verwijscredit" : "verwijscredits";
  }

  if (baseLanguage === "en") {
    return amount === 1 ? "assignment" : "assignments";
  }
  if (baseLanguage === "de") {
    return amount === 1 ? "Aufgabe" : "Aufgaben";
  }
  return amount === 1 ? "opdracht" : "opdrachten";
}

export function getPackDescription(
  pack: CreditPack,
  language: UiLanguage = "nl"
) {
  const baseLanguage = resolveBaseUiLanguage(language);
  const total = getPackCount(pack);

  if (pack.bonus_credits > 0) {
    if (baseLanguage === "en") {
      return `Use freely for ${total} assignments, including ${pack.bonus_credits} bonus credits.`;
    }
    if (baseLanguage === "de") {
      return `Frei nutzbar fur ${total} Aufgaben, einschliesslich ${pack.bonus_credits} Bonus-Credits.`;
    }
    return `Vrij te gebruiken voor ${total} opdrachten, inclusief ${pack.bonus_credits} bonuscredits.`;
  }

  if (total <= 10) {
    if (baseLanguage === "en") {
      return "Ideal for getting acquainted and unlocking a few individual assignments.";
    }
    if (baseLanguage === "de") {
      return "Ideal, um die App kennenzulernen und einzelne Aufgaben freizuschalten.";
    }
    return "Ideaal om kennis te maken en losse opdrachten vrij te spelen.";
  }

  if (total <= 50) {
    if (baseLanguage === "en") {
      return "Helpful if you want to open assignments regularly in the app.";
    }
    if (baseLanguage === "de") {
      return "Praktisch, wenn du regelmassig Aufgaben in der App offnen mochtest.";
    }
    return "Fijn als je regelmatig opdrachten wilt openen in de app.";
  }

  if (total <= 100) {
    if (baseLanguage === "en") {
      return "The best balance between quantity and price for regular use.";
    }
    if (baseLanguage === "de") {
      return "Die beste Balance zwischen Menge und Preis fur den regelmassigen Einsatz.";
    }
    return "De beste balans tussen hoeveelheid en prijs voor regelmatig gebruik.";
  }

  if (total <= 150) {
    if (baseLanguage === "en") {
      return "Useful if you work more intensively and want extra room available.";
    }
    if (baseLanguage === "de") {
      return "Praktisch, wenn du intensiver arbeitest und zusatzlichen Spielraum behalten mochtest.";
    }
    return "Handig als je intensiever werkt en extra ruimte achter de hand wilt houden.";
  }

  if (baseLanguage === "en") {
    return "Cost-effective if you want to buy ahead and always keep enough assignments available.";
  }
  if (baseLanguage === "de") {
    return "Preisgunstig, wenn du im Voraus einkaufen und immer genug Aufgaben verfugbar haben mochtest.";
  }
  return "Voordelig als je vooruit wilt inkopen en altijd voldoende opdrachten beschikbaar wilt hebben.";
}

export function getPackSupportLabel(
  pack: CreditPack,
  language: UiLanguage = "nl"
): ReactNode {
  const t = getPublicAppMessages(language).shopCatalog;
  if (isMostChosenPack(pack)) {
    return (
      <span className="rounded-full border border-[#d9a578] bg-[#fff3e7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a5a31]">
        {t.mostChosen}
      </span>
    );
  }

  if (pack.bonus_credits > 0) {
    return `+${pack.bonus_credits} ${t.bonusLabel}`;
  }

  const total = getPackCount(pack);
  if (total <= 10) return t.startPack;
  if (total <= 50) return t.basicPack;
  if (total <= 150) return t.plusPack;
  return t.valuePack;
}
export function getYearSubscriptionTitle(
  pack: CreditPack,
  language: UiLanguage = "nl"
) {
  const t = getPublicAppMessages(language).shopCatalog;
  const baseLanguage = resolveBaseUiLanguage(language);
  if (baseLanguage === "nl") {
    return pack.name?.trim() || t.yearSubscriptionTitleFallback;
  }
  return t.yearSubscriptionTitleFallback;
}

export function getYearSubscriptionDescription(language: UiLanguage = "nl") {
  return getPublicAppMessages(language).shopCatalog.yearSubscriptionDescription;
}

function getTherapistSubscriptionMonths(
  pack: TherapistSubscriptionPackOption
) {
  return pack.plan === "monthly" ? 1 : 12;
}

function getTherapistSubscriptionDurationLabel(
  pack: TherapistSubscriptionPackOption,
  language: UiLanguage = "nl"
) {
  const t = getPublicAppMessages(language).shopCatalog;
  return getTherapistSubscriptionMonths(pack) === 1
    ? t.monthSingular
    : t.monthPlural;
}

function getTherapistSubscriptionDescription(
  pack: TherapistSubscriptionPackOption,
  language: UiLanguage = "nl"
) {
  if (pack.plan === "monthly") {
    if (language === "en") {
      return "For therapists who first want to become visible in the therapist directory in an accessible way.";
    }
    if (language === "de") {
      return "Fur Therapeuten, die zuerst niedrigschwellig im Therapeutenverzeichnis sichtbar werden mochten.";
    }
    return "Voor therapeuten die eerst laagdrempelig zichtbaar willen worden in de therapeutenlijst.";
  }

  if (language === "en") {
    return "For therapists who want to keep their profile visible in the therapist directory for a longer period.";
  }
  if (language === "de") {
    return "Fur Therapeuten, die ihr Profil langfristig im Therapeutenverzeichnis sichtbar machen mochten.";
  }
  return "Voor therapeuten die hun profiel langdurig zichtbaar willen maken in de therapeutenlijst.";
}

function getTherapistSubscriptionSupportText(language: UiLanguage = "nl") {
  return getPublicAppMessages(language).shopCatalog.therapistSubscriptionSupportText;
}

function formatTherapistSubscriptionPrice(
  pack: TherapistSubscriptionPackOption,
  language: UiLanguage = "nl"
) {
  return formatMoney(pack.price_cents / 100, pack.currency || "EUR", language);
}

export function SectionHeader({
  icon: Icon,
  title,
  href,
  language = "nl",
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  language?: UiLanguage;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-4">
        <Icon size={28} strokeWidth={1.8} />
        <h2 className="font-serif text-[2.05rem] leading-none text-stone-950">
          {title}
        </h2>
        <Link
          href={href}
          className="ml-auto hidden items-center justify-end gap-1 text-right text-xs font-medium text-[#7f5b4a] sm:inline-flex"
        >
          {t.viewAllOptions}
          <ArrowRight size={14} strokeWidth={1.8} />
        </Link>
      </div>
    </div>
  );
}

export function SectionFooterLink({
  href,
  language = "nl",
}: {
  href: string;
  language?: UiLanguage;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  return (
    <div className="flex w-full justify-end sm:hidden">
      <Link
        href={href}
        className="ml-auto inline-flex items-center justify-end gap-1 text-right text-sm text-[#7f5b4a]"
      >
        {t.viewAllOptions}
        <ArrowRight size={16} strokeWidth={1.8} />
      </Link>
    </div>
  );
}

function Artwork({
  item,
  language = "nl",
}: {
  item: CatalogItem;
  language?: UiLanguage;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  if (item.imageUrl) {
    return (
      <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-white">
        <Image
          src={item.imageUrl}
          alt={item.imageAlt || item.title}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 45vw, 240px"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[linear-gradient(180deg,#f8f6f0_0%,#ffffff_100%)] p-2">
      <div className="rounded-[1rem] border border-dashed border-[#d8ccbe] bg-white/90 px-2 py-4 text-center shadow-sm">
        <ImageIcon
          className="mx-auto text-[#806250]"
          size={22}
          strokeWidth={1.8}
        />
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a5c4d]">
          {t.noImageLinked}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={`digital-sheet-${index}`}
            className="block h-8 rounded-[0.45rem] border border-[#eadfce] bg-[#f6efe7]"
          />
        ))}
      </div>
    </div>
  );
}

export function ProductPreviewCard({
  item,
  language = "nl",
}: {
  item: CatalogItem;
  language?: UiLanguage;
}) {
  const isInDevelopment = isCatalogItemInDevelopment(item);
  const content = (
    <article className="space-y-2">
      <div
        className={`relative aspect-[0.86] rounded-[1.35rem] border border-[#e4d7c8] bg-white p-2 shadow-[0_12px_24px_rgba(53,37,26,0.07)] transition ${
          isInDevelopment
            ? "opacity-80"
            : "group-hover:shadow-[0_16px_28px_rgba(53,37,26,0.12)]"
        }`}
      >
        <Artwork item={item} language={language} />
        {isInDevelopment ? (
          <div className="absolute inset-x-2 top-2 rounded-full border border-[#ead6c6] bg-white/95 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a5f49]">
            {item.developmentStateLabel}
          </div>
        ) : null}
      </div>
      <div className="min-h-[2.5rem] text-center text-[12px] font-semibold leading-5 text-stone-950">
        {item.title}
      </div>
      <div className="text-center text-sm font-medium text-stone-900">
        {isInDevelopment
          ? item.unavailablePriceLabel
          : formatCatalogPrice(item, language)}
      </div>
    </article>
  );

  return (
    <Link
      href={getCatalogItemPath(item)}
      className="group block transition hover:-translate-y-0.5"
    >
      {content}
    </Link>
  );
}

export function ProductDetailCard({
  item,
  language = "nl",
}: {
  item: CatalogItem;
  language?: UiLanguage;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  const isInDevelopment = isCatalogItemInDevelopment(item);

  return (
    <article className="grid grid-cols-[92px_1fr] gap-3 rounded-[1.4rem] border border-[#eadfce] bg-white/90 p-3">
      <div className="relative aspect-[0.82] rounded-[1rem] border border-[#eadfce] bg-white p-1.5">
        <Artwork item={item} language={language} />
        {isInDevelopment ? (
          <div className="absolute inset-x-1.5 top-1.5 rounded-full border border-[#ead6c6] bg-white/95 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a5f49]">
            {item.developmentStateLabel}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
              {item.format}
            </div>
            <h4 className="text-sm font-semibold text-stone-950">
              {item.title}
            </h4>
          </div>
          <span className="shrink-0 rounded-full border border-[#ead6c6] bg-[#fcf6f1] px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
            {isInDevelopment
              ? item.developmentStateLabel
              : formatCatalogPrice(item, language)}
          </span>
        </div>
        <p className="text-xs leading-5 text-[#6f6154]">{item.description}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={getCatalogItemPath(item)}
            className="inline-flex items-center gap-1 rounded-full border border-[#decfbe] bg-[#fcf6f1] px-3 py-1.5 text-xs font-medium text-[#8a5f49] transition hover:bg-white"
          >
            {t.productMoreInfo}
            <ArrowRight size={14} strokeWidth={1.8} />
          </Link>
          {isInDevelopment ? (
            <div className="inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-3 py-1.5 text-xs font-medium text-[#8a5f49]">
              {item.developmentCalloutLabel}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProductInfoHero({
  item,
  language = "nl",
}: {
  item: CatalogItem;
  language?: UiLanguage;
}) {
  const isInDevelopment = isCatalogItemInDevelopment(item);

  return (
    <article className="rounded-[1.7rem] border border-[#e5d8ca] bg-[linear-gradient(180deg,#fffaf6_0%,#f8f1e8_100%)] p-5 shadow-[0_18px_36px_rgba(59,40,28,0.07)]">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="relative aspect-[0.82] rounded-[1.2rem] border border-[#eadfce] bg-white p-2">
          <Artwork item={item} language={language} />
          {isInDevelopment ? (
            <div className="absolute inset-x-2 top-2 rounded-full border border-[#ead6c6] bg-white/95 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a5f49]">
              {item.developmentStateLabel}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <h2 className="font-serif text-[2rem] leading-none text-stone-950">
              {item.title}
            </h2>
            <p className="text-sm leading-6 text-[#6b5d50]">{item.description}</p>
          </div>

          <div className="inline-flex rounded-full border border-[#ead6c6] bg-[#fcf6f1] px-3 py-1.5 text-sm font-medium text-[#8a5f49]">
            {isInDevelopment
              ? item.developmentStateLabel
              : formatCatalogPrice(item, language)}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductPurchaseCard({
  item,
  showTitle = true,
  className = "",
}: {
  item: CatalogItem;
  showTitle?: boolean;
  className?: string;
}) {
  const isInDevelopment = isCatalogItemInDevelopment(item);

  return (
    <article
      className={`rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm ${className}`.trim()}
    >
      {showTitle ? (
        <h3 className="font-serif text-[1.45rem] leading-none text-stone-950">
          {item.purchaseTitle}
        </h3>
      ) : null}
      <p
        className={`${showTitle ? "mt-3 " : ""}text-sm leading-6 text-[#6b5d50]`}
      >
        {isInDevelopment
          ? item.developmentPurchaseText
          : item.purchaseDescription}
      </p>
      <div className="mt-4">
        {item.href && !isInDevelopment ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
          >
            {item.purchaseButtonLabel}
            <ExternalLink size={16} strokeWidth={1.8} />
          </a>
        ) : (
          <div className="inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]">
            {item.developmentCalloutLabel}
          </div>
        )}
      </div>
    </article>
  );
}

export function CreditPreviewCard({
  pack,
  isLoggedIn = false,
  language = "nl",
  purchaseMode = "disabled",
}: {
  pack: CreditPack;
  isLoggedIn?: boolean;
  language?: UiLanguage;
  purchaseMode?: CreditPackPurchaseMode;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  const total = getPackCount(pack);
  const isMostChosen = isMostChosenPack(pack);
  const cardClassName = "block transition hover:-translate-y-0.5";
  const content = (
    <article
      className={`relative aspect-square rounded-[1.35rem] px-3 py-4 text-center shadow-[0_14px_26px_rgba(57,41,28,0.08)] ${
        isMostChosen
          ? "border border-[#c2875d] bg-[linear-gradient(180deg,#fff2e3_0%,#f3dfcb_100%)]"
          : "border border-[#e5d8ca] bg-[linear-gradient(180deg,#efede7_0%,#e4dfd9_100%)]"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b6e61]">
        {t.assignmentPack}
      </div>
      <div className="mt-3 text-[2rem] font-semibold leading-none text-stone-950">
        {total}
      </div>
      <div className="mt-1 text-[12px] font-medium text-stone-800">
        {getPackUnitLabel(pack.credit_scope, total, language)}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b6e61]">
        {pack.name}
      </div>
      <div className="mt-2 text-base font-semibold text-stone-950">
        {formatPackPrice(pack, language)}
      </div>
      <div className={`mt-2 ${isMostChosen ? "" : "text-[11px] text-[#8d5c44]"}`}>
        {getPackSupportLabel(pack, language)}
      </div>
    </article>
  );

  if (purchaseMode === "native_store") {
    return (
      <NativeCreditPackPurchaseSurface
        appleStoreProductId={pack.appleStoreProductId ?? ""}
        className={cardClassName}
        googleStoreProductId={pack.googleStoreProductId ?? ""}
        isLoggedIn={isLoggedIn}
        language={language}
        loginHref="/login?next=%2Fshop"
      >
        {content}
      </NativeCreditPackPurchaseSurface>
    );
  }

  return (
    <Link
      href="/shop/credits"
      className={cardClassName}
    >
      {content}
    </Link>
  );
}

export function CreditPackDetailCard({
  pack,
  isLoggedIn = false,
  language = "nl",
  purchaseMode = "disabled",
}: {
  pack: CreditPack;
  isLoggedIn?: boolean;
  language?: UiLanguage;
  purchaseMode?: CreditPackPurchaseMode;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  const total = getPackCount(pack);
  const isMostChosen = isMostChosenPack(pack);
  const cardClassName =
    "rounded-[1.5rem] border border-[#e5d8ca] bg-[linear-gradient(135deg,#f7f1ea_0%,#efe6db_52%,#fcf8f4_100%)] p-4 shadow-[0_16px_30px_rgba(57,41,28,0.08)]";
  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6e61]">
            {t.assignmentPack}
          </div>
          <h4 className="mt-2 font-serif text-[1.8rem] leading-none text-stone-950">
            {pack.name}
          </h4>
        </div>
        <span className="shrink-0 rounded-full border border-[#ead6c6] bg-white/90 px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
          {formatPackPrice(pack, language)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[96px_1fr] gap-3">
        <div
          className={`rounded-[1.1rem] px-2 py-3 text-center ${
            isMostChosen
              ? "bg-[linear-gradient(180deg,#fff2e3_0%,#f3dfcb_100%)]"
              : "bg-white/75"
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d6e63]">
            {t.assignmentPack}
          </div>
          <div className="mt-2 text-xl font-semibold leading-none text-stone-950">
            {total}
          </div>
          <div className="mt-1 text-[11px] text-stone-600">
            {getPackUnitLabel(pack.credit_scope, total, language)}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isMostChosen ? (
              getPackSupportLabel(pack, language)
            ) : (
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
                {getPackSupportLabel(pack, language)}
              </div>
            )}
          </div>
          <p className="text-xs leading-5 text-[#6f6154]">
            {getPackDescription(pack, language)}
          </p>
        </div>
      </div>
    </>
  );

  if (purchaseMode === "native_store") {
    return (
      <NativeCreditPackPurchaseSurface
        appleStoreProductId={pack.appleStoreProductId ?? ""}
        className={cardClassName}
        googleStoreProductId={pack.googleStoreProductId ?? ""}
        isLoggedIn={isLoggedIn}
        language={language}
        loginHref="/login?next=%2Fshop%2Fcredits"
      >
        {cardContent}
      </NativeCreditPackPurchaseSurface>
    );
  }

  return <article className={cardClassName}>{cardContent}</article>;
}

export function YearSubscriptionPreviewCard({
  pack,
  isLoggedIn = false,
  language = "nl",
  purchaseMode = "disabled",
}: {
  pack: CreditPack;
  isLoggedIn?: boolean;
  language?: UiLanguage;
  purchaseMode?: CreditPackPurchaseMode;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  const cardClassName = "block transition hover:-translate-y-0.5";
  const content = (
    <article className="rounded-[1.45rem] border border-[#e5d8ca] bg-[linear-gradient(135deg,#f5eee6_0%,#efe3d4_52%,#f8f3ed_100%)] p-4 shadow-[0_16px_30px_rgba(57,41,28,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6e61]">
            {t.yearSubscriptionBadge}
          </div>
          <h3 className="mt-2 font-serif text-2xl leading-none text-stone-950">
            {t.yearSubscriptionShortTitle}
          </h3>
          <p className="mt-2 text-sm font-medium text-stone-900">
            {t.yearSubscriptionAccessLabel}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#ead6c6] bg-white/90 px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
          {formatPackPrice(pack, language)}
        </span>
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
        {getYearSubscriptionTitle(pack, language)}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#6f6154]">
        {getYearSubscriptionDescription(language)}
      </p>
    </article>
  );

  if (purchaseMode === "native_store") {
    return (
      <NativeSubscriptionPurchaseSurface
        appleStoreProductId={pack.appleStoreProductId ?? ""}
        className={cardClassName}
        googleStoreProductId={pack.googleStoreProductId ?? ""}
        isLoggedIn={isLoggedIn}
        language={language}
        loginHref="/login?next=%2Fshop"
      >
        {content}
      </NativeSubscriptionPurchaseSurface>
    );
  }

  return (
    <Link
      href="/shop/credits"
      className={cardClassName}
    >
      {content}
    </Link>
  );
}

export function YearSubscriptionDetailCard({
  pack,
  isLoggedIn = false,
  language = "nl",
  purchaseMode = "disabled",
}: {
  pack: CreditPack;
  isLoggedIn?: boolean;
  language?: UiLanguage;
  purchaseMode?: CreditPackPurchaseMode;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  const cardClassName =
    "rounded-[1.5rem] border border-[#e5d8ca] bg-[linear-gradient(135deg,#f5eee6_0%,#efe3d4_52%,#f8f3ed_100%)] p-4 shadow-[0_16px_30px_rgba(57,41,28,0.08)]";
  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6e61]">
            {t.yearSubscriptionBadge}
          </div>
          <h4 className="mt-2 font-serif text-[1.8rem] leading-none text-stone-950">
            {getYearSubscriptionTitle(pack, language)}
          </h4>
        </div>
        <span className="shrink-0 rounded-full border border-[#ead6c6] bg-white/90 px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
          {formatPackPrice(pack, language)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[96px_1fr] gap-3">
        <div className="rounded-[1.1rem] bg-white/75 px-2 py-3 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d6e63]">
            {t.durationLabel}
          </div>
          <div className="mt-2 text-xl font-semibold leading-none text-stone-950">
            12
          </div>
          <div className="mt-1 text-[11px] text-stone-600">{t.monthPlural}</div>
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
            {t.fullAccessLabel}
          </div>
          <p className="text-xs leading-5 text-[#6f6154]">
            {getYearSubscriptionDescription(language)}
          </p>
        </div>
      </div>
    </>
  );

  if (purchaseMode === "native_store") {
    return (
      <NativeSubscriptionPurchaseSurface
        appleStoreProductId={pack.appleStoreProductId ?? ""}
        className={cardClassName}
        googleStoreProductId={pack.googleStoreProductId ?? ""}
        isLoggedIn={isLoggedIn}
        language={language}
        loginHref="/login?next=%2Fshop%2Fcredits"
      >
        {cardContent}
      </NativeSubscriptionPurchaseSurface>
    );
  }

  return <article className={cardClassName}>{cardContent}</article>;
}

export function TherapistSubscriptionPreviewCard({
  pack,
  isLoggedIn = false,
  language = "nl",
  purchaseMode = "disabled",
}: {
  pack: TherapistSubscriptionPackOption;
  isLoggedIn?: boolean;
  language?: UiLanguage;
  purchaseMode?: CreditPackPurchaseMode;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  const months = getTherapistSubscriptionMonths(pack);
  const cardClassName = "block transition hover:-translate-y-0.5";
  const content = (
    <article className="rounded-[1.45rem] border border-[#e5d8ca] bg-[linear-gradient(135deg,#f7f1ea_0%,#efe6db_52%,#fcf8f4_100%)] p-4 shadow-[0_16px_30px_rgba(57,41,28,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6e61]">
            {t.therapistDirectory}
          </div>
          <h3 className="mt-2 font-serif text-2xl leading-none text-stone-950">
            {months} {getTherapistSubscriptionDurationLabel(pack, language)}
          </h3>
          <p className="mt-2 text-sm font-medium text-stone-900">
            {t.profileVisible}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#ead6c6] bg-white/90 px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
          {formatTherapistSubscriptionPrice(pack, language)}
        </span>
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
        {t.therapistSubscriptionBadge}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#6f6154]">
        {getTherapistSubscriptionDescription(pack, language)}
      </p>
    </article>
  );

  if (purchaseMode === "native_store") {
    return (
      <NativeSubscriptionPurchaseSurface
        appleStoreProductId={pack.appleStoreProductId}
        className={cardClassName}
        googleStoreProductId={pack.googleStoreProductId}
        isLoggedIn={isLoggedIn}
        language={language}
        loginHref="/login?next=%2Fshop%23therapeut-abonnement"
      >
        {content}
      </NativeSubscriptionPurchaseSurface>
    );
  }

  return (
    <Link
      href="/shop/credits#therapeut-abonnement"
      className={cardClassName}
    >
      {content}
    </Link>
  );
}

export function TherapistSubscriptionDetailCard({
  pack,
  isLoggedIn = false,
  language = "nl",
  purchaseMode = "disabled",
}: {
  pack: TherapistSubscriptionPackOption;
  isLoggedIn?: boolean;
  language?: UiLanguage;
  purchaseMode?: CreditPackPurchaseMode;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  const months = getTherapistSubscriptionMonths(pack);
  const cardClassName =
    "rounded-[1.5rem] border border-[#e5d8ca] bg-[linear-gradient(135deg,#f7f1ea_0%,#efe6db_52%,#fcf8f4_100%)] p-4 shadow-[0_16px_30px_rgba(57,41,28,0.08)]";
  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6e61]">
            {t.therapistSubscriptionBadge}
          </div>
          <h4 className="mt-2 font-serif text-[1.8rem] leading-none text-stone-950">
            {months} {getTherapistSubscriptionDurationLabel(pack, language)}
          </h4>
        </div>
        <span className="shrink-0 rounded-full border border-[#ead6c6] bg-white/90 px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
          {formatTherapistSubscriptionPrice(pack, language)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[96px_1fr] gap-3">
        <div className="rounded-[1.1rem] bg-white/75 px-2 py-3 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d6e63]">
            {t.durationLabel}
          </div>
          <div className="mt-2 text-xl font-semibold leading-none text-stone-950">
            {months}
          </div>
          <div className="mt-1 text-[11px] text-stone-600">
            {getTherapistSubscriptionDurationLabel(pack, language)}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
            {t.therapistDirectory}
          </div>
          <p className="text-xs leading-5 text-[#6f6154]">
            {getTherapistSubscriptionDescription(pack, language)}
          </p>
          <p className="text-xs leading-5 text-[#6f6154]">
            {getTherapistSubscriptionSupportText(language)}
          </p>
        </div>
      </div>
    </>
  );

  if (purchaseMode === "native_store") {
    return (
      <NativeSubscriptionPurchaseSurface
        appleStoreProductId={pack.appleStoreProductId}
        className={cardClassName}
        googleStoreProductId={pack.googleStoreProductId}
        isLoggedIn={isLoggedIn}
        language={language}
        loginHref="/login?next=%2Fshop%2Fcredits%23therapeut-abonnement"
      >
        {cardContent}
      </NativeSubscriptionPurchaseSurface>
    );
  }

  return <article className={cardClassName}>{cardContent}</article>;
}

export function DetailList({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-[#6f5949]">
        <Icon size={17} strokeWidth={1.8} />
        <h3 className="font-serif text-[1.55rem] leading-none text-stone-950">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

export function AssignmentCreditsEmptyState({
  compact = false,
  title,
  description,
  language = "nl",
}: {
  compact?: boolean;
  title?: string;
  description?: string;
  language?: UiLanguage;
}) {
  const t = getPublicAppMessages(language).shopCatalog;
  return (
    <article
      className={`rounded-[1.5rem] border border-[#e5d8ca] bg-white/80 p-4 shadow-sm ${
        compact ? "" : "shadow-[0_18px_30px_rgba(59,40,28,0.06)]"
      }`}
    >
      <h3 className="text-base font-semibold text-stone-900">
        {title ?? t.noAssignmentPacksTitle}
      </h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        {description ?? t.noAssignmentPacksDescription}
      </p>
    </article>
  );
}
