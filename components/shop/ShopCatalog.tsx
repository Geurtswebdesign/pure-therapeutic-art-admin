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
import { isTherapistSubscriptionPackSlug } from "@/lib/users/entitlements";
import {
  getCatalogItemPath,
  isCatalogItemInDevelopment,
  type CatalogItem,
} from "@/lib/shop/catalog";
import type { UiLanguage } from "@/lib/i18n/runtime";
import NativeCreditPackPurchaseButton from "@/components/shop/NativeCreditPackPurchaseButton";

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

      return {
        ...pack,
        appleStoreProductId:
          mappedProducts?.appleStoreProductId ?? fallbackStoreProductId ?? "",
        googleStoreProductId:
          mappedProducts?.googleStoreProductId ?? fallbackStoreProductId ?? "",
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

export function formatMoney(amount: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `EUR ${amount.toFixed(2).replace(".", ",")}`;
  }
}

export function formatPackPrice(pack: CreditPack) {
  return formatMoney(pack.price_cents / 100, pack.currency || "EUR");
}

export function formatCatalogPrice(item: CatalogItem) {
  return formatMoney(item.price, "EUR");
}

export function getPackCount(pack: CreditPack) {
  return pack.credits_base + pack.bonus_credits;
}

export function isMostChosenPack(pack: CreditPack) {
  return pack.credit_scope === "assignment" && getPackCount(pack) === 100;
}

export function getPackUnitLabel(scope: CreditScope, amount: number) {
  if (scope === "book") {
    return amount === 1 ? "boekcredit" : "boekcredits";
  }

  if (scope === "game") {
    return amount === 1 ? "spelcredit" : "spelcredits";
  }

  if (scope === "referral") {
    return amount === 1 ? "referral" : "referrals";
  }

  return amount === 1 ? "opdracht" : "opdrachten";
}

export function getPackDescription(pack: CreditPack) {
  const total = getPackCount(pack);

  if (pack.bonus_credits > 0) {
    return `Vrij te gebruiken voor ${total} opdrachten, inclusief ${pack.bonus_credits} bonuscredits.`;
  }

  if (total <= 10) {
    return "Ideaal om kennis te maken en losse opdrachten vrij te spelen.";
  }

  if (total <= 50) {
    return "Fijn als je regelmatig opdrachten wilt openen in de app.";
  }

  if (total <= 100) {
    return "De beste balans tussen hoeveelheid en prijs voor regelmatig gebruik.";
  }

  if (total <= 150) {
    return "Handig als je intensiever werkt en extra ruimte achter de hand wilt houden.";
  }

  return "Voordelig als je vooruit wilt inkopen en altijd voldoende opdrachten beschikbaar wilt hebben.";
}

export function getPackSupportLabel(pack: CreditPack): ReactNode {
  if (isMostChosenPack(pack)) {
    return (
      <span className="rounded-full border border-[#d9a578] bg-[#fff3e7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a5a31]">
        Meest gekozen
      </span>
    );
  }

  if (pack.bonus_credits > 0) {
    return `+${pack.bonus_credits} bonus`;
  }
}
export function getYearSubscriptionTitle(pack: CreditPack) {
  return pack.name?.trim() || "Jaarabonnement";
}

export function getYearSubscriptionDescription() {
  return "12 maanden toegang tot alle opdrachten in de app. Tijdens een actief abonnement heb je geen losse opdrachtcredits nodig.";
}

export function SectionHeader({
  icon: Icon,
  title,
  href,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
}) {
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
          Bekijk alle opties
          <ArrowRight size={14} strokeWidth={1.8} />
        </Link>
      </div>
    </div>
  );
}

export function SectionFooterLink({ href }: { href: string }) {
  return (
    <div className="flex w-full justify-end sm:hidden">
      <Link
        href={href}
        className="ml-auto inline-flex items-center justify-end gap-1 text-right text-sm text-[#7f5b4a]"
      >
        Bekijk alle opties
        <ArrowRight size={16} strokeWidth={1.8} />
      </Link>
    </div>
  );
}

