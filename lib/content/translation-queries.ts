import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ContentTranslationSummary = {
  id: string;
  title: string | null;
  slug: string | null;
  status: string | null;
  language: string | null;
  isSource: boolean;
};

type ContentItemTranslationRow = {
  id: string;
  title: string | null;
  slug: string | null;
  status: string | null;
  language: string | null;
  translation_source_id?: string | null;
};

export async function getContentTranslationGroup(
  contentItemId: string
): Promise<ContentTranslationSummary[]> {
  try {
    const supabase = createAdminClient();
    const { data: currentItem, error: currentError } = await supabase
      .from("content_items")
      .select("id, title, slug, status, language, translation_source_id")
      .eq("id", contentItemId)
      .maybeSingle<ContentItemTranslationRow>();

    if (currentError || !currentItem) {
      return [];
    }

    const rootId = currentItem.translation_source_id ?? currentItem.id;

    const { data: translations, error: translationsError } = await supabase
      .from("content_items")
      .select("id, title, slug, status, language, translation_source_id")
      .eq("translation_source_id", rootId)
      .order("language", { ascending: true })
      .returns<ContentItemTranslationRow[]>();

    if (translationsError) {
      return [];
    }

    let sourceRow = currentItem;
    if (rootId !== currentItem.id) {
      const { data: fetchedRoot, error: rootError } = await supabase
        .from("content_items")
        .select("id, title, slug, status, language, translation_source_id")
        .eq("id", rootId)
        .maybeSingle<ContentItemTranslationRow>();

      if (rootError || !fetchedRoot) {
        return [];
      }

      sourceRow = fetchedRoot;
    }

    return [
      {
        id: sourceRow.id,
        title: sourceRow.title,
        slug: sourceRow.slug,
        status: sourceRow.status,
        language: sourceRow.language,
        isSource: true,
      },
      ...(translations ?? []).map((translation) => ({
        id: translation.id,
        title: translation.title,
        slug: translation.slug,
        status: translation.status,
        language: translation.language,
        isSource: false,
      })),
    ].filter(
      (value, index, array) =>
        array.findIndex((entry) => entry.id === value.id) === index
    );
  } catch {
    return [];
  }
}
