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
   Publiceren
   ========================= */
export async function bulkPublishContent(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: items, error: loadError } = await supabase
    .from("content_items")
    .select("id, status, published_at")
    .in("id", ids);

  if (loadError) {
    console.error("BULK PUBLISH LOAD ERROR:", loadError);
    throw new Error("Concepten laden mislukt");
  }

  const draftItems = (items ?? []).filter((item) => item.status === "draft");
  if (draftItems.length === 0) return;

  const idsWithExistingPublishDate = draftItems
    .filter((item) => item.published_at)
    .map((item) => item.id);
  const idsWithoutPublishDate = draftItems
    .filter((item) => !item.published_at)
    .map((item) => item.id);

  if (idsWithExistingPublishDate.length > 0) {
    const { error } = await supabase
      .from("content_items")
      .update({ status: "published" })
      .in("id", idsWithExistingPublishDate);

    if (error) {
      console.error("BULK PUBLISH EXISTING DATE ERROR:", error);
      throw new Error("Publiceren mislukt");
    }
  }

  if (idsWithoutPublishDate.length > 0) {
    const { error } = await supabase
      .from("content_items")
      .update({ status: "published", published_at: nowIso })
      .in("id", idsWithoutPublishDate);

    if (error) {
      console.error("BULK PUBLISH NEW DATE ERROR:", error);
      throw new Error("Publiceren mislukt");
    }
  }
}

export async function publishAllDraftContent() {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: items, error: loadError } = await supabase
    .from("content_items")
    .select("id, published_at")
    .eq("status", "draft");

  if (loadError) {
    console.error("PUBLISH ALL DRAFTS LOAD ERROR:", loadError);
    throw new Error("Concepten laden mislukt");
  }

  if (!items?.length) return;

  const idsWithExistingPublishDate = items
    .filter((item) => item.published_at)
    .map((item) => item.id);
  const idsWithoutPublishDate = items
    .filter((item) => !item.published_at)
    .map((item) => item.id);

  if (idsWithExistingPublishDate.length > 0) {
    const { error } = await supabase
      .from("content_items")
      .update({ status: "published" })
      .in("id", idsWithExistingPublishDate);

    if (error) {
      console.error("PUBLISH ALL DRAFTS EXISTING DATE ERROR:", error);
      throw new Error("Alles publiceren mislukt");
    }
  }

  if (idsWithoutPublishDate.length > 0) {
    const { error } = await supabase
      .from("content_items")
      .update({ status: "published", published_at: nowIso })
      .in("id", idsWithoutPublishDate);

    if (error) {
      console.error("PUBLISH ALL DRAFTS NEW DATE ERROR:", error);
      throw new Error("Alles publiceren mislukt");
    }
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
