"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSupabaseStorageUrl } from "@/lib/images/supabaseStorageUrl";
import type { ThemePageDraft } from "@/lib/content/theme-admin";

type ThemeActionSuccess = {
  ok: true;
  id: string;
  slug: string;
};

type ThemeActionFailure = {
  ok: false;
  error: string;
};

export type ThemeActionResult = ThemeActionSuccess | ThemeActionFailure;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getContentItemFamilyId(
  contentItemId: string,
  contentItemFamilyIdByItemId: Map<string, string>
) {
  return contentItemFamilyIdByItemId.get(contentItemId) ?? contentItemId;
}

function normalizeSectionItems(
  section: ThemePageDraft["sections"][number],
  contentItemFamilyIdByItemId: Map<string, string>
) {
  const seenContentFamilyIds = new Set<string>();

  return section.items.flatMap((item, itemIndex) => {
    const contentItemId = item.contentItemId.trim();

    if (!contentItemId) {
      return [];
    }

    const contentFamilyId = getContentItemFamilyId(
      contentItemId,
      contentItemFamilyIdByItemId
    );

    if (seenContentFamilyIds.has(contentFamilyId)) {
      throw new Error(
        `Een content-item kan maar een keer in dezelfde sectie voorkomen (${section.title || section.slug || "zonder titel"}).`
      );
    }

    seenContentFamilyIds.add(contentFamilyId);

    return [
      {
        theme_section_id: "",
        content_item_id: contentItemId,
        custom_title: item.customTitle || null,
        custom_excerpt: item.customExcerpt || null,
        featured: item.featured,
        override_image_url:
          normalizeSupabaseStorageUrl(item.overrideImageUrl) || null,
        override_image_alt: item.overrideImageAlt || null,
        override_image_position: item.overrideImagePosition,
        sort_order: Number.isFinite(item.sortOrder)
          ? item.sortOrder
          : (itemIndex + 1) * 10,
      },
    ];
  });
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getNormalizedSectionSlug(section: ThemePageDraft["sections"][number]) {
  const sectionSlug = (section.slug || slugify(section.title)).trim();

  if (!sectionSlug) {
    throw new Error("Elke sectie die je bewaart heeft een slug nodig.");
  }

  return sectionSlug;
}

function validateSectionSlugs(sections: ThemePageDraft["sections"]) {
  const seenSlugs = new Map<string, string>();

  for (const section of sections) {
    if (!section.title.trim()) continue;

    const sectionSlug = getNormalizedSectionSlug(section);
    const existingTitle = seenSlugs.get(sectionSlug);

    if (existingTitle) {
      throw new Error(
        `De secties "${existingTitle}" en "${section.title}" hebben dezelfde slug "${sectionSlug}". Geef elke sectie een unieke slug.`
      );
    }

    seenSlugs.set(sectionSlug, section.title);
  }
}

async function validateThemeUniqueness(
  input: ThemePageDraft,
  supabase: ReturnType<typeof createAdminClient>,
  themeSlug: string
) {
  const normalizedSourceKey = normalizeOptionalText(input.sourceKey);

  let slugQuery = supabase
    .from("content_theme_pages")
    .select("id, title")
    .eq("slug", themeSlug)
    .limit(1);

  if (input.id) {
    slugQuery = slugQuery.neq("id", input.id);
  }

  const { data: slugConflict, error: slugError } = await slugQuery.maybeSingle<{
    id: string;
    title: string;
  }>();

  if (slugError) {
    throw new Error(`Bestaande thema-slugs controleren mislukt: ${slugError.message}`);
  }

  if (slugConflict) {
    throw new Error(
      `De slug "${themeSlug}" wordt al gebruikt door "${slugConflict.title}". Kies een unieke slug.`
    );
  }

  if (!normalizedSourceKey) {
    return;
  }

  let sourceKeyQuery = supabase
    .from("content_theme_pages")
    .select("id, title")
    .eq("source_key", normalizedSourceKey)
    .limit(1);

  if (input.id) {
    sourceKeyQuery = sourceKeyQuery.neq("id", input.id);
  }

  const { data: sourceKeyConflict, error: sourceKeyError } =
    await sourceKeyQuery.maybeSingle<{
      id: string;
      title: string;
    }>();

  if (sourceKeyError) {
    throw new Error(
      `Bestaande bronkoppelingen controleren mislukt: ${sourceKeyError.message}`
    );
  }

  if (sourceKeyConflict) {
    throw new Error(
      `De bronsleutel "${normalizedSourceKey}" is al gekoppeld aan "${sourceKeyConflict.title}".`
    );
  }
}

async function validatePrimaryCategoryTerm(
  primaryCategoryTermId: string | null,
  supabase: ReturnType<typeof createAdminClient>
) {
  if (!primaryCategoryTermId) {
    return;
  }

  const { data, error } = await supabase
    .from("content_terms")
    .select("id, name, parent_id, is_homepage_seed")
    .eq("id", primaryCategoryTermId)
    .maybeSingle<{
      id: string;
      name: string;
      parent_id: string | null;
      is_homepage_seed: boolean | null;
    }>();

  if (error) {
    throw new Error(`Themacategorie laden mislukt: ${error.message}`);
  }

  if (!data) {
    throw new Error("De gekozen themacategorie bestaat niet meer.");
  }

  if (data.is_homepage_seed || !data.parent_id) {
    throw new Error(
      `Koppel een thema aan een gewone categorie onder een seed-categorie. "${data.name}" is geen geldige themacategorie.`
    );
  }
}

async function saveThemePageInternal(
  input: ThemePageDraft
): Promise<ThemeActionSuccess> {
  const supabase = createAdminClient();
  const fallbackSlug = slugify(input.title || "thema");
  const themeSlug = (input.slug || fallbackSlug).trim();

  if (!themeSlug) {
    throw new Error("Geef het thema een slug.");
  }

  validateSectionSlugs(input.sections);
  await validatePrimaryCategoryTerm(input.primaryCategoryTermId || null, supabase);
  await validateThemeUniqueness(input, supabase, themeSlug);

  const pagePayload = {
    parent_theme_page_id: input.parentThemePageId || null,
    source_key: normalizeOptionalText(input.sourceKey),
    slug: themeSlug,
    eyebrow: normalizeOptionalText(input.eyebrow),
    title: input.title || "Ongetiteld thema",
    description: normalizeOptionalText(input.description),
    hero_image_url: normalizeSupabaseStorageUrl(
      normalizeOptionalText(input.heroImageUrl)
    ),
    hero_image_alt: normalizeOptionalText(input.heroImageAlt),
    hero_image_position: input.heroImagePosition,
    primary_category_term_id: input.primaryCategoryTermId || null,
    is_published: input.isPublished,
    sort_order: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
  };

  let themeId = input.id;
  let savedSlug = pagePayload.slug;

  if (themeId) {
    const { error } = await supabase
      .from("content_theme_pages")
      .update({
        ...pagePayload,
        parent_theme_page_id:
          input.parentThemePageId && input.parentThemePageId !== themeId
            ? input.parentThemePageId
            : null,
      })
      .eq("id", themeId);

    if (error) {
      throw new Error(`Thema opslaan mislukt: ${error.message}`);
    }
  } else {
    const { data, error } = await supabase
      .from("content_theme_pages")
      .insert(pagePayload)
      .select("id, slug")
      .single<{ id: string; slug: string }>();

    if (error || !data) {
      throw new Error(`Thema aanmaken mislukt: ${error?.message || "onbekende fout"}`);
    }

    themeId = data.id;
    savedSlug = data.slug;
  }

  const { data: existingSections, error: existingSectionsError } = await supabase
    .from("content_theme_sections")
    .select("id")
    .eq("theme_page_id", themeId);

  if (existingSectionsError) {
    throw new Error(
      `Bestaande secties laden mislukt: ${existingSectionsError.message}`
    );
  }

  const existingSectionIds = new Set(
    (existingSections ?? [])
      .map((section) => section.id)
      .filter((value): value is string => Boolean(value))
  );

  const contentItemIds = Array.from(
    new Set(
      input.sections.flatMap((section) =>
        section.items
          .map((item) => item.contentItemId.trim())
          .filter((contentItemId): contentItemId is string => Boolean(contentItemId))
      )
    )
  );
  const contentItemFamilyIdByItemId = new Map<string, string>();

  if (contentItemIds.length) {
    const { data: contentItems, error: contentItemsError } = await supabase
      .from("content_items")
      .select("id, translation_source_id")
      .in("id", contentItemIds);

    if (contentItemsError) {
      throw new Error(
        `Contentfamilies laden mislukt: ${contentItemsError.message}`
      );
    }

    for (const contentItem of contentItems ?? []) {
      if (!contentItem.id) continue;
      contentItemFamilyIdByItemId.set(
        contentItem.id,
        contentItem.translation_source_id ?? contentItem.id
      );
    }
  }

  const keptSectionIds = new Set<string>();

  for (const [sectionIndex, section] of input.sections.entries()) {
    if (!section.title.trim()) continue;

    const sectionSlug = getNormalizedSectionSlug(section);

    const sectionPayload = {
      theme_page_id: themeId,
      slug: sectionSlug,
      title: section.title,
      description: normalizeOptionalText(section.description),
      layout_style: section.layoutStyle,
      section_image_url: normalizeSupabaseStorageUrl(
        normalizeOptionalText(section.sectionImageUrl)
      ),
      section_image_alt: normalizeOptionalText(section.sectionImageAlt),
      section_image_position: section.sectionImagePosition,
      sort_order: Number.isFinite(section.sortOrder)
        ? section.sortOrder
        : (sectionIndex + 1) * 10,
    };

    let sectionId = section.id;

    if (sectionId) {
      const { error } = await supabase
        .from("content_theme_sections")
        .update(sectionPayload)
        .eq("id", sectionId);

      if (error) {
        throw new Error(`Sectie opslaan mislukt: ${error.message}`);
      }
    } else {
      const { data, error } = await supabase
        .from("content_theme_sections")
        .insert(sectionPayload)
        .select("id")
        .single<{ id: string }>();

      if (error || !data) {
        throw new Error(`Sectie aanmaken mislukt: ${error?.message || "onbekende fout"}`);
      }

      sectionId = data.id;
    }

    keptSectionIds.add(sectionId);
    const normalizedItems = normalizeSectionItems(
      section,
      contentItemFamilyIdByItemId
    ).map((item) => ({
      ...item,
      theme_section_id: sectionId,
    }));

    const { error: deleteItemsError } = await supabase
      .from("content_theme_section_items")
      .delete()
      .eq("theme_section_id", sectionId);

    if (deleteItemsError) {
      throw new Error(
        `Bestaande sectie-items verwijderen mislukt: ${deleteItemsError.message}`
      );
    }

    if (normalizedItems.length) {
      const { error: insertItemsError } = await supabase
        .from("content_theme_section_items")
        .insert(normalizedItems);

      if (insertItemsError) {
        throw new Error(
          `Sectie-items opslaan mislukt: ${insertItemsError.message}`
        );
      }
    }
  }

  const removableSectionIds = Array.from(existingSectionIds).filter(
    (id) => !keptSectionIds.has(id)
  );
  if (removableSectionIds.length) {
    const { error } = await supabase
      .from("content_theme_sections")
      .delete()
      .in("id", removableSectionIds);

    if (error) {
      throw new Error(`Oude secties verwijderen mislukt: ${error.message}`);
    }
  }

  revalidatePath("/admin/content/themes");
  revalidatePath("/content");
  revalidatePath("/content/themas");
  if (themeId) {
    revalidatePath(`/admin/content/themes/${themeId}`);
  }
  if (savedSlug) {
    revalidatePath(`/content/themas/${savedSlug}`);
  }

  return { ok: true, id: themeId, slug: savedSlug };
}

export async function saveThemePage(
  input: ThemePageDraft
): Promise<ThemeActionResult> {
  try {
    return await saveThemePageInternal(input);
  } catch (error) {
    console.error("saveThemePage failed", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Thema opslaan mislukt.",
    };
  }
}

async function deleteThemePageInternal(
  id: string,
  slug?: string | null
): Promise<ThemeActionSuccess> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("content_theme_pages")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Thema verwijderen mislukt: ${error.message}`);
  }

  revalidatePath("/admin/content/themes");
  revalidatePath("/content/themas");
  if (slug) {
    revalidatePath(`/content/themas/${slug}`);
  }

  return { ok: true, id, slug: slug ?? "" };
}

export async function deleteThemePage(
  id: string,
  slug?: string | null
): Promise<ThemeActionResult> {
  try {
    return await deleteThemePageInternal(id, slug);
  } catch (error) {
    console.error("deleteThemePage failed", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Thema verwijderen mislukt.",
    };
  }
}
