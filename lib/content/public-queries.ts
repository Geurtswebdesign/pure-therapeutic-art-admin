"use server";

import { supabase } from "@/lib/supabaseClient";

export async function getPublishedContent() {
  const { data, error } = await supabase
    .from("content_items")
    .select("id, title, slug, excerpt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPublishedContentBySlug(slug: string) {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getPublishedContentBySlug:", error);
    return null;
  }

  return data;
}

export async function getPublishedBlocks(contentItemId: string) {
  const { data, error } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("order_index");

  if (error) throw error;
  return data ?? [];
}
