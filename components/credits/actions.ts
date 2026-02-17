"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";

type GrantCreditsInput = {
  userId: string;
  amount: number;        // + = toevoegen, - = aftrekken
  reason: string;        // admin_adjust | purchase_bundle | gift | refund | etc
  refId?: string;        // bundle_id / order_id / promo_id
};

/**
 * Canonieke credit-mutatie
 * Wordt gebruikt door:
 * - admin (handmatig)
 * - aankopen / bundles
 * - gifts / refunds
 */
export async function grantCredits({
  userId,
  amount,
  reason,
  refId,
}: GrantCreditsInput) {
  if (!userId || amount === 0) {
    throw new Error("Ongeldige credit mutatie");
  }

  // 🔐 Alleen admins / super-admins
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  // 🔒 Normale admin mag zichzelf niet aanpassen
  if (admin.id === userId && !admin.isSuperAdmin) {
    throw new Error("Je kunt je eigen credits niet aanpassen");
  }

  const supabase = createAdminClient();

  // 1️⃣ Wallet atomair aanpassen
  const { error: walletError } = await supabase.rpc(
    "adjust_user_credits",
    {
      p_user_id: userId,
      p_delta: amount,
    }
  );

  if (walletError) {
    console.error(walletError);
    throw new Error("Credit wallet bijwerken mislukt");
  }

  // 2️⃣ Transactie loggen
  const { error: txError } = await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      delta: amount,
      reason,
      ref_id: refId ?? null,
      admin_id: admin.id,
    });

  if (txError) {
    console.error(txError);
    throw new Error("Credit transactie opslaan mislukt");
  }

  // 3️⃣ UI verversen
  revalidatePath(`/admin/users/${userId}`);
}
