import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyThemePageTranslation,
  getPreferredThemePageTranslationMap,
} from "@/lib/content/theme-translation-queries";
import {
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
  YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
  getTimedEntitlementSummary,
  isTimedEntitlementActive,
} from "@/lib/users/entitlements";
import type { ContentAccessScope } from "@/lib/content/access";
import {
  listWebsiteOrderItemsForAccount,
  type WebsiteOrderItemRow,
} from "@/lib/account/website-orders";
import { stripRichText } from "@/lib/content/stripRichText";
import { listOwnedEbookProducts } from "@/lib/shop/ebook-products";

type CreditPackPurchaseRow = {
  id: string;
  pack_id: string | null;
  quantity: number;
  credits_total: number;
  amount_cents: number;
  currency: string;
  created_at: string;
  source?: string | null;
  note?: string | null;
};

type CreditPackRow = {
  id: string;
  name: string;
  slug: string;
  credit_scope: ContentAccessScope;
};

type UnlockedContentRow = {
  id: string;
  credits_spent: number;
  unlocked_at: string;
  content_item: {
    id: string;
    title: string;
    slug: string | null;
    excerpt?: string | null;
    access_scope?: string | null;
  } | null;
};

type ContentRelationshipRow = {
  content_item_id: string;
  term_id: string;
};

type ContentTermRow = {
  id: string;
  name: string;
  taxonomy_id: string;
};

type ThemePageRow = {
  id: string;
  slug: string | null;
  title: string | null;
  sort_order: number | null;
};

type ThemeSectionRow = {
  id: string;
  theme_page_id: string | null;
  sort_order: number | null;
};

type ThemeSectionItemRow = {
  theme_section_id: string | null;
  content_item_id: string | null;
  sort_order: number | null;
};

type ThemeLinkCandidate = {
  themeTitle: string;
  themeSortOrder: number;
  themeSectionSortOrder: number;
  themeItemSortOrder: number;
};

type UserEntitlementRow = {
  id: string;
  entitlement_key: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type AccountPurchaseItem = {
  id: string;
  kind: "credit_pack" | "content_unlock" | "subscription" | "ebook";
  title: string;
  subtitle: string;
  occurredAt: string;
  amountCents: number | null;
  currency: string | null;
  href: string | null;
  source: string | null;
  themeTitle: string | null;
  categoryTitle: string | null;
  sourceLabel: string;
  orderNumber: string | null;
  orderStatus: string | null;
  quantity: number | null;
  invoiceHref: string | null;
  productHref: string | null;
};

export type AccountEbookItem = {
  id: string;
  contentItemId: string | null;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  href: string | null;
  unlockedAt: string;
  themeTitle: string | null;
  categoryTitle: string | null;
  sourceLabel: string;
  orderNumber: string | null;
  orderStatus: string | null;
  quantity: number | null;
  syncState: "ready" | "pending_link";
};

export type AccountSubscriptionItem = {
  id: string;
  entitlementKey: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  status: "active" | "planned" | "ended";
  amountCents: number | null;
  currency: string | null;
  cancelAtPeriodEnd: boolean;
  source: string | null;
};

export type AccountContentProductsData = {
  purchases: AccountPurchaseItem[];
  ebooks: AccountEbookItem[];
  subscriptions: AccountSubscriptionItem[];
  websiteSyncReady: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("http://")
  ) {
    return normalized;
  }
  return null;
}

function getPackScopeLabel(scope: ContentAccessScope) {
  if (scope === "book") return "Boekcredits";
  if (scope === "game") return "Spelcredits";
  if (scope === "referral") return "Verwijscredits";
  return "Opdrachtcredits";
}

function getEntitlementTitle(entitlementKey: string) {
  if (entitlementKey === YEAR_ASSIGNMENTS_ENTITLEMENT_KEY) {
    return "Jaarabonnement opdrachten";
  }

  if (entitlementKey === THERAPIST_DIRECTORY_ENTITLEMENT_KEY) {
    return "Therapeutenlijst abonnement";
  }

  return "Abonnement";
}

function getContentHref(slug: string | null) {
  return slug ? `/content/${slug}` : null;
}

