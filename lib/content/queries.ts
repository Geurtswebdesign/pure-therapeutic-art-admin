"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function getContentItems() {
  const { data, error } = await supabaseAdmin
    .from("content_items")
    .select("id, title, status, language, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getContentItem(id: string) {
  if (!id) {
    throw new Error("getContentItem called without id");
  }

  const { data, error } = await supabaseAdmin
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getContentBlocks(contentItemId: string) {
  const { data, error } = await supabaseAdmin
    .from("content_blocks")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("order_index");

  if (error) throw error;
  return data ?? [];
}