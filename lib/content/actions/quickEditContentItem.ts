"use server";

import { createAdminClient } from "@/lib/supabase-admin";

export type QuickEditPatch = {
  title?: string;
  status?: "draft" | "published" | "trash";
  published_at?: string | null;
  category_ids?: string[];
  tags?: string[];
};

export async function quickEditContentItem(
  id: string,
  patch: QuickEditPatch
) {
  const supabase = createAdminClient();

  const updateData: Partial<{
    title: string;
    status: "draft" | "published" | "trash";
    published_at: string | null;
  }> = {};

  if (patch.title !== undefined) {
    updateData.title = patch.title;
  }

  if (patch.status !== undefined) {
    updateData.status = patch.status;
  }

  if (patch.published_at !== undefined) {
    updateData.published_at = patch.published_at;
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("content_items")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("QUICK EDIT ERROR:", error);
    throw new Error("Quick Edit opslaan mislukt");
  }
}
