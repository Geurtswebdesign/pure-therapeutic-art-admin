import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hasRecordedCreditPackPurchaseByExternalRef,
  recordIapTransaction,
} from "@/lib/iap/storage";
import {
  resolveSubscriptionPackByStoreProductId,
  type ResolvedSubscriptionPack,
} from "@/lib/iap/subscription-products";
import {
  getEbookProductByStoreProductId,
  grantEbookPurchaseFromStore,
  revokeEbookPurchaseFromStore,
} from "@/lib/shop/ebook-products";

const WEBHOOK_AUTH = process.env.REVENUECAT_WEBHOOK_AUTH?.trim() || null;

type RevenueCatStore = "APP_STORE" | "PLAY_STORE" | "MAC_APP_STORE";

type RevenueCatEvent = {
  type?: string | null;
  app_user_id?: string | null;
  original_app_user_id?: string | null;
  aliases?: string[] | null;
  product_id?: string | null;
  transaction_id?: string | null;
  original_transaction_id?: string | null;
  store?: RevenueCatStore | string | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
  event_timestamp_ms?: number | string | null;
  purchased_at_ms?: number | string | null;
  expiration_at_ms?: number | string | null;
  entitlement_id?: string | null;
  entitlement_ids?: string[] | null;
  period_type?: string | null;
  cancel_reason?: string | null;
};

type RevenueCatWebhookPayload = {
  event?: RevenueCatEvent | null;
};

type UserEntitlementRow = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
};

function isAuthorized(request: Request) {
  if (!WEBHOOK_AUTH) {
    return true;
  }

  const header = request.headers.get("authorization")?.trim();
  if (!header) {
    return false;
  }

  if (header === WEBHOOK_AUTH) {
    return true;
  }

  return header === `Bearer ${WEBHOOK_AUTH}`;
}

function resolvePlatform(store: RevenueCatEvent["store"]) {
  if (store === "APP_STORE" || store === "MAC_APP_STORE") {
    return "apple" as const;
  }

  if (store === "PLAY_STORE") {
    return "google" as const;
  }

  return null;
}

function resolveUserId(event: RevenueCatEvent) {
  const candidate = event.app_user_id ?? event.original_app_user_id ?? null;
  if (!candidate || candidate.startsWith("$RCAnonymousID:")) {
    return null;
  }

  return candidate;
}

