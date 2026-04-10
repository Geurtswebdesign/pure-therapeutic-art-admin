import "server-only";

import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import {
  DEFAULT_PRIMARY_LANGUAGE,
  getLanguageBaseCode,
  normalizeLanguageCode,
} from "@/lib/i18n/languages";
import { createAdminClient } from "@/lib/supabase/admin";

export type TranslatableContentRow = {
  id: string;
  language: string | null;
  translation_source_id?: string | null;
};

export function getTranslationRootId(row: Pick<TranslatableContentRow, "id" | "translation_source_id">) {
  return row.translation_source_id ?? row.id;
}

function getLanguageRank(
  language: string | null | undefined,
  targetLanguage: string
) {
  const normalizedLanguage = normalizeLanguageCode(language ?? "");
  if (!normalizedLanguage || !targetLanguage) {
    return 0;
  }

  if (normalizedLanguage === targetLanguage) {
    return 2;
  }

  if (getLanguageBaseCode(normalizedLanguage) === getLanguageBaseCode(targetLanguage)) {
    return 1;
  }

  return 0;
}

function getRowPreferenceScore<T extends TranslatableContentRow>(
  row: T,
  preferredLanguage: string,
  fallbackLanguage: string
) {
  return (
    getLanguageRank(row.language, preferredLanguage) * 100 +
    getLanguageRank(row.language, fallbackLanguage) * 10 +
    (row.translation_source_id ? 0 : 1)
  );
}

export function pickPreferredTranslation<T extends TranslatableContentRow>(
  rows: readonly T[],
  preferredLanguage: string,
  fallbackLanguage: string
): T | null {
  let bestRow: T | null = null;
  let bestScore = -1;

  for (const row of rows) {
    const score = getRowPreferenceScore(row, preferredLanguage, fallbackLanguage);
    if (!bestRow || score > bestScore) {
      bestRow = row;
      bestScore = score;
    }
  }

  return bestRow;
}

export function collapseToPreferredTranslations<T extends TranslatableContentRow>(
  rows: readonly T[],
  preferredLanguage: string,
  fallbackLanguage: string
): T[] {
  const grouped = new Map<
    string,
    { row: T; score: number; index: number }
  >();

  rows.forEach((row, index) => {
    const familyId = getTranslationRootId(row);
    const score = getRowPreferenceScore(row, preferredLanguage, fallbackLanguage);
    const current = grouped.get(familyId);

    if (!current || score > current.score) {
      grouped.set(familyId, { row, score, index });
    }
  });

  return Array.from(grouped.values())
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.row);
}

export async function getContentLanguagePreference(preferredLanguage?: string | null) {
  const fallbackLanguage =
    normalizeLanguageCode(await getPrimaryLanguage()) || DEFAULT_PRIMARY_LANGUAGE;
  const normalizedPreferred =
    normalizeLanguageCode(preferredLanguage ?? "") || fallbackLanguage;

  return {
    preferredLanguage: normalizedPreferred,
    fallbackLanguage,
  };
}

export async function getPreferredPublishedContentMapByIds<
  T extends TranslatableContentRow,
>(input: {
  contentIds: string[];
  preferredLanguage?: string | null;
  select: string;
}): Promise<Map<string, T>> {
  const uniqueIds = Array.from(new Set(input.contentIds.filter(Boolean)));
  if (!uniqueIds.length) {
    return new Map<string, T>();
  }

  const supabase = createAdminClient();
  const { preferredLanguage, fallbackLanguage } = await getContentLanguagePreference(
    input.preferredLanguage
  );

  const { data: baseRows, error: baseRowsError } = await supabase
    .from("content_items")
    .select("id, translation_source_id")
    .in("id", uniqueIds)
    .returns<Array<Pick<TranslatableContentRow, "id" | "translation_source_id">>>();

  if (baseRowsError) {
    throw baseRowsError;
  }

  const requestedRows = (baseRows ?? []).filter((row) => Boolean(row.id));
  if (!requestedRows.length) {
    return new Map<string, T>();
  }

  const rootIds = Array.from(
    new Set(requestedRows.map((row) => getTranslationRootId(row)))
  );
  const familyFilter = rootIds
    .map((rootId) => `id.eq.${rootId},translation_source_id.eq.${rootId}`)
    .join(",");

  const { data: familyRows, error: familyRowsError } = await supabase
    .from("content_items")
    .select(input.select)
    .eq("status", "published")
    .or(familyFilter)
    .returns<T[]>();

  if (familyRowsError) {
    throw familyRowsError;
  }

  const rowsByRootId = new Map<string, T[]>();
  for (const row of familyRows ?? []) {
    const familyId = getTranslationRootId(row);
    const currentRows = rowsByRootId.get(familyId) ?? [];
    currentRows.push(row);
    rowsByRootId.set(familyId, currentRows);
  }

  const result = new Map<string, T>();
  for (const requestedRow of requestedRows) {
    const familyId = getTranslationRootId(requestedRow);
    const familyRowsForRoot = rowsByRootId.get(familyId) ?? [];
    const preferredRow = pickPreferredTranslation(
      familyRowsForRoot,
      preferredLanguage,
      fallbackLanguage
    );

    if (preferredRow) {
      result.set(requestedRow.id, preferredRow);
    }
  }

  return result;
}
