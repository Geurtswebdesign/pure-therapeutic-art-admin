"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/* =========================
   Naar prullenbak
   ========================= */
export async function bulkTrashContent(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("content_items")
    .update({ status: "trash" })
    .in("id", ids);

  if (error) {
    console.error("BULK TRASH ERROR:", error);
    throw new Error("Verplaatsen naar prullenbak mislukt");
  }
}

/* =========================
   Herstellen
   ========================= */
export async function bulkRestoreContent(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("content_items")
    .update({ status: "draft" })
    .in("id", ids);

  if (error) {
    console.error("BULK RESTORE ERROR:", error);
    throw new Error("Herstellen mislukt");
  }
}

/* =========================
   Permanent verwijderen
   ========================= */
export async function bulkDeleteContent(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("content_items")
    .delete()
    .in("id", ids);

  if (error) {
    console.error("BULK DELETE ERROR:", error);
    throw new Error("Permanent verwijderen mislukt");
  }
}