function getSourceLabel(source: string | null | undefined) {
  const normalized = source?.trim().toLowerCase() ?? "";
  if (!normalized) return "App";
  if (normalized === "woocommerce" || normalized === "website") {
    return "De troostbook";
  }
  if (normalized === "app") {
    return "App";
  }

  return normalized
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getWebsiteOrderDetails(row: WebsiteOrderItemRow) {
  const metadata = asRecord(row.metadata);
  const explicitOrderNumber = asString(
    metadata?.order_number ?? metadata?.orderNumber
  );
  const explicitStatus = asString(
    metadata?.order_status ?? metadata?.status ?? metadata?.orderStatus
  );

  return {
    sourceLabel: getSourceLabel(row.source),
    orderNumber: explicitOrderNumber || row.external_order_id || null,
    orderStatus: explicitStatus || null,
    quantity:
      asInteger(metadata?.quantity) ??
      asInteger(metadata?.qty) ??
      asInteger(metadata?.line_quantity),
    invoiceHref: asUrl(
      metadata?.invoice_url ?? metadata?.invoiceUrl ?? metadata?.invoice_link
    ),
    productHref: asUrl(
      metadata?.product_url ?? metadata?.productUrl ?? metadata?.product_link
    ),
  };
}

function compareThemeLinkCandidates(
  left: ThemeLinkCandidate,
  right: ThemeLinkCandidate
) {
  if (left.themeSortOrder !== right.themeSortOrder) {
    return left.themeSortOrder - right.themeSortOrder;
  }

  if (left.themeSectionSortOrder !== right.themeSectionSortOrder) {
    return left.themeSectionSortOrder - right.themeSectionSortOrder;
  }

  if (left.themeItemSortOrder !== right.themeItemSortOrder) {
    return left.themeItemSortOrder - right.themeItemSortOrder;
  }

  return left.themeTitle.localeCompare(right.themeTitle, "nl");
}

async function getContentGroupingDetails(
  supabase: ReturnType<typeof createAdminClient>,
  contentIds: string[],
  preferredLanguage?: string | null
) {
  const categoryByContentId = new Map<string, string>();
  const themeByContentId = new Map<string, string>();

  if (!contentIds.length) {
    return { categoryByContentId, themeByContentId };
  }

  const { data: categoryTaxonomy, error: categoryTaxonomyError } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", "category")
    .maybeSingle<{ id: string }>();

  if (categoryTaxonomyError) {
    throw categoryTaxonomyError;
  }

  if (categoryTaxonomy?.id) {
    const { data: relationships, error: relationshipsError } = await supabase
      .from("content_term_relationships")
      .select("content_item_id, term_id")
      .in("content_item_id", contentIds)
      .returns<ContentRelationshipRow[]>();

    if (relationshipsError) {
      throw relationshipsError;
    }

    const categoryTermIds = Array.from(
      new Set(
        (relationships ?? [])
          .map((relationship) => relationship.term_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    if (categoryTermIds.length) {
      const { data: terms, error: termsError } = await supabase
        .from("content_terms")
        .select("id, name, taxonomy_id")
        .in("id", categoryTermIds)
        .eq("taxonomy_id", categoryTaxonomy.id)
        .returns<ContentTermRow[]>();

      if (termsError) {
        throw termsError;
      }

      const termById = new Map((terms ?? []).map((term) => [term.id, term]));

      for (const relationship of relationships ?? []) {
        if (categoryByContentId.has(relationship.content_item_id)) {
          continue;
        }

        const term = termById.get(relationship.term_id);
        if (term?.name) {
          categoryByContentId.set(relationship.content_item_id, term.name);
        }
      }
    }
  }

  const { data: themeSectionLinks, error: themeSectionLinksError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id, content_item_id, sort_order")
    .in("content_item_id", contentIds)
    .returns<ThemeSectionItemRow[]>();

  if (themeSectionLinksError) {
    throw themeSectionLinksError;
  }

  const themeSectionIds = Array.from(
    new Set(
      (themeSectionLinks ?? [])
        .map((row) => row.theme_section_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!themeSectionIds.length) {
    return { categoryByContentId, themeByContentId };
  }

  const { data: themeSections, error: themeSectionsError } = await supabase
    .from("content_theme_sections")
    .select("id, theme_page_id, sort_order")
    .in("id", themeSectionIds)
    .returns<ThemeSectionRow[]>();

  if (themeSectionsError) {
    throw themeSectionsError;
  }

  const themePageIds = Array.from(
    new Set(
      (themeSections ?? [])
        .map((row) => row.theme_page_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!themePageIds.length) {
    return { categoryByContentId, themeByContentId };
  }

  const pageTranslationsById = await getPreferredThemePageTranslationMap(
    themePageIds,
    preferredLanguage
  );
  const { data: themePages, error: themePagesError } = await supabase
    .from("content_theme_pages")
    .select("id, slug, title, sort_order")
    .in("id", themePageIds)
    .eq("is_published", true)
    .returns<ThemePageRow[]>();

  if (themePagesError) {
    throw themePagesError;
  }

  const sectionById = new Map((themeSections ?? []).map((section) => [section.id, section]));
  const pageById = new Map(
    ((themePages ?? []) as ThemePageRow[]).map((page) => [
      page.id,
      applyThemePageTranslation(
        {
          ...page,
          title: page.title ?? "",
          eyebrow: null,
          description: null,
          hero_image_alt: null,
        },
        pageTranslationsById.get(page.id) ?? null
      ),
    ])
  );
  const candidatesByContentId = new Map<string, ThemeLinkCandidate[]>();

  for (const link of themeSectionLinks ?? []) {
    if (!link.content_item_id || !link.theme_section_id) continue;

    const section = sectionById.get(link.theme_section_id);
    const page = section?.theme_page_id
      ? pageById.get(section.theme_page_id) ?? null
      : null;

    if (!section || !page) continue;

    const candidates = candidatesByContentId.get(link.content_item_id) ?? [];
    candidates.push({
      themeTitle: page.title?.trim() || "Ongetiteld thema",
      themeSortOrder: page.sort_order ?? 0,
      themeSectionSortOrder: section.sort_order ?? 0,
      themeItemSortOrder: link.sort_order ?? 0,
    });
    candidatesByContentId.set(link.content_item_id, candidates);
  }

  for (const [contentItemId, candidates] of candidatesByContentId.entries()) {
    candidates.sort(compareThemeLinkCandidates);
    const primaryTheme = candidates[0];
    if (primaryTheme) {
      themeByContentId.set(contentItemId, primaryTheme.themeTitle);
    }
  }

  return { categoryByContentId, themeByContentId };
}

export async function getAccountContentProductsData(
  input: {
    userId: string;
    email?: string | null;
    preferredLanguage?: string | null;
  }
): Promise<AccountContentProductsData> {
  const supabase = createAdminClient();
  const [websiteRows, ownedEbooks] = await Promise.all([
    listWebsiteOrderItemsForAccount({
      userId: input.userId,
      email: input.email ?? null,
    }),
    listOwnedEbookProducts(input.userId),
  ]);

  const [{ data: purchaseRows }, { data: unlockedRows }, { data: entitlementRows }] =
    await Promise.all([
      supabase
        .from("credit_pack_purchases")
        .select(
          "id, pack_id, quantity, credits_total, amount_cents, currency, created_at, source, note"
        )
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .returns<CreditPackPurchaseRow[]>(),
      supabase
        .from("content_unlocks")
        .select(
          "id, credits_spent, unlocked_at, content_item:content_items(id, title, slug, excerpt, access_scope)"
        )
        .eq("user_id", input.userId)
        .order("unlocked_at", { ascending: false })
        .returns<UnlockedContentRow[]>(),
      supabase
        .from("user_entitlements")
        .select("id, entitlement_key, starts_at, ends_at, is_active, created_at, source, metadata")
        .eq("user_id", input.userId)
        .in("entitlement_key", [
          YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
          THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
        ])
        .order("created_at", { ascending: false })
        .returns<UserEntitlementRow[]>(),
    ]);

  const contentIds = Array.from(
    new Set(
      [...(unlockedRows ?? []), ...websiteRows]
        .map((row) =>
          "content_item" in row ? row.content_item?.id : row.content_item_id
        )
        .filter((value): value is string => Boolean(value))
    )
  );
  const { categoryByContentId, themeByContentId } = await getContentGroupingDetails(
    supabase,
    contentIds,
    input.preferredLanguage
  );

  const packIds = Array.from(
    new Set((purchaseRows ?? []).map((row) => row.pack_id).filter(Boolean))
  ) as string[];

  const { data: packRows } = packIds.length
    ? await supabase
        .from("credit_packs")
        .select("id, name, slug, credit_scope")
        .in("id", packIds)
        .returns<CreditPackRow[]>()
    : { data: [] as CreditPackRow[] };

  const packById = new Map((packRows ?? []).map((row) => [row.id, row]));

  const purchases: AccountPurchaseItem[] = [
    ...((purchaseRows ?? []).map((row) => {
      const pack = row.pack_id ? packById.get(row.pack_id) ?? null : null;
      const packLabel = pack ? getPackScopeLabel(pack.credit_scope) : "Credits";
      return {
        id: `purchase:${row.id}`,
        kind: "credit_pack" as const,
        title: pack?.name || "Creditpakket",
        subtitle:
          row.quantity > 1
            ? `${row.quantity}x ${packLabel}`
            : `${row.credits_total} ${packLabel.toLowerCase()}`,
        occurredAt: row.created_at,
        amountCents: row.amount_cents,
        currency: row.currency,
        href: "/shop",
        source: row.source ?? null,
        themeTitle: null,
        categoryTitle: null,
        sourceLabel: getSourceLabel(row.source),
        orderNumber: null,
        orderStatus: null,
        quantity: row.quantity,
        invoiceHref: null,
        productHref: null,
      };
    })),
    ...((unlockedRows ?? [])
      .filter((row) => row.credits_spent > 0 && row.content_item)
      .map((row) => ({
        id: `unlock:${row.id}`,
        kind: "content_unlock" as const,
        title: row.content_item?.title || "Ontgrendeld hoofdstuk",
        subtitle: "",
        occurredAt: row.unlocked_at,
        amountCents: null,
        currency: null,
        href: getContentHref(row.content_item?.slug ?? null),
        source: "app",
        themeTitle: row.content_item?.id
          ? themeByContentId.get(row.content_item.id) ?? null
          : null,
        categoryTitle: row.content_item?.id
          ? categoryByContentId.get(row.content_item.id) ?? null
          : null,
        sourceLabel: "App",
        orderNumber: null,
        orderStatus: null,
        quantity: null,
        invoiceHref: null,
        productHref: null,
      }))),
    ...((entitlementRows ?? []).map((row) => {
      const metadata = asRecord(row.metadata);
      return {
        id: `subscription:${row.id}`,
        kind: "subscription" as const,
        title: getEntitlementTitle(row.entitlement_key),
        subtitle: isTimedEntitlementActive(row)
          ? "Actief abonnement"
          : row.starts_at > new Date().toISOString()
            ? "Gepland abonnement"
            : "Vorige abonnementsperiode",
        occurredAt: row.created_at,
        amountCents: asNumber(metadata?.amount_cents),
        currency: asString(metadata?.currency) || "EUR",
        href: "/shop",
        source: row.source ?? null,
        themeTitle: null,
        categoryTitle: null,
        sourceLabel: getSourceLabel(row.source),
        orderNumber:
          asString(metadata?.order_number ?? metadata?.orderNumber) || null,
        orderStatus: null,
        quantity: null,
        invoiceHref: asUrl(
          metadata?.invoice_url ?? metadata?.invoiceUrl ?? metadata?.invoice_link
        ),
        productHref: asUrl(
          metadata?.product_url ?? metadata?.productUrl ?? metadata?.product_link
        ),
      };
    })),
    ...(websiteRows.map((row: WebsiteOrderItemRow) => {
      const details = getWebsiteOrderDetails(row);
      return {
        id: `website:${row.id}`,
        kind:
          row.item_kind === "credit_pack"
            ? ("credit_pack" as const)
            : row.item_kind === "subscription"
              ? ("subscription" as const)
              : ("content_unlock" as const),
        title: row.title,
        subtitle: stripRichText(row.subtitle ?? ""),
        occurredAt: row.occurred_at,
        amountCents: row.amount_cents,
        currency: row.currency,
        href: row.href,
        source: row.source,
        themeTitle: row.content_item_id
          ? themeByContentId.get(row.content_item_id) ?? null
          : null,
        categoryTitle: row.content_item_id
          ? categoryByContentId.get(row.content_item_id) ?? null
          : null,
        sourceLabel: details.sourceLabel,
        orderNumber: details.orderNumber,
        orderStatus: details.orderStatus,
        quantity: details.quantity,
        invoiceHref: details.invoiceHref,
        productHref: details.productHref,
      };
    })),
    ...(ownedEbooks.map((item) => ({
      id: `ebook:${item.purchaseId}`,
      kind: "ebook" as const,
      title: item.title,
      subtitle: stripRichText(item.excerpt) || "E-book in de app",
      occurredAt: item.purchasedAt,
      amountCents: item.amountCents,
      currency: item.currency,
      href: item.href,
      source: item.source,
      themeTitle: null,
      categoryTitle: null,
      sourceLabel: getSourceLabel(item.source),
      orderNumber: item.orderNumber,
      orderStatus: item.orderStatus,
      quantity: item.quantity,
      invoiceHref: null,
      productHref: null,
    }))),
  ].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  );

  const ebooks: AccountEbookItem[] = ownedEbooks.map((item) => ({
    id: item.purchaseId,
    contentItemId: null,
    title: item.title,
    excerpt: stripRichText(item.excerpt) || null,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    href: item.href,
    unlockedAt: item.purchasedAt,
    themeTitle: null,
    categoryTitle: null,
    sourceLabel: getSourceLabel(item.source),
    orderNumber: item.orderNumber,
    orderStatus: item.orderStatus,
    quantity: item.quantity,
    syncState: item.syncState,
  })).sort(
    (left, right) =>
      new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime()
  );

  const subscriptions: AccountSubscriptionItem[] = (entitlementRows ?? []).map((row) => {
    const metadata = asRecord(row.metadata);
    const summary = getTimedEntitlementSummary([row]);
    return {
      id: row.id,
      entitlementKey: row.entitlement_key,
      title: getEntitlementTitle(row.entitlement_key),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isActive: isTimedEntitlementActive(row),
      status: summary.status,
      amountCents: asNumber(metadata?.amount_cents),
      currency: asString(metadata?.currency) || "EUR",
      cancelAtPeriodEnd: asBoolean(metadata?.cancel_at_period_end),
      source: row.source ?? null,
    };
  });

  return {
    purchases,
    ebooks,
    subscriptions,
    websiteSyncReady: true,
  };
}
