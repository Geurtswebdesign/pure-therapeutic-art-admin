"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function deleteBlock(blockId: string) {
  const { error } = await supabaseAdmin
    .from("content_blocks")
    .delete()
    .eq("id", blockId);

  if (error) throw error;
}

export async function moveBlock(
  blockId: string,
  direction: "up" | "down"
) {
  const { data: block } = await supabaseAdmin
    .from("content_blocks")
    .select("id, content_item_id, order_index")
    .eq("id", blockId)
    .single();

  if (!block) return;

  const operator = direction === "up" ? "<" : ">";
  const sort = direction === "up" ? "desc" : "asc";

  const { data: sibling } = await supabaseAdmin
    .from("content_blocks")
    .select("id, order_index")
    .eq("content_item_id", block.content_item_id)
    .filter("order_index", operator, block.order_index)
    .order("order_index", { ascending: sort === "asc" })
    .limit(1)
    .single();

  if (!sibling) return;

  // swap
  await supabaseAdmin
    .from("content_blocks")
    .update({ order_index: sibling.order_index })
    .eq("id", block.id);

  await supabaseAdmin
    .from("content_blocks")
    .update({ order_index: block.order_index })
    .eq("id", sibling.id);
}

export async function addImageBlock(
  contentItemId: string,
  imageId: string
) {
  const { data: last } = await supabaseAdmin
    .from("content_blocks")
    .select("order_index")
    .eq("content_item_id", contentItemId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = last ? last.order_index + 1 : 0;

  await supabaseAdmin.from("content_blocks").insert({
    content_item_id: contentItemId,
    type: "image",
    order_index: nextOrder,
    data: {
      imageId,
      layout: "content",
      variant: "default",
    },
  });
}