function Artwork({ item }: { item: CatalogItem }) {
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
          Geen afbeelding gekoppeld
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

export function ProductPreviewCard({ item }: { item: CatalogItem }) {
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
        <Artwork item={item} />
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
        {isInDevelopment ? item.unavailablePriceLabel : formatCatalogPrice(item)}
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

export function ProductDetailCard({ item }: { item: CatalogItem }) {
  const isInDevelopment = isCatalogItemInDevelopment(item);

  return (
    <article className="grid grid-cols-[92px_1fr] gap-3 rounded-[1.4rem] border border-[#eadfce] bg-white/90 p-3">
      <div className="relative aspect-[0.82] rounded-[1rem] border border-[#eadfce] bg-white p-1.5">
        <Artwork item={item} />
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
            {isInDevelopment ? item.developmentStateLabel : formatCatalogPrice(item)}
          </span>
        </div>
        <p className="text-xs leading-5 text-[#6f6154]">{item.description}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={getCatalogItemPath(item)}
            className="inline-flex items-center gap-1 rounded-full border border-[#decfbe] bg-[#fcf6f1] px-3 py-1.5 text-xs font-medium text-[#8a5f49] transition hover:bg-white"
          >
            Meer info
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

export function ProductInfoHero({ item }: { item: CatalogItem }) {
  const isInDevelopment = isCatalogItemInDevelopment(item);

  return (
    <article className="rounded-[1.7rem] border border-[#e5d8ca] bg-[linear-gradient(180deg,#fffaf6_0%,#f8f1e8_100%)] p-5 shadow-[0_18px_36px_rgba(59,40,28,0.07)]">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="relative aspect-[0.82] rounded-[1.2rem] border border-[#eadfce] bg-white p-2">
          <Artwork item={item} />
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
            {isInDevelopment ? item.developmentStateLabel : formatCatalogPrice(item)}
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

export function CreditPreviewCard({ pack }: { pack: CreditPack }) {
  const total = getPackCount(pack);
  const isMostChosen = isMostChosenPack(pack);

  return (
    <article
      className={`relative aspect-square rounded-[1.35rem] px-3 py-4 text-center shadow-[0_14px_26px_rgba(57,41,28,0.08)] ${
        isMostChosen
          ? "border border-[#c2875d] bg-[linear-gradient(180deg,#fff2e3_0%,#f3dfcb_100%)]"
          : "border border-[#e5d8ca] bg-[linear-gradient(180deg,#efede7_0%,#e4dfd9_100%)]"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b6e61]">
        Opdracht pakket
      </div>
      <div className="mt-3 text-[2rem] font-semibold leading-none text-stone-950">
        {total}
      </div>
      <div className="mt-1 text-[12px] font-medium text-stone-800">
        {getPackUnitLabel(pack.credit_scope, total)}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b6e61]">
        {pack.name}
      </div>
      <div className="mt-2 text-base font-semibold text-stone-950">
        {formatPackPrice(pack)}
      </div>
      <div className={`mt-2 ${isMostChosen ? "" : "text-[11px] text-[#8d5c44]"}`}>
        {getPackSupportLabel(pack)}
      </div>
    </article>
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
  const total = getPackCount(pack);
  const isMostChosen = isMostChosenPack(pack);

  return (
    <article className="grid grid-cols-[92px_1fr] gap-3 rounded-[1.4rem] border border-[#eadfce] bg-white/90 p-3">
      <div
        className={`rounded-[1.1rem] px-2 py-3 text-center ${
          isMostChosen
            ? "bg-[linear-gradient(180deg,#fff2e3_0%,#f3dfcb_100%)]"
            : "bg-[linear-gradient(180deg,#ede8e1_0%,#dfd8ce_100%)]"
        }`}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d6e63]">
          {pack.name}
        </div>
        <div className="mt-2 text-xl font-semibold leading-none text-stone-950">
          {total}
        </div>
        <div className="mt-1 text-[11px] text-stone-600">
          {getPackUnitLabel(pack.credit_scope, total)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isMostChosen ? (
                getPackSupportLabel(pack)
              ) : (
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
                  {getPackSupportLabel(pack)}
                </div>
              )}
            </div>
            <h4 className="text-sm font-semibold text-stone-950">
              {pack.name}
            </h4>
            <p className="text-xs leading-5 text-[#6f6154]">
              {getPackDescription(pack)}
            </p>
            {purchaseMode === "native_store" ? (
              <div className="mt-3">
                <NativeCreditPackPurchaseButton
                  appleStoreProductId={pack.appleStoreProductId ?? ""}
                  googleStoreProductId={pack.googleStoreProductId ?? ""}
                  isLoggedIn={isLoggedIn}
                  language={language}
                />
              </div>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full border border-[#ead6c6] bg-[#fcf6f1] px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
            {formatPackPrice(pack)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function YearSubscriptionPreviewCard({ pack }: { pack: CreditPack }) {
  return (
    <article className="rounded-[1.45rem] border border-[#e5d8ca] bg-[linear-gradient(135deg,#f5eee6_0%,#efe3d4_52%,#f8f3ed_100%)] p-4 shadow-[0_16px_30px_rgba(57,41,28,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6e61]">
            Abonnement
          </div>
          <h3 className="mt-2 font-serif text-2xl leading-none text-stone-950">
            12 maanden
          </h3>
          <p className="mt-2 text-sm font-medium text-stone-900">
            Toegang tot alle opdrachten
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#ead6c6] bg-white/90 px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
          {formatPackPrice(pack)}
        </span>
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
        {getYearSubscriptionTitle(pack)}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#6f6154]">
        {getYearSubscriptionDescription()}
      </p>
    </article>
  );
}

export function YearSubscriptionDetailCard({ pack }: { pack: CreditPack }) {
  return (
    <article className="rounded-[1.5rem] border border-[#e5d8ca] bg-[linear-gradient(135deg,#f5eee6_0%,#efe3d4_52%,#f8f3ed_100%)] p-4 shadow-[0_16px_30px_rgba(57,41,28,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6e61]">
            Jaarabonnement
          </div>
          <h4 className="mt-2 font-serif text-[1.8rem] leading-none text-stone-950">
            {getYearSubscriptionTitle(pack)}
          </h4>
        </div>
        <span className="shrink-0 rounded-full border border-[#ead6c6] bg-white/90 px-2.5 py-1 text-xs font-medium text-[#8a5f49]">
          {formatPackPrice(pack)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[96px_1fr] gap-3">
        <div className="rounded-[1.1rem] bg-white/75 px-2 py-3 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d6e63]">
            Duur
          </div>
          <div className="mt-2 text-xl font-semibold leading-none text-stone-950">
            12
          </div>
          <div className="mt-1 text-[11px] text-stone-600">maanden</div>
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
            Volledige toegang
          </div>
          <p className="text-xs leading-5 text-[#6f6154]">
            {getYearSubscriptionDescription()}
          </p>
        </div>
      </div>
    </article>
  );
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
  title = "Nog geen opdrachtpakketten actief",
  description = "Activeer eerst een of meer assignment credit packs of het jaarabonnement in de administratie. Dan verschijnen ze automatisch hier.",
}: {
  compact?: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border border-[#e5d8ca] bg-white/80 p-4 shadow-sm ${
        compact ? "" : "shadow-[0_18px_30px_rgba(59,40,28,0.06)]"
      }`}
    >
      <h3 className="text-base font-semibold text-stone-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        {description}
      </p>
    </article>
  );
}
