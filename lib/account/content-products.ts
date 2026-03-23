import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
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
  kind: "credit_pack" | "content_unlock" | "subscription";
  title: string;
  subtitle: string;
  occurredAt: string;
  amountCents: number | null;
  currency: string | null;
  href: string | null;
  source: string | null;
  themeTitle: string | null;
  categoryTitle: string | null;
};

export type AccountEbookItem = {
  id: string;
  contentItemId: string;
  title: string;
  excerpt: string | null;
  href: string | null;
  unlockedAt: string;
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

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
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
  contentIds: string[]
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
  const pageById = new Map((themePages ?? []).map((page) => [page.id, page]));
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
  }
): Promise<AccountContentProductsData> {
  const supabase = createAdminClient();
  const websiteRows = await listWebsiteOrderItemsForAccount({
    userId: input.userId,
    email: input.email ?? null,
  });

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
    contentIds
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
      };
    })),
    ...(websiteRows.map((row: WebsiteOrderItemRow) => ({
      id: `website:${row.id}`,
      kind:
        row.item_kind === "credit_pack"
          ? ("credit_pack" as const)
          : row.item_kind === "subscription"
            ? ("subscription" as const)
            : ("content_unlock" as const),
      title: row.title,
      subtitle: row.subtitle ?? "",
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
    }))),
  ].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  );

  const ebooks: AccountEbookItem[] = (unlockedRows ?? [])
    .filter((row) => row.content_item?.access_scope === "book")
    .map((row) => ({
      id: row.id,
      contentItemId: row.content_item?.id ?? row.id,
      title: row.content_item?.title || "E-book",
      excerpt: row.content_item?.excerpt ?? null,
      href: getContentHref(row.content_item?.slug ?? null),
      unlockedAt: row.unlocked_at,
    }));

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
    websiteSyncReady: false,
  };
}
