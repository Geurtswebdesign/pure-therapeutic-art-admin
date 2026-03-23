import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPublishedContentByReference } from "@/lib/content/public-queries";
import {
  getCatalogItemPath,
  getPublicCatalogItem,
  getPublicShopCatalog,
  isCatalogItemInDevelopment,
  type CatalogItem,
} from "@/lib/shop/catalog";
import { hasAccess } from "@/lib/unlock/hasAccess";

type EbookProductMetadata = {
  productId: string | null;
  productSlug: string | null;
  productUrl: string | null;
  epubUrl: string | null;
};

type LinkedContentSummary = {
  id: string;
  slug: string | null;
  creditCost: number;
};

type OwnedProductRow = {
  id: string;
  metadata: Record<string, unknown> | null;
};

export type ResolvedEbookProductState = {
  item: CatalogItem;
  linkedContent: LinkedContentSummary | null;
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

function getEbookProductMetadata(metadata: unknown): EbookProductMetadata {
  const record = asRecord(metadata);

  return {
    productId: asText(record?.product_id ?? record?.productId),
    productSlug: asText(record?.product_slug ?? record?.productSlug),
    productUrl: asText(record?.product_url ?? record?.productUrl),
    epubUrl: asText(record?.epub_url ?? record?.epubUrl),
  };
}

function getProductReaderHref(productSlug: string) {
  return `/account/ebooks/product/${productSlug}`;
}

function getContentReaderHref(slug: string | null) {
  return slug ? `/account/ebooks/${slug}` : null;
}

function matchesOwnedProductRow(
  row: OwnedProductRow,
  item: CatalogItem
) {
  const metadata = getEbookProductMetadata(row.metadata);
  const productPath = getCatalogItemPath(item);

  return (
    metadata.productId === item.id ||
    metadata.productSlug === item.id ||
    metadata.productUrl === productPath
  );
}

export async function getPublicEbookProductBySlug(productSlug: string) {
  const catalog = await getPublicShopCatalog();
  return getPublicCatalogItem(catalog, "ebooks", productSlug);
}

export async function getLinkedContentForEbookProduct(item: CatalogItem) {
  const reference = item.contentSlug?.trim();
  if (!reference) {
    return null;
  }

  const linkedContent = await getPublishedContentByReference(reference);
  if (!linkedContent) {
    return null;
  }

  return {
    id: linkedContent.id,
    slug: linkedContent.slug ?? null,
    creditCost:
      typeof linkedContent.credit_cost === "number" &&
      Number.isFinite(linkedContent.credit_cost)
        ? linkedContent.credit_cost
        : 0,
  } satisfies LinkedContentSummary;
}

export function getEbookReaderHref(
  item: CatalogItem,
  linkedContent: LinkedContentSummary | null
) {
  if (item.epubUrl?.trim()) {
    return getProductReaderHref(item.id);
  }

  return getContentReaderHref(linkedContent?.slug ?? null);
}

export async function getOwnedEbookProductRow(
  userId: string,
  item: CatalogItem
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("website_order_items")
    .select("id, metadata")
    .eq("user_id", userId)
    .eq("item_kind", "ebook")
    .order("occurred_at", { ascending: false })
    .limit(200)
    .returns<OwnedProductRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).find((row) => matchesOwnedProductRow(row, item)) ?? null;
}

export async function userOwnsEbookProduct(input: {
  userId: string;
  item: CatalogItem;
  linkedContent?: LinkedContentSummary | null;
}) {
  const linkedContent =
    input.linkedContent === undefined
      ? await getLinkedContentForEbookProduct(input.item)
      : input.linkedContent;

  if (linkedContent && (await hasAccess(input.userId, linkedContent.id))) {
    return true;
  }

  const ownedRow = await getOwnedEbookProductRow(input.userId, input.item);
  return Boolean(ownedRow);
}

export async function resolveEbookProductState(input: {
  item: CatalogItem;
  userId?: string | null;
}) {
  const linkedContent = await getLinkedContentForEbookProduct(input.item);
  const readerHref = getEbookReaderHref(input.item, linkedContent);
  const ready = Boolean(readerHref) && !isCatalogItemInDevelopment(input.item);
  const hasUserAccess =
    input.userId && ready
      ? await userOwnsEbookProduct({
          userId: input.userId,
          item: input.item,
          linkedContent,
        })
      : false;

  return {
    item: input.item,
    linkedContent,
    readerHref,
    isReady: ready,
    hasAccess: hasUserAccess,
  } satisfies ResolvedEbookProductState;
}
