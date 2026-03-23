import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type WebsiteOrderItemKind =
  | "purchase"
  | "ebook"
  | "subscription"
  | "credit_pack";

export type WebsiteOrderItemRow = {
  id: string;
  source: string;
  external_order_id: string;
  external_line_id: string;
  user_id: string | null;
  customer_email: string | null;
  item_kind: WebsiteOrderItemKind;
  title: string;
  subtitle: string | null;
  amount_cents: number | null;
  currency: string | null;
  occurred_at: string;
  href: string | null;
  content_item_id: string | null;
  metadata: Record<string, unknown> | null;
};

export type WebsiteOrderSyncItemInput = {
  externalOrderId: string;
  externalLineId: string;
  userId?: string | null;
  customerEmail?: string | null;
  kind: WebsiteOrderItemKind;
  title: string;
  subtitle?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  occurredAt?: string | null;
  href?: string | null;
  contentItemId?: string | null;
  contentSlug?: string | null;
  metadata?: unknown;
};

type ContentLookupRow = {
  id: string;
  slug: string | null;
};

type ExistingUnlockRow = {
  content_item_id: string | null;
};

function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || null;
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function normalizeSource(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || "website";
}

function asMetadataRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function buildContentHref(slug: string | null) {
  return slug ? `/content/${slug}` : null;
}

