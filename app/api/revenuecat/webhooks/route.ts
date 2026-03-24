import { NextResponse } from "next/server";
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
};

type RevenueCatWebhookPayload = {
  event?: RevenueCatEvent | null;
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

  const item = await getEbookProductByStoreProductId(platform, event.product_id);
  if (!item) {
    return NextResponse.json({ ok: true, ignored: "no_product_mapping" });
  }

  if (event.type === "INITIAL_PURCHASE" || event.type === "NON_RENEWING_PURCHASE") {
    if (!transactionId) {
      return NextResponse.json({ ok: true, ignored: "missing_transaction_id" });
    }

    await grantEbookPurchaseFromStore({
      userId,
      item,
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

    return NextResponse.json({ ok: true, action: "granted", productId: item.id });
  }

  if (event.type === "CANCELLATION") {
    await revokeEbookPurchaseFromStore({
      userId,
      item,
      platform,
      externalReference: transactionId,
      rawPayload: payload,
    });

    return NextResponse.json({ ok: true, action: "revoked", productId: item.id });
  }

  return NextResponse.json({ ok: true, ignored: event.type });
}