function resolveTransactionId(event: RevenueCatEvent) {
  return event.transaction_id ?? event.original_transaction_id ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asTimestampMs(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return null;
}

function timestampMsToIso(value: unknown) {
  const timestamp = asTimestampMs(value);
  if (timestamp === null) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function getEventTimestampIso(event: RevenueCatEvent) {
  return timestampMsToIso(event.event_timestamp_ms);
}

function getPurchasedAtIso(event: RevenueCatEvent) {
  return timestampMsToIso(event.purchased_at_ms) ?? getEventTimestampIso(event);
}

function getExpirationAtIso(event: RevenueCatEvent) {
  return timestampMsToIso(event.expiration_at_ms);
}

function getSubscriptionOriginalTransactionId(event: RevenueCatEvent) {
  return event.original_transaction_id ?? resolveTransactionId(event);
}

function pickEarlierIso(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return left <= right ? left : right;
}

function pickLaterIso(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return left >= right ? left : right;
}

function getLastEventAt(metadata: Record<string, unknown> | null | undefined) {
  const lastEventAt = asString(metadata?.last_event_at);
  return lastEventAt || null;
}

function isOlderThanCurrentState(
  row: UserEntitlementRow,
  eventTimestampIso: string | null
) {
  if (!eventTimestampIso) {
    return false;
  }

  const lastEventAt = getLastEventAt(asRecord(row.metadata));
  return Boolean(lastEventAt && lastEventAt > eventTimestampIso);
}

function matchesSubscriptionEntitlement(
  row: UserEntitlementRow,
  originalTransactionId: string | null,
  subscriptionPack: ResolvedSubscriptionPack
) {
  const metadata = asRecord(row.metadata);
  const metadataOriginalTransactionId = asString(metadata?.original_transaction_id);
  if (
    originalTransactionId &&
    metadataOriginalTransactionId &&
    metadataOriginalTransactionId === originalTransactionId
  ) {
    return true;
  }

  const metadataPackId = asString(metadata?.pack_id);
  return (
    row.source === "revenuecat" &&
    metadataPackId === subscriptionPack.packId &&
    row.is_active
  );
}

async function loadSubscriptionEntitlements(
  userId: string,
  subscriptionPack: ResolvedSubscriptionPack
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("id, starts_at, ends_at, is_active, source, metadata")
    .eq("user_id", userId)
    .eq("entitlement_key", subscriptionPack.entitlementKey)
    .order("created_at", { ascending: false })
    .returns<UserEntitlementRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function buildSubscriptionMetadata(input: {
  subscriptionPack: ResolvedSubscriptionPack;
  event: RevenueCatEvent;
  existingMetadata?: Record<string, unknown> | null;
  platform: "apple" | "google";
  eventTimestampIso: string | null;
  amountCents: number | null;
  currency: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const originalTransactionId = getSubscriptionOriginalTransactionId(input.event);
  const transactionId = resolveTransactionId(input.event);
  const entitlementIds = Array.isArray(input.event.entitlement_ids)
    ? input.event.entitlement_ids.filter((entry): entry is string => typeof entry === "string")
    : [];

  const existingCancelAtPeriodEnd =
    typeof input.existingMetadata?.cancel_at_period_end === "boolean"
      ? input.existingMetadata.cancel_at_period_end
      : false;
  const cancelAtPeriodEnd =
    input.cancelAtPeriodEnd ?? existingCancelAtPeriodEnd;

  return {
    ...(input.existingMetadata ?? {}),
    pack_id: input.subscriptionPack.packId,
    pack_name: input.subscriptionPack.packName,
    pack_slug: input.subscriptionPack.packSlug,
    platform: input.platform,
    subscription_kind: input.subscriptionPack.kind,
    subscription_plan: input.subscriptionPack.therapistPlan,
    duration_months: input.subscriptionPack.durationMonths,
    store_product_id: input.event.product_id,
    original_transaction_id: originalTransactionId,
    latest_transaction_id: transactionId,
    amount_cents: input.amountCents,
    currency: input.currency,
    cancel_at_period_end: cancelAtPeriodEnd,
    cancel_requested_at: cancelAtPeriodEnd ? input.eventTimestampIso : null,
    last_event_type: input.event.type ?? null,
    last_event_at: input.eventTimestampIso,
    entitlement_id: input.event.entitlement_id ?? null,
    entitlement_ids: entitlementIds,
    period_type: input.event.period_type ?? null,
    cancel_reason: input.event.cancel_reason ?? null,
  };
}

async function upsertSubscriptionEntitlement(input: {
  subscriptionPack: ResolvedSubscriptionPack;
  userId: string;
  event: RevenueCatEvent;
  payload: RevenueCatWebhookPayload;
  platform: "apple" | "google";
  recordTransaction?: boolean;
}) {
  const transactionId = resolveTransactionId(input.event);
  const originalTransactionId = getSubscriptionOriginalTransactionId(input.event);
  const amountCents =
    typeof input.event.price_in_purchased_currency === "number"
      ? Math.round(input.event.price_in_purchased_currency * 100)
      : null;
  const currency = input.event.currency ?? "EUR";
  const eventTimestampIso = getEventTimestampIso(input.event);
  const purchasedAtIso = getPurchasedAtIso(input.event) ?? new Date().toISOString();
  const expirationAtIso = getExpirationAtIso(input.event);

  let transactionAlreadyRecorded = false;
  if (input.recordTransaction !== false) {
    if (!transactionId || !originalTransactionId) {
      return NextResponse.json({ ok: true, ignored: "missing_transaction_id" });
    }

    const record = await recordIapTransaction({
      platform: input.platform,
      storeTransactionId: transactionId,
      storeProductId: input.event.product_id ?? "",
      userId: input.userId,
      quantity: 1,
      amountCents,
      currency,
      rawPayload: input.payload,
      packId: input.subscriptionPack.packId,
    });

    if (!record.ok) {
      return NextResponse.json(
        { error: record.error ?? "subscription_record_failed" },
        { status: 500 }
      );
    }

    transactionAlreadyRecorded = Boolean(record.alreadyRecorded);
  }

  const rows = await loadSubscriptionEntitlements(
    input.userId,
    input.subscriptionPack
  );
  const existing = rows.find((row) =>
    matchesSubscriptionEntitlement(row, originalTransactionId, input.subscriptionPack)
  );

  if (existing && isOlderThanCurrentState(existing, eventTimestampIso)) {
    return NextResponse.json({
      ok: true,
      action: "subscription_event_ignored_as_stale",
      entitlementKey: input.subscriptionPack.entitlementKey,
    });
  }

  const metadata = buildSubscriptionMetadata({
    subscriptionPack: input.subscriptionPack,
    event: input.event,
    existingMetadata: existing?.metadata,
    platform: input.platform,
    eventTimestampIso,
    amountCents,
    currency,
    cancelAtPeriodEnd: false,
  });

  const supabase = createAdminClient();

  if (existing) {
    const { error } = await supabase
      .from("user_entitlements")
      .update({
        starts_at: pickEarlierIso(existing.starts_at, purchasedAtIso),
        ends_at: pickLaterIso(existing.ends_at, expirationAtIso),
        is_active: true,
        source: "revenuecat",
        metadata,
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      action: transactionAlreadyRecorded
        ? "subscription_synced"
        : "subscription_activated",
      entitlementKey: input.subscriptionPack.entitlementKey,
      packId: input.subscriptionPack.packId,
    });
  }

  const { error } = await supabase.from("user_entitlements").insert({
    user_id: input.userId,
    entitlement_key: input.subscriptionPack.entitlementKey,
    starts_at: purchasedAtIso,
    ends_at: expirationAtIso,
    is_active: true,
    source: "revenuecat",
    metadata,
    created_by: input.userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    action: transactionAlreadyRecorded ? "subscription_synced" : "subscription_activated",
    entitlementKey: input.subscriptionPack.entitlementKey,
    packId: input.subscriptionPack.packId,
  });
}

async function updateSubscriptionCancellation(input: {
  subscriptionPack: ResolvedSubscriptionPack;
  userId: string;
  event: RevenueCatEvent;
  platform: "apple" | "google";
  cancelAtPeriodEnd: boolean;
}) {
  const originalTransactionId = getSubscriptionOriginalTransactionId(input.event);
  if (!originalTransactionId) {
    return NextResponse.json({ ok: true, ignored: "missing_transaction_id" });
  }

  const rows = await loadSubscriptionEntitlements(
    input.userId,
    input.subscriptionPack
  );
  const matchingRows = rows.filter((row) =>
    matchesSubscriptionEntitlement(row, originalTransactionId, input.subscriptionPack)
  );

  if (!matchingRows.length) {
    return NextResponse.json({
      ok: true,
      action: "subscription_cancellation_state_missing",
      entitlementKey: input.subscriptionPack.entitlementKey,
    });
  }

  const eventTimestampIso = getEventTimestampIso(input.event);
  const amountCents =
    typeof input.event.price_in_purchased_currency === "number"
      ? Math.round(input.event.price_in_purchased_currency * 100)
      : null;
  const currency = input.event.currency ?? "EUR";
  const supabase = createAdminClient();

  await Promise.all(
    matchingRows
      .filter((row) => !isOlderThanCurrentState(row, eventTimestampIso))
      .map((row) =>
        supabase
          .from("user_entitlements")
          .update({
            metadata: buildSubscriptionMetadata({
              subscriptionPack: input.subscriptionPack,
              event: input.event,
              existingMetadata: row.metadata,
              platform: input.platform,
              eventTimestampIso,
              amountCents,
              currency,
              cancelAtPeriodEnd: input.cancelAtPeriodEnd,
            }),
          })
          .eq("id", row.id)
      )
  );

  return NextResponse.json({
    ok: true,
    action: input.cancelAtPeriodEnd
      ? "subscription_cancelled_at_period_end"
      : "subscription_renewal_resumed",
    entitlementKey: input.subscriptionPack.entitlementKey,
  });
}

async function expireSubscriptionEntitlement(input: {
  subscriptionPack: ResolvedSubscriptionPack;
  userId: string;
  event: RevenueCatEvent;
  platform: "apple" | "google";
}) {
  const originalTransactionId = getSubscriptionOriginalTransactionId(input.event);
  if (!originalTransactionId) {
    return NextResponse.json({ ok: true, ignored: "missing_transaction_id" });
  }

  const expirationAtIso =
    getExpirationAtIso(input.event) ??
    getEventTimestampIso(input.event) ??
    new Date().toISOString();
  const eventTimestampIso = getEventTimestampIso(input.event);
  const amountCents =
    typeof input.event.price_in_purchased_currency === "number"
      ? Math.round(input.event.price_in_purchased_currency * 100)
      : null;
  const currency = input.event.currency ?? "EUR";

  const rows = await loadSubscriptionEntitlements(
    input.userId,
    input.subscriptionPack
  );
  const matchingRows = rows.filter((row) =>
    matchesSubscriptionEntitlement(row, originalTransactionId, input.subscriptionPack)
  );

  if (!matchingRows.length) {
    return NextResponse.json({
      ok: true,
      action: "subscription_expiration_missing",
      entitlementKey: input.subscriptionPack.entitlementKey,
    });
  }

  const supabase = createAdminClient();
  await Promise.all(
    matchingRows
      .filter((row) => !isOlderThanCurrentState(row, eventTimestampIso))
      .filter((row) => !row.ends_at || row.ends_at <= expirationAtIso)
      .map((row) =>
        supabase
          .from("user_entitlements")
          .update({
            is_active: false,
            ends_at: expirationAtIso,
            metadata: buildSubscriptionMetadata({
              subscriptionPack: input.subscriptionPack,
              event: input.event,
              existingMetadata: row.metadata,
              platform: input.platform,
              eventTimestampIso,
              amountCents,
              currency,
              cancelAtPeriodEnd: true,
            }),
          })
          .eq("id", row.id)
      )
  );

  return NextResponse.json({
    ok: true,
    action: "subscription_expired",
    entitlementKey: input.subscriptionPack.entitlementKey,
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: RevenueCatWebhookPayload;
  try {
    payload = (await request.json()) as RevenueCatWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event ?? null;
  if (!event?.type || !event.product_id) {
    return NextResponse.json({ ok: true, ignored: "missing_event_fields" });
  }

  const platform = resolvePlatform(event.store);
  const userId = resolveUserId(event);
  const transactionId = resolveTransactionId(event);

  if (!platform || !userId) {
    return NextResponse.json({ ok: true, ignored: "unsupported_store_or_user" });
  }

  const ebookItem = await getEbookProductByStoreProductId(platform, event.product_id);
  if (ebookItem) {
    if (event.type === "INITIAL_PURCHASE" || event.type === "NON_RENEWING_PURCHASE") {
      if (!transactionId) {
        return NextResponse.json({ ok: true, ignored: "missing_transaction_id" });
      }

      await grantEbookPurchaseFromStore({
        userId,
        item: ebookItem,
        platform,
        storeTransactionId: transactionId,
        storeProductId: event.product_id,
        amountCents:
          typeof event.price_in_purchased_currency === "number"
            ? Math.round(event.price_in_purchased_currency * 100)
            : null,
        currency: event.currency ?? "EUR",
        rawPayload: payload,
      });

      return NextResponse.json({
        ok: true,
        action: "granted",
        productId: ebookItem.id,
      });
    }

    if (event.type === "CANCELLATION") {
      await revokeEbookPurchaseFromStore({
        userId,
        item: ebookItem,
        platform,
        externalReference: transactionId,
        rawPayload: payload,
      });

      return NextResponse.json({
        ok: true,
        action: "revoked",
        productId: ebookItem.id,
      });
    }

    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const subscriptionPack = await resolveSubscriptionPackByStoreProductId(
    platform,
    event.product_id
  );

  if (subscriptionPack) {
    if (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL") {
      return upsertSubscriptionEntitlement({
        subscriptionPack,
        userId,
        event,
        payload,
        platform,
      });
    }

    if (event.type === "SUBSCRIPTION_EXTENDED") {
      return upsertSubscriptionEntitlement({
        subscriptionPack,
        userId,
        event,
        payload,
        platform,
        recordTransaction: false,
      });
    }

    if (event.type === "CANCELLATION") {
      return updateSubscriptionCancellation({
        subscriptionPack,
        userId,
        event,
        platform,
        cancelAtPeriodEnd: true,
      });
    }

    if (event.type === "UNCANCELLATION") {
      return updateSubscriptionCancellation({
        subscriptionPack,
        userId,
        event,
        platform,
        cancelAtPeriodEnd: false,
      });
    }

    if (event.type === "EXPIRATION") {
      return expireSubscriptionEntitlement({
        subscriptionPack,
        userId,
        event,
        platform,
      });
    }

    return NextResponse.json({ ok: true, ignored: event.type });
  }

  if (
    event.type === "INITIAL_PURCHASE" ||
    event.type === "NON_RENEWING_PURCHASE"
  ) {
    if (!transactionId) {
      return NextResponse.json({ ok: true, ignored: "missing_transaction_id" });
    }

    const record = await recordIapTransaction({
      platform,
      storeTransactionId: transactionId,
      storeProductId: event.product_id,
      userId,
      quantity: 1,
      amountCents:
        typeof event.price_in_purchased_currency === "number"
          ? Math.round(event.price_in_purchased_currency * 100)
          : null,
      currency: event.currency ?? "EUR",
      rawPayload: payload,
    });

    if (!record.ok) {
      return NextResponse.json(
        { error: record.error ?? "credit_pack_record_failed" },
        { status: 500 }
      );
    }

    if (!record.packId) {
      return NextResponse.json({ ok: true, ignored: "no_product_mapping" });
    }

    const alreadyGranted = await hasRecordedCreditPackPurchaseByExternalRef({
      userId,
      externalRef: transactionId,
    });

    if (alreadyGranted) {
      return NextResponse.json({
        ok: true,
        action: "credit_pack_already_processed",
        packId: record.packId,
      });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.rpc("admin_record_credit_pack_purchase", {
      p_user_id: userId,
      p_pack_id: record.packId,
      p_quantity: 1,
      p_note: `${platform} revenuecat ${transactionId}`,
      p_external_ref: transactionId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      action: record.alreadyRecorded
        ? "credit_pack_credited_after_retry"
        : "credit_pack_credited",
      packId: record.packId,
    });
  }

  return NextResponse.json({ ok: true, ignored: "no_product_mapping" });
}
