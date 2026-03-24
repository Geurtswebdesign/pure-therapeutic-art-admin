import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCatalogItemsByCategory,
  getPublicCatalogItem,
  getPublicShopCatalog,
  isCatalogItemInDevelopment,
  type CatalogItem,
} from "@/lib/shop/catalog";
import {
  getEbookReaderHref,
  hasConfiguredEbookAsset,
} from "@/lib/shop/ebook-storage";

type EbookPurchaseRow = {
  id: string;
  product_id: string;
  product_title: string | null;
  amount_cents: number | null;
  currency: string | null;
  source: string | null;
  purchase_status: "paid" | "granted" | "revoked";
  external_reference: string | null;
  metadata?: Record<string, unknown> | null;
  purchased_at: string;
};

export type OwnedEbookProductSummary = {
  purchaseId: string;
  productId: string;
  title: string;
  excerpt: string | null;
  purchasedAt: string;
  amountCents: number | null;
  currency: string | null;
  source: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  quantity: number | null;
  href: string | null;
  syncState: "ready" | "pending_link";
};

export type ResolvedEbookProductState = {
  item: CatalogItem;
  readerHref: string | null;
  isReady: boolean;
  hasAccess: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function listEbookPurchaseRows(userId: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_ebook_purchases")
      .select(
        "id, product_id, product_title, amount_cents, currency, source, purchase_status, external_reference, metadata, purchased_at"
      )
      .eq("user_id", userId)
      .neq("purchase_status", "revoked")
      .order("purchased_at", { ascending: false })
      .returns<EbookPurchaseRow[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  } catch {
    return [] as EbookPurchaseRow[];
  }
}

function getPurchaseOrderNumber(row: EbookPurchaseRow) {
  const metadata = asRecord(row.metadata);
  return (
    asText(metadata?.order_number ?? metadata?.orderNumber) ??
    row.external_reference ??
    null
  );
}

function getPurchaseOrderStatus(row: EbookPurchaseRow) {
  const metadata = asRecord(row.metadata);
  return (
    asText(
      metadata?.order_status ??
        metadata?.orderStatus ??
        metadata?.status ??
        row.purchase_status
    ) ?? row.purchase_status
  );
}

function getPurchaseQuantity(row: EbookPurchaseRow) {
  const metadata = asRecord(row.metadata);
  return asNumber(metadata?.quantity) ?? 1;
}

function getCatalogEbookById(catalog: Awaited<ReturnType<typeof getPublicShopCatalog>>, productId: string) {
  return (
    getCatalogItemsByCategory(catalog, "ebooks").find(
      (item) => item.id === productId
    ) ?? null
  );
}

export async function getPublicEbookProductBySlug(productSlug: string) {
  const catalog = await getPublicShopCatalog();
  return getPublicCatalogItem(catalog, "ebooks", productSlug);
}

export async function listOwnedEbookProducts(
  userId: string
): Promise<OwnedEbookProductSummary[]> {
  const [catalog, rows] = await Promise.all([
    getPublicShopCatalog(),
    listEbookPurchaseRows(userId),
  ]);

  return rows.map((row) => {
    const item = getCatalogEbookById(catalog, row.product_id);
    const readable = Boolean(item && hasConfiguredEbookAsset(item.epubUrl));

    return {
      purchaseId: row.id,
      productId: row.product_id,
      title: item?.title || row.product_title || "E-book",
      excerpt: item?.description || null,
      purchasedAt: row.purchased_at,
      amountCents: row.amount_cents,
      currency: row.currency || "EUR",
      source: row.source ?? "app",
      orderNumber: getPurchaseOrderNumber(row),
      orderStatus: getPurchaseOrderStatus(row),
      quantity: getPurchaseQuantity(row),
      href: readable && item ? getEbookReaderHref(item.id) : null,
      syncState: readable ? "ready" : "pending_link",
    };
  });
}

export async function userOwnsEbookProduct(userId: string, item: CatalogItem) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_ebook_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", item.id)
      .neq("purchase_status", "revoked")
      .maybeSingle<{ id: string }>();

    if (error) {
      throw error;
    }

    return Boolean(data?.id);
  } catch {
    return false;
  }
}

export async function grantDirectEbookPurchase(userId: string, item: CatalogItem) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_ebook_purchases")
    .upsert(
      {
        user_id: userId,
        product_id: item.id,
        product_title: item.title,
        amount_cents: Math.round(item.price * 100),
        currency: "EUR",
        source: "app_direct",
        purchase_status: "granted",
        metadata: {
          product_slug: item.id,
          granted_via: "direct_grant_mode",
        },
        purchased_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,product_id",
      }
    );

  if (error) {
    throw error;
  }
}

export async function resolveEbookProductState(input: {
  item: CatalogItem;
  userId?: string | null;
}) {
  const readerHref = hasConfiguredEbookAsset(input.item.epubUrl)
    ? getEbookReaderHref(input.item.id)
    : null;
  const isReady = Boolean(readerHref) && !isCatalogItemInDevelopment(input.item);
  const hasAccess =
    input.userId && isReady
      ? await userOwnsEbookProduct(input.userId, input.item)
      : false;

  return {
    item: input.item,
    readerHref,
    isReady,
    hasAccess,
  } satisfies ResolvedEbookProductState;
}
