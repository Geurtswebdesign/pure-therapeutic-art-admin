import "server-only";

import {
  DEFAULT_PRIMARY_LANGUAGE,
  getLanguageBaseCode,
  normalizeLanguageCode,
} from "@/lib/i18n/languages";
import { createAdminClient } from "@/lib/supabase/admin";

type ThemeTranslationRow = {
  language: string | null;
};

export type ThemePageTranslationRow = ThemeTranslationRow & {
  theme_page_id: string;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  hero_image_alt: string | null;
};

export type ThemeSectionTranslationRow = ThemeTranslationRow & {
  theme_section_id: string;
  title: string | null;
  description: string | null;
  section_image_alt: string | null;
};

export type ThemeSectionItemTranslationRow = ThemeTranslationRow & {
  theme_section_item_id: string;
  custom_title: string | null;
  custom_excerpt: string | null;
  override_image_alt: string | null;
};

function isMissingThemeTranslationTableError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) return false;

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /content_theme_(page|section|section_item)_translations/.test(
      error.message ?? ""
    )
  );
}

function getLanguageMatchScore(
  language: string | null | undefined,
  preferredLanguage: string
) {
  const normalizedLanguage = normalizeLanguageCode(language ?? "");
  if (!normalizedLanguage || !preferredLanguage) {
    return 0;
  }

  if (normalizedLanguage === preferredLanguage) {
    return 2;
  }

  if (getLanguageBaseCode(normalizedLanguage) === getLanguageBaseCode(preferredLanguage)) {
    return 1;
  }

  return 0;
}

function pickPreferredThemeTranslation<T extends ThemeTranslationRow>(
  rows: readonly T[],
  preferredLanguage: string
) {
  let bestRow: T | null = null;
  let bestScore = 0;

  for (const row of rows) {
    const score = getLanguageMatchScore(row.language, preferredLanguage);
    if (!bestRow || score > bestScore) {
      bestRow = row;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestRow : null;
}

async function getPreferredThemeTranslationMapByForeignId<T extends ThemeTranslationRow>(
  input: {
    table: string;
    foreignKey: string;
    ids: string[];
    select: string;
    preferredLanguage?: string | null;
  }
): Promise<Map<string, T>> {
  const uniqueIds = Array.from(new Set(input.ids.filter(Boolean)));
  const preferredLanguage = normalizeLanguageCode(input.preferredLanguage ?? "");

  if (!uniqueIds.length) {
    return new Map<string, T>();
  }

  if (
    !preferredLanguage ||
    getLanguageBaseCode(preferredLanguage) ===
      getLanguageBaseCode(DEFAULT_PRIMARY_LANGUAGE)
  ) {
    return new Map<string, T>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(input.table)
    .select(input.select)
    .in(input.foreignKey, uniqueIds)
    .returns<T[]>();

  if (error) {
    if (isMissingThemeTranslationTableError(error)) {
      return new Map<string, T>();
    }

    throw error;
  }

  const rowsByForeignId = new Map<string, T[]>();
  for (const row of data ?? []) {
    const foreignId = (row as Record<string, unknown>)[input.foreignKey];
    if (typeof foreignId !== "string" || !foreignId) {
      continue;
    }

    const currentRows = rowsByForeignId.get(foreignId) ?? [];
    currentRows.push(row);
    rowsByForeignId.set(foreignId, currentRows);
  }

  const result = new Map<string, T>();
  for (const id of uniqueIds) {
    const preferredRow = pickPreferredThemeTranslation(
      rowsByForeignId.get(id) ?? [],
      preferredLanguage
    );

    if (preferredRow) {
      result.set(id, preferredRow);
    }
  }

  return result;
}

function resolveRequiredText(
  translatedValue: string | null | undefined,
  fallbackValue: string
) {
  const normalized = translatedValue?.trim();
  return normalized ? translatedValue! : fallbackValue;
}

function resolveOptionalText(
  translatedValue: string | null | undefined,
  fallbackValue: string | null
) {
  const normalized = translatedValue?.trim();
  return normalized ? translatedValue! : fallbackValue;
}

export async function getPreferredThemePageTranslationMap(
  themePageIds: string[],
  preferredLanguage?: string | null
) {
  return getPreferredThemeTranslationMapByForeignId<ThemePageTranslationRow>({
    table: "content_theme_page_translations",
    foreignKey: "theme_page_id",
    ids: themePageIds,
    preferredLanguage,
    select:
      "theme_page_id, language, eyebrow, title, description, hero_image_alt",
  });
}

export async function getPreferredThemeSectionTranslationMap(
  themeSectionIds: string[],
  preferredLanguage?: string | null
) {
  return getPreferredThemeTranslationMapByForeignId<ThemeSectionTranslationRow>({
    table: "content_theme_section_translations",
    foreignKey: "theme_section_id",
    ids: themeSectionIds,
    preferredLanguage,
    select: "theme_section_id, language, title, description, section_image_alt",
  });
}

export async function getPreferredThemeSectionItemTranslationMap(
  themeSectionItemIds: string[],
  preferredLanguage?: string | null
) {
  return getPreferredThemeTranslationMapByForeignId<ThemeSectionItemTranslationRow>({
    table: "content_theme_section_item_translations",
    foreignKey: "theme_section_item_id",
    ids: themeSectionItemIds,
    preferredLanguage,
    select:
      "theme_section_item_id, language, custom_title, custom_excerpt, override_image_alt",
  });
}

export function applyThemePageTranslation<
  T extends {
    eyebrow: string | null;
    title: string;
    description: string | null;
    hero_image_alt: string | null;
  },
>(page: T, translation?: ThemePageTranslationRow | null): T {
  if (!translation) {
    return page;
  }

  return {
    ...page,
    eyebrow: resolveOptionalText(translation.eyebrow, page.eyebrow),
    title: resolveRequiredText(translation.title, page.title),
    description: resolveOptionalText(translation.description, page.description),
    hero_image_alt: resolveOptionalText(
      translation.hero_image_alt,
      page.hero_image_alt
    ),
  };
}

export function applyThemeSectionTranslation<
  T extends {
    title: string;
    description: string | null;
    section_image_alt: string | null;
  },
>(section: T, translation?: ThemeSectionTranslationRow | null): T {
  if (!translation) {
    return section;
  }

  return {
    ...section,
    title: resolveRequiredText(translation.title, section.title),
    description: resolveOptionalText(
      translation.description,
      section.description
    ),
    section_image_alt: resolveOptionalText(
      translation.section_image_alt,
      section.section_image_alt
    ),
  };
}

export function applyThemeSectionItemTranslation<
  T extends {
    custom_title: string | null;
    custom_excerpt: string | null;
    override_image_alt: string | null;
  },
>(item: T, translation?: ThemeSectionItemTranslationRow | null): T {
  if (!translation) {
    return item;
  }

  return {
    ...item,
    custom_title: resolveOptionalText(translation.custom_title, item.custom_title),
    custom_excerpt: resolveOptionalText(
      translation.custom_excerpt,
      item.custom_excerpt
    ),
    override_image_alt: resolveOptionalText(
      translation.override_image_alt,
      item.override_image_alt
    ),
  };
}
