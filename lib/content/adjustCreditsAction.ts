"use server";

import { adjustCredits } from "./adjustCredits";

export async function adjustCreditsAction(formData: FormData) {
  const userId = String(formData.get("user_id"));
  const delta = Number(formData.get("delta"));

  if (!userId || Number.isNaN(delta) || delta === 0) {
    throw new Error("Ongeldige credit mutatie");
  }

  await adjustCredits(userId, delta);
}
