"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";


type ContentStatus = "all" | "draft" | "published" | "archived";

export async function updateContentItem({
  id,
  title,
  body,
  status,
}: {
  id: string;
  title?: string;
  body?: string;
  status?: ContentStatus;
}) {
  const update: Partial<{
    title: string;
    body: string;
    status: ContentStatus;
  }> = {};

  if (title !== undefined) update.title = title;
  if (body !== undefined) update.body = body;
  if (status !== undefined) update.status = status;

  const { error } = await supabaseAdmin
    .from("content_items")
    .update(update)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteContentItem(id: string) {
  if (!id) {
    throw new Error("Missing content id");
  }

  const { error } = await supabaseAdmin
    .from("content_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete content failed", error);
    throw new Error("Failed to delete content");
  }

  return { success: true };
}
