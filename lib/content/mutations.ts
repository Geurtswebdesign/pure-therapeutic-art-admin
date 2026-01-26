"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function createContentItem() {
  const { data, error } = await supabaseAdmin
    .from("content_items")
    .insert({
      title: "",
      slug: crypto.randomUUID(),
      status: "draft",
      language: "nl",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addParagraphBlock(contentItemId: string) {
  const { data: lastBlock } = await supabaseAdmin
    .from("content_blocks")
    .select("order_index")
    .eq("content_item_id", contentItemId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = lastBlock ? lastBlock.order_index + 1 : 0;

  const { data, error } = await supabaseAdmin
    .from("content_blocks")
    .insert({
      content_item_id: contentItemId,
      type: "paragraph",
      order_index: nextOrder,
      data: { text: "" },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
