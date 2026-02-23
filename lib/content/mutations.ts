"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_PRIMARY_LANGUAGE } from "@/lib/i18n/languages";

export async function createContentItem() {
  const { data: generalSettingsRow } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "general")
    .maybeSingle<{ value: { primaryLanguage?: string } }>();

  const language =
    typeof generalSettingsRow?.value?.primaryLanguage === "string" &&
    generalSettingsRow.value.primaryLanguage.trim()
      ? generalSettingsRow.value.primaryLanguage.trim().toLowerCase()
      : DEFAULT_PRIMARY_LANGUAGE;

  const { data, error } = await supabaseAdmin
    .from("content_items")
    .insert({
      title: "",
      slug: crypto.randomUUID(),
      status: "draft",
      language,
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
