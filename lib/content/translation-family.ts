import { createAdminClient } from "@/lib/supabase/admin";

type TranslationFamilyRow = {
  id: string;
  translation_source_id?: string | null;
};

export async function getTranslationFamilyIds(
  contentItemId: string
): Promise<string[]> {
  if (!contentItemId) {
    return [];
  }

  const supabase = createAdminClient();
  const { data: currentItem, error: currentItemError } = await supabase
    .from("content_items")
    .select("id, translation_source_id")
    .eq("id", contentItemId)
    .maybeSingle<TranslationFamilyRow>();

  if (currentItemError) {
    console.error("[getTranslationFamilyIds:currentItem]", currentItemError);
    return [contentItemId];
  }

  if (!currentItem) {
    return [contentItemId];
  }

  const rootId = currentItem.translation_source_id ?? currentItem.id;
  const familyIds = new Set<string>([rootId, currentItem.id]);

  const { data: siblingRows, error: siblingRowsError } = await supabase
    .from("content_items")
    .select("id")
    .eq("translation_source_id", rootId)
    .returns<Array<Pick<TranslationFamilyRow, "id">>>();

  if (siblingRowsError) {
    console.error("[getTranslationFamilyIds:siblings]", siblingRowsError);
    return Array.from(familyIds);
  }

  for (const row of siblingRows ?? []) {
    if (row.id) {
      familyIds.add(row.id);
    }
  }

  return Array.from(familyIds);
}
