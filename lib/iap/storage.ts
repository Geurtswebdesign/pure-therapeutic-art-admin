import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCreditPackIdByStoreProductId } from "@/lib/iap/credit-pack-products";

type IapTransactionInput = {
  platform: "apple" | "google";
  storeTransactionId: string;
  storeProductId: string;
  userId?: string | null;
  quantity?: number;
  amountCents?: number | null;
  currency?: string | null;
  rawPayload?: unknown;
};

export async function recordIapTransaction(input: IapTransactionInput) {
  const supabase = createAdminClient();
  const packId = await resolveCreditPackIdByStoreProductId(
    input.platform,
    input.storeProductId
  );

  const { data: existing } = await supabase
    .from("iap_transactions")
    .select("id")
    .eq("platform", input.platform)
    .eq("store_transaction_id", input.storeTransactionId)
    .maybeSingle<{ id: string }>();

  if (existing?.id) {
    return { ok: true, alreadyRecorded: true, packId };
  }

  const { data: inserted, error } = await supabase
    .from("iap_transactions")
    .insert({
      platform: input.platform,
      store_transaction_id: input.storeTransactionId,
      store_product_id: input.storeProductId,
      user_id: input.userId ?? null,
      pack_id: packId,
      quantity: Math.max(1, input.quantity ?? 1),
      amount_cents: input.amountCents ?? null,
      currency: input.currency ?? null,
      status: packId ? "mapped" : "unmapped",
      raw_payload: input.rawPayload ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return { ok: false, error: error.message, packId };
  }

  return { ok: true, transactionId: inserted.id, packId };
}

export async function recordIapNotification(input: {
  platform: "apple" | "google";
  notificationType?: string | null;
  subtype?: string | null;
  rawPayload: unknown;
}) {
  const supabase = createAdminClient();
  await supabase.from("iap_notifications").insert({
    platform: input.platform,
    notification_type: input.notificationType ?? null,
    subtype: input.subtype ?? null,
    raw_payload: input.rawPayload,
  });
}
