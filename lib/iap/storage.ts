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
  packId?: string | null;
};

type CreditPackPurchaseRpcInput = {
  userId: string;
  packId: string;
  quantity: number;
  note?: string | null;
  externalRef?: string | null;
  adminId?: string | null;
};

function isMissingExternalRefRpc(error: { message?: string | null } | null | undefined) {
  const message = error?.message ?? "";
  return (
    message.includes("admin_record_credit_pack_purchase") &&
    message.includes("p_external_ref")
  );
}

function isMissingAdminIdRpc(error: { message?: string | null } | null | undefined) {
  const message = error?.message ?? "";
  return (
    message.includes("admin_record_credit_pack_purchase") &&
    message.includes("p_admin_id")
  );
}

export async function recordIapTransaction(input: IapTransactionInput) {
  const supabase = createAdminClient();
  const packId =
    input.packId !== undefined
      ? input.packId
      : await resolveCreditPackIdByStoreProductId(
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

export async function hasRecordedCreditPackPurchaseByExternalRef(input: {
  userId: string;
  externalRef: string;
}) {
  const normalizedUserId = input.userId.trim();
  const normalizedExternalRef = input.externalRef.trim();

  if (!normalizedUserId || !normalizedExternalRef) {
    return false;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("credit_pack_purchases")
    .select("id")
    .eq("user_id", normalizedUserId)
    .eq("external_ref", normalizedExternalRef)
    .maybeSingle<{ id: string }>();

  if (error) {
    if (error.code === "42703") {
      return false;
    }

    throw error;
  }

  return Boolean(data?.id);
}

export async function recordCreditPackPurchase(input: CreditPackPurchaseRpcInput) {
  const supabase = createAdminClient();
  const basePayload = {
    p_user_id: input.userId,
    p_pack_id: input.packId,
    p_quantity: input.quantity,
    p_note: input.note?.trim() || null,
  };

  const externalRef = input.externalRef?.trim() || null;
  const adminId = input.adminId?.trim() || null;

  const payloadWithAdmin = {
    ...basePayload,
    p_admin_id: adminId,
  };

  if (externalRef) {
    const result = await supabase.rpc("admin_record_credit_pack_purchase", {
      ...(adminId ? payloadWithAdmin : basePayload),
      p_external_ref: externalRef,
    });

    if (!result.error || !isMissingExternalRefRpc(result.error)) {
      return result;
    }
  }

  const withAdminResult = await supabase.rpc(
    "admin_record_credit_pack_purchase",
    payloadWithAdmin
  );

  if (!withAdminResult.error || !isMissingAdminIdRpc(withAdminResult.error)) {
    return withAdminResult;
  }

  return supabase.rpc("admin_record_credit_pack_purchase", basePayload);
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
