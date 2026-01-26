import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { AdminUserProfile } from "../_lib/types";
import type { CreditTransactionUI } from "../_lib/types";
import type { CreditWallet } from "@prisma/client";

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

export async function getUserDetail(
  userId: string,
  page: number = 1
): Promise<UserDetailResult | null> {
  // 🔐 Admin guard
  await requireAdmin();

  // 👤 Profiel ophalen
  const profileRow = await prisma.profile.findUnique({
    where: { user_id: userId },
  });

  if (!profileRow) {
    return null;
  }

  const profile: AdminUserProfile = {
  user_id: profileRow.user_id,
  display_name: profileRow.display_name,
  role: profileRow.role,
};

  // 💳 Credit wallet
  const wallet = await prisma.creditWallet.findUnique({
    where: { user_id: userId },
  });

  // 📜 Transacties + total count
  const [transactionRows, totalCount] = await Promise.all([
  prisma.creditTransaction.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  }),
  prisma.creditTransaction.count({
    where: { user_id: userId },
  }),
]);

const transactions: CreditTransactionUI[] = transactionRows.map((t) => ({
  id: t.id,
  delta: t.delta,
  reason: t.reason,
  created_at: t.created_at.toISOString(),
}));

return {
  profile,
  wallet,
  transactions,
  pagination: {
    page,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  },
};
}