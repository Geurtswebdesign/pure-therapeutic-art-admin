import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Download, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTherapistSubscriptionPackSlug } from "@/lib/users/entitlements";
import {
  getCatalogItemPath,
  isCatalogItemInDevelopment,
  type CatalogItem,
} from "@/lib/shop/catalog";

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
};

type AssignmentCreditShopData = {
  creditPacks: CreditPack[];
  yearSubscriptionPack: CreditPack | null;
};

export async function getAssignmentCreditShopData(): Promise<AssignmentCreditShopData> {
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
      if (pack.credit_scope !== "assignment") return false;
      if (isTherapistSubscriptionPackSlug(pack.slug)) return false;
      return true;
    });

    return {
      creditPacks: rows.filter((pack) => pack.slug !== "jaarabonnement"),
      yearSubscriptionPack:
        rows.find((pack) => pack.slug === "jaarabonnement") ?? null,
    };
  } catch {
    return {
      creditPacks: [],
      yearSubscriptionPack: null,
    };
  }
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

  if (total <= 5) {
    return "Geschikt om een paar losse opdrachten vrij te spelen.";
  }

  if (total <= 10) {
    return "Handig als je regelmatig opdrachten wilt openen in de app.";
  }

  return "Fijn voor intensiever gebruik of als je vooruit wilt inkopen.";
}

