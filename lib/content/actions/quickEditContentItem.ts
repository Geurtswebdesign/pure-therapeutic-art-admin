"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type QuickEditPatch = {
  title?: string;
  status?: "draft" | "published" | "trash";
  published_at?: string | null;
  credit_cost?: number;
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
    credit_cost: number;
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
  
  if (patch.credit_cost !== undefined) {
    updateData.credit_cost = patch.credit_cost;
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