async function resolveContentRows(
  items: WebsiteOrderSyncItemInput[]
): Promise<Map<string, ContentLookupRow>> {
  const supabase = createAdminClient();
  const contentIds = Array.from(
    new Set(
      items
        .map((item) => item.contentItemId?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
  const contentSlugs = Array.from(
    new Set(
      items
        .map((item) => item.contentSlug?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  const lookup = new Map<string, ContentLookupRow>();

  if (contentIds.length) {
    const { data, error } = await supabase
      .from("content_items")
      .select("id, slug")
      .in("id", contentIds)
      .returns<ContentLookupRow[]>();

    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      lookup.set(`id:${row.id}`, row);
    }
  }

  if (contentSlugs.length) {
    const { data, error } = await supabase
      .from("content_items")
      .select("id, slug")
      .in("slug", contentSlugs)
      .returns<ContentLookupRow[]>();

    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      if (row.slug) {
        lookup.set(`slug:${row.slug}`, row);
      }
    }
  }

  return lookup;
}

async function ensureContentUnlocksForWebsiteItems(
  userId: string,
  items: WebsiteOrderItemRow[]
) {
  const supabase = createAdminClient();
  const unlockItems = items.filter(
    (item) =>
      item.user_id === userId &&
      Boolean(item.content_item_id) &&
      (item.item_kind === "purchase" || item.item_kind === "ebook")
  );

  const orderedItemsByContentId = new Map<string, WebsiteOrderItemRow>();
  for (const item of unlockItems) {
    const contentItemId = item.content_item_id;
    if (!contentItemId) continue;

    const existing = orderedItemsByContentId.get(contentItemId);
    if (!existing) {
      orderedItemsByContentId.set(contentItemId, item);
      continue;
    }

    if (new Date(item.occurred_at).getTime() < new Date(existing.occurred_at).getTime()) {
      orderedItemsByContentId.set(contentItemId, item);
    }
  }

  const contentIds = Array.from(orderedItemsByContentId.keys());
  if (!contentIds.length) {
    return;
  }

  const { data: existingUnlocks, error: existingUnlocksError } = await supabase
    .from("content_unlocks")
    .select("content_item_id")
    .eq("user_id", userId)
    .in("content_item_id", contentIds)
    .returns<ExistingUnlockRow[]>();

  if (existingUnlocksError) {
    throw existingUnlocksError;
  }

  const existingIds = new Set(
    (existingUnlocks ?? [])
      .map((row) => row.content_item_id)
      .filter((value): value is string => Boolean(value))
  );

  const rowsToInsert = contentIds
    .filter((contentItemId) => !existingIds.has(contentItemId))
    .map((contentItemId) => {
      const item = orderedItemsByContentId.get(contentItemId);
      return {
        user_id: userId,
        content_item_id: contentItemId,
        credits_spent: 0,
        unlocked_at: item?.occurred_at ?? new Date().toISOString(),
      };
    });

  if (!rowsToInsert.length) {
    return;
  }

  const { error: insertError } = await supabase
    .from("content_unlocks")
    .insert(rowsToInsert);

  if (insertError) {
    throw insertError;
  }
}

export async function listWebsiteOrderItemsForAccount(input: {
  userId: string;
  email?: string | null;
}) {
  const supabase = createAdminClient();
  const normalizedEmail = normalizeEmail(input.email);

  const [{ data: directRows, error: directError }, { data: emailRows, error: emailError }] =
    await Promise.all([
      supabase
        .from("website_order_items")
        .select(
          "id, source, external_order_id, external_line_id, user_id, customer_email, item_kind, title, subtitle, amount_cents, currency, occurred_at, href, content_item_id, metadata"
        )
        .eq("user_id", input.userId)
        .order("occurred_at", { ascending: false })
        .returns<WebsiteOrderItemRow[]>(),
      normalizedEmail
        ? supabase
            .from("website_order_items")
            .select(
              "id, source, external_order_id, external_line_id, user_id, customer_email, item_kind, title, subtitle, amount_cents, currency, occurred_at, href, content_item_id, metadata"
            )
            .is("user_id", null)
            .eq("customer_email", normalizedEmail)
            .order("occurred_at", { ascending: false })
            .returns<WebsiteOrderItemRow[]>()
        : Promise.resolve({ data: [] as WebsiteOrderItemRow[], error: null }),
    ]);

  if (directError) {
    throw directError;
  }

  if (emailError) {
    throw emailError;
  }

  const combinedRows = [...(directRows ?? []), ...(emailRows ?? [])];
  const rowsById = new Map(combinedRows.map((row) => [row.id, row]));
  const rows = Array.from(rowsById.values()).sort(
    (left, right) =>
      new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime()
  );

  const claimableIds = rows
    .filter((row) => !row.user_id && row.customer_email === normalizedEmail)
    .map((row) => row.id);

  if (claimableIds.length) {
    const { error: claimError } = await supabase
      .from("website_order_items")
      .update({
        user_id: input.userId,
        updated_at: new Date().toISOString(),
      })
      .in("id", claimableIds);

    if (claimError) {
      throw claimError;
    }

    for (const row of rows) {
      if (claimableIds.includes(row.id)) {
        row.user_id = input.userId;
      }
    }
  }

  await ensureContentUnlocksForWebsiteItems(input.userId, rows);

  return rows;
}

export async function syncWebsiteOrderItems(input: {
  source?: string | null;
  items: WebsiteOrderSyncItemInput[];
}) {
  const supabase = createAdminClient();
  const source = normalizeSource(input.source);
  const items = input.items.filter(
    (item) =>
      Boolean(item.externalOrderId?.trim()) &&
      Boolean(item.externalLineId?.trim()) &&
      Boolean(item.kind) &&
      Boolean(item.title?.trim())
  );

  if (!items.length) {
    return { received: 0, upserted: 0 };
  }

  const contentLookup = await resolveContentRows(items);

  const payload = items.map((item) => {
    const contentRow =
      (item.contentItemId?.trim()
        ? contentLookup.get(`id:${item.contentItemId.trim()}`)
        : null) ||
      (item.contentSlug?.trim()
        ? contentLookup.get(`slug:${item.contentSlug.trim()}`)
        : null) ||
      null;

    return {
      source,
      external_order_id: item.externalOrderId.trim(),
      external_line_id: item.externalLineId.trim(),
      user_id: normalizeText(item.userId),
      customer_email: normalizeEmail(item.customerEmail),
      item_kind: item.kind,
      title: item.title.trim(),
      subtitle: normalizeText(item.subtitle),
      amount_cents:
        typeof item.amountCents === "number" && Number.isFinite(item.amountCents)
          ? item.amountCents
          : null,
      currency: normalizeText(item.currency)?.toUpperCase() ?? null,
      occurred_at: normalizeText(item.occurredAt) ?? new Date().toISOString(),
      href:
        normalizeText(item.href) ??
        buildContentHref(contentRow?.slug ?? null),
      content_item_id: contentRow?.id ?? normalizeText(item.contentItemId),
      metadata: asMetadataRecord(item.metadata),
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from("website_order_items")
    .upsert(payload, {
      onConflict: "source,external_order_id,external_line_id",
    });

  if (error) {
    throw error;
  }

  const userIds = Array.from(
    new Set(
      payload
        .map((row) => row.user_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  for (const userId of userIds) {
    const userRows = payload
      .filter((row) => row.user_id === userId)
      .map((row) => ({
        id: `${row.external_order_id}:${row.external_line_id}`,
        source: row.source,
        external_order_id: row.external_order_id,
        external_line_id: row.external_line_id,
        user_id: row.user_id,
        customer_email: row.customer_email,
        item_kind: row.item_kind,
        title: row.title,
        subtitle: row.subtitle,
        amount_cents: row.amount_cents,
        currency: row.currency,
        occurred_at: row.occurred_at,
        href: row.href,
        content_item_id: row.content_item_id,
        metadata: row.metadata,
      })) satisfies WebsiteOrderItemRow[];
    await ensureContentUnlocksForWebsiteItems(userId, userRows);
  }

  return {
    received: input.items.length,
    upserted: payload.length,
  };
}
