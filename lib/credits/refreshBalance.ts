"use server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getBalance } from "@/lib/credits/getBalance";

export async function refreshBalance() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");
  return await getBalance(user.id);
}
