import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
  YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
  getTimedEntitlementSummary,
  isTimedEntitlementActive,
} from "@/lib/users/entitlements";
import type { ContentAccessScope } from "@/lib/content/access";

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

export async function getAccountContentProductsData(
  userId: string
): Promise<AccountContentProductsData> {
  const supabase = createAdminClient();

  const [{ data: purchaseRows }, { data: unlockedRows }, { data: entitlementRows }] =
    await Promise.all([
      supabase
        .from("credit_pack_purchases")
        .select(
          "id, pack_id, quantity, credits_total, amount_cents, currency, created_at, source, note"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .returns<CreditPackPurchaseRow[]>(),
      supabase
        .from("content_unlocks")
        .select(
          "id, credits_spent, unlocked_at, content_item:content_items(id, title, slug, excerpt, access_scope)"
        )
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false })
        .returns<UnlockedContentRow[]>(),
      supabase
        .from("user_entitlements")
        .select("id, entitlement_key, starts_at, ends_at, is_active, created_at, source, metadata")
        .eq("user_id", userId)
        .in("entitlement_key", [
          YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
          THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
        ])
        .order("created_at", { ascending: false })
        .returns<UserEntitlementRow[]>(),
    ]);

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
      };
    })),
    ...((unlockedRows ?? [])
      .filter((row) => row.credits_spent > 0 && row.content_item)
      .map((row) => ({
        id: `unlock:${row.id}`,
        kind: "content_unlock" as const,
        title: row.content_item?.title || "Ontgrendeld hoofdstuk",
        subtitle:
          row.content_item?.access_scope === "book"
            ? "E-book ontgrendeld in de app"
            : "Hoofdstuk ontgrendeld in de app",
        occurredAt: row.unlocked_at,
        amountCents: null,
        currency: null,
        href: getContentHref(row.content_item?.slug ?? null),
        source: "app",
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
      };
    })),
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
