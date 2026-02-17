"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";
import type {
  AdminUserProfile,
  CreditTransactionUI,
  CreditWallet,
} from "@/lib/users/types";

const PAGE_SIZE = 10;

type UserDetailResult = {
  profile: AdminUserProfile;
  wallet: CreditWallet | null;
  transactions: CreditTransactionUI[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export async function getContentItems() {
  const { data, error } = await supabaseAdmin
    .from("content_items")
    .select("id, title, status, language, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getContentItem(id: string) {
  if (!id) {
    throw new Error("getContentItem called without id");
  }

  const { data, error } = await supabaseAdmin
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getContentBlocks(contentItemId: string) {
  const { data, error } = await supabaseAdmin
    .from("content_blocks")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("order_index");

  if (error) throw error;
  return data ?? [];
}

export async function getUserDetail(
  userId: string,
  page: number = 1
): Promise<UserDetailResult | null> {
  // 🔐 Admin guard
  await requireAdmin();

  // 👤 Profiel ophalen
  const { data: profileRows, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("user_id, display_name, role")
    .eq("user_id", userId)
    .limit(1);

  if (profileError) {
    throw profileError;
  }

  const profileRow = profileRows?.[0];

  if (!profileRow) {
    return null;
  }

  const profile: AdminUserProfile = {
    user_id: profileRow.user_id,
    display_name: profileRow.display_name,
    role: profileRow.role,
  };

  // 💳 Credit wallet
  const { data: walletRows, error: walletError } = await supabaseAdmin
    .from("credit_wallets")
    .select("user_id, credits_available, updated_at")
    .eq("user_id", userId)
    .limit(1);

  if (walletError) {
    throw walletError;
  }

  const wallet = walletRows?.[0] ?? null;

  // 📜 Transacties + total count
  const rangeStart = (page - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;

  const { data: transactionRows, error: transactionsError } =
    await supabaseAdmin
      .from("credit_transactions")
      .select("id, delta, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeEnd);

  if (transactionsError) {
    throw transactionsError;
  }

  const { count: totalCount, error: countError } = await supabaseAdmin
    .from("credit_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw countError;
  }

  const transactions: CreditTransactionUI[] = (transactionRows ?? []).map(
    (t) => ({
      id: t.id,
      delta: t.delta,
      reason: t.reason,
      created_at: String(t.created_at),
    })
  );

  const totalCountValue = totalCount ?? 0;

  return {
    profile,
    wallet,
    transactions,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount: totalCountValue,
      totalPages: Math.max(1, Math.ceil(totalCountValue / PAGE_SIZE)),
    },
  };
}
