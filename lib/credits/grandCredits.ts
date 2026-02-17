"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { revalidatePath } from "next/cache";

type GrantCreditsInput = {
  userId: string;
  amount: number;
  reason: string;
  refId?: string;
};

export async function grantCredits({
  userId,
  amount,
  reason,
  refId,
}: GrantCreditsInput) {
  if (!userId) throw new Error("UserId ontbreekt");
  if (!Number.isInteger(amount)) throw new Error("Amount moet integer zijn");
  if (amount === 0) throw new Error("Amount mag niet 0 zijn");

  const admin = await getAdminUser();
  if (!admin) throw new Error("Niet geautoriseerd");

  if (admin.id === userId && !admin.isSuperAdmin) {
    throw new Error("Je kunt je eigen credits niet aanpassen");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("admin_adjust_credits", {
    p_user_id: userId,
    p_delta: amount,
    p_reason: reason,
    p_admin_id: admin.id,
    p_ref_id: refId ?? null,
  });

  if (error) {
    console.error("[grantCredits]", error);
    throw new Error("Credits aanpassen mislukt");
  }

  revalidatePath(`/admin/users/${userId}`);
}