export function getPackSupportLabel(pack: CreditPack) {
  if (pack.bonus_credits > 0) {
    return `+${pack.bonus_credits} bonus`;
  }

  const total = getPackCount(pack);
  if (total <= 5) return "Klein pakket";
  if (total <= 10) return "Middel pakket";
  return "Groot pakket";
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

  if (item.palette === "rain") {
    const drops = [
      "#4db6d0",
      "#f2b95f",
      "#d9705d",
      "#87a677",
      "#6d87c9",
      "#d483bc",
      "#ebb24a",
      "#50b4a6",
    ];

    return (
      <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[linear-gradient(180deg,#bfe7f4_0%,#dff4ff_100%)] p-2">
        <div className="rounded-full bg-[#5969a2] px-2 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
          {item.title}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-x-1 gap-y-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={`drop-${index}`}
              className="mx-auto block h-7 w-4 rounded-full"
              style={{
                backgroundColor: drops[index % drops.length],
                transform: `rotate(${index % 2 === 0 ? -18 : 16}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (item.palette === "hearts") {
    const blocks = [
      "#f4cc59",
      "#f4cc59",
      "#f0f1f5",
      "#f0f1f5",
      "#8ea2d8",
      "#5d5464",
      "#77ac97",
      "#e4c56f",
      "#f0f1f5",
      "#5b5c71",
      "#8ea2d8",
      "#f0f1f5",
    ];

    return (
      <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[linear-gradient(180deg,#d9dadc_0%,#f0efef_100%)] p-2">
        <div className="rounded-full bg-white/90 px-2 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-700">
          {item.title}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {blocks.map((color, index) => (
            <span
              key={`heart-${index}`}
              className="block aspect-square rounded-[0.45rem] border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (item.palette === "moods") {
    const blocks = [
      "#7cb14e",
      "#6e5db9",
      "#f3d44d",
      "#f39453",
      "#4f90dd",
      "#e45858",
      "#8f7bd8",
      "#72c59a",
      "#f0d9a4",
    ];

    return (
      <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[linear-gradient(180deg,#cfc4f4_0%,#efe9ff_100%)] p-2">
        <div className="rounded-full bg-[#8d7fd2] px-2 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
          {item.title}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {blocks.map((color, index) => (
            <span
              key={`mood-${index}`}
              className="block aspect-square rounded-[0.5rem] border border-white/70"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (item.palette === "cards") {
    return (
      <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[linear-gradient(180deg,#f6efe9_0%,#fff7f3_100%)] p-2">
        <div className="mx-auto h-7 w-24 rounded-md border border-[#de5f54] bg-white shadow-sm" />
        <div className="mt-3 flex items-end justify-center gap-1">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={`card-stack-${index}`}
              className="block h-10 w-7 rounded-[0.45rem] border border-[#d9c7b4] bg-white"
              style={{
                transform: `rotate(${(index - 1.5) * 8}deg) translateY(${
                  index % 2 === 0 ? 0 : 2
                }px)`,
              }}
            />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {["#f3b360", "#8dbd9a", "#7b93d9", "#e5858d"].map((color, index) => (
            <span
              key={`card-pill-${index}`}
              className="block h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (item.palette === "board") {
    return (
      <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[linear-gradient(180deg,#d8e4fb_0%,#eef5ff_100%)] p-2">
        <div className="rounded-[0.85rem] bg-[linear-gradient(180deg,#316fc8_0%,#1a4e99_100%)] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_24px_rgba(49,111,200,0.28)]">
          {item.title}
        </div>
        <div className="mt-2 flex justify-center gap-1">
          {[0, 1, 2].map((index) => (
            <span
              key={`board-card-${index}`}
              className="block h-8 w-6 rounded-[0.45rem] border border-[#bad0ef] bg-white"
              style={{
                transform: `rotate(${(index - 1) * 10}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[linear-gradient(180deg,#f8f6f0_0%,#ffffff_100%)] p-2">
      <div className="rounded-[1rem] border border-dashed border-[#d8ccbe] bg-white/90 px-2 py-3 text-center shadow-sm">
        <Download
          className="mx-auto text-[#806250]"
          size={22}
          strokeWidth={1.8}
        />
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a5c4d]">
          Digitale exemplaar
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
      <div className="text-center text-[11px] font-semibold tracking-[0.02em] text-stone-800">
        {item.tag}
      </div>
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
            In ontwikkeling
          </div>
        ) : null}
      </div>
      <div className="min-h-[2.5rem] text-center text-[12px] font-semibold leading-5 text-stone-950">
        {item.title}
      </div>
      <div className="text-center text-sm font-medium text-stone-900">
        {isInDevelopment ? "Nog niet beschikbaar" : formatCatalogPrice(item)}
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
            In ontwikkeling
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
            {isInDevelopment ? "In ontwikkeling" : formatCatalogPrice(item)}
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
              Digitale versie is in ontwikkeling
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
              In ontwikkeling
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#ead6c6] bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a5f49]">
              {item.format}
            </span>
            <span className="rounded-full border border-[#ead6c6] bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a5f49]">
              {item.tag}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-[2rem] leading-none text-stone-950">
              {item.title}
            </h2>
            <p className="text-sm leading-6 text-[#6b5d50]">{item.description}</p>
          </div>

          <div className="inline-flex rounded-full border border-[#ead6c6] bg-[#fcf6f1] px-3 py-1.5 text-sm font-medium text-[#8a5f49]">
            {isInDevelopment ? "In ontwikkeling" : formatCatalogPrice(item)}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductPurchaseCard({ item }: { item: CatalogItem }) {
  const isInDevelopment = isCatalogItemInDevelopment(item);

  return (
    <article className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
      <h3 className="font-serif text-[1.45rem] leading-none text-stone-950">
        Bestellen
      </h3>
      <p className="mt-3 text-sm leading-6 text-[#6b5d50]">
        {isInDevelopment
          ? "Deze digitale optie is nog niet live. Je kunt hem nu nog niet bestellen."
          : "Wanneer je doorgaat, open je de productpagina van De Troostboom om het product daar verder te bekijken en te kopen."}
      </p>
      <div className="mt-4">
        {item.href && !isInDevelopment ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
          >
            Kopen via De Troostboom
            <ExternalLink size={16} strokeWidth={1.8} />
          </a>
        ) : (
          <div className="inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]">
            Deze optie is in ontwikkeling
          </div>
        )}
      </div>
    </article>
  );
}

export function CreditPreviewCard({ pack }: { pack: CreditPack }) {
  const total = getPackCount(pack);

  return (
    <article className="aspect-square rounded-[1.35rem] border border-[#e5d8ca] bg-[linear-gradient(180deg,#efede7_0%,#e4dfd9_100%)] px-3 py-4 text-center shadow-[0_14px_26px_rgba(57,41,28,0.08)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b6e61]">
        Opdrachtpakket
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
      <div className="mt-2 text-[11px] text-[#8d5c44]">
        {getPackSupportLabel(pack)}
      </div>
    </article>
  );
}

export function CreditPackDetailCard({ pack }: { pack: CreditPack }) {
  const total = getPackCount(pack);

  return (
    <article className="grid grid-cols-[92px_1fr] gap-3 rounded-[1.4rem] border border-[#eadfce] bg-white/90 p-3">
      <div className="rounded-[1.1rem] bg-[linear-gradient(180deg,#ede8e1_0%,#dfd8ce_100%)] px-2 py-3 text-center">
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b6c5c]">
              {getPackSupportLabel(pack)}
            </div>
            <h4 className="text-sm font-semibold text-stone-950">
              {pack.name}
            </h4>
            <p className="text-xs leading-5 text-[#6f6154]">
              {getPackDescription(pack)}
            </p>
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
}: {
  compact?: boolean;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border border-[#e5d8ca] bg-white/80 p-4 shadow-sm ${
        compact ? "" : "shadow-[0_18px_30px_rgba(59,40,28,0.06)]"
      }`}
    >
      <h3 className="text-base font-semibold text-stone-900">
        Nog geen opdrachtpakketten actief
      </h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Activeer eerst een of meer assignment credit packs of het
        jaarabonnement in de administratie. Dan verschijnen ze automatisch hier.
      </p>
    </article>
  );
}
