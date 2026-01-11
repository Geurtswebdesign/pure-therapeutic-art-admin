import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const PAGE_SIZE = 10;

export async function getUserDetail(
  userId: string,
  page: number = 1
) {
  await requireAdmin();

  const profile = await prisma.profile.findUnique({
    where: { user_id: userId },
  });

  const wallet = await prisma.creditWallet.findUnique({
    where: { user_id: userId },
  });

  const [transactions, totalCount] = await Promise.all([
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
