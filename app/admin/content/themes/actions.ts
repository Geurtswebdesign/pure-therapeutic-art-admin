"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ThemePageDraft } from "@/lib/content/theme-admin";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeSectionItems(section: ThemePageDraft["sections"][number]) {
  const seenContentItemIds = new Set<string>();

  return section.items.flatMap((item, itemIndex) => {
    const contentItemId = item.contentItemId.trim();

    if (!contentItemId) {
      return [];
    }

    if (seenContentItemIds.has(contentItemId)) {
      throw new Error(
        `Een content-item kan maar een keer in dezelfde sectie voorkomen (${section.title || section.slug || "zonder titel"}).`
      );
    }

    seenContentItemIds.add(contentItemId);

    return [
      {
        theme_section_id: "",
        content_item_id: contentItemId,
        custom_title: item.customTitle || null,
        custom_excerpt: item.customExcerpt || null,
        featured: item.featured,
        override_image_url: item.overrideImageUrl || null,
        override_image_alt: item.overrideImageAlt || null,
        override_image_position: item.overrideImagePosition,
        sort_order: Number.isFinite(item.sortOrder)
          ? item.sortOrder
          : (itemIndex + 1) * 10,
      },
    ];
  });
}

export async function saveThemePage(input: ThemePageDraft) {
  const supabase = createAdminClient();
  const fallbackSlug = slugify(input.title || "thema");

  const pagePayload = {
    parent_theme_page_id: input.parentThemePageId || null,
    source_key: input.sourceKey || null,
    slug: input.slug || fallbackSlug,
    eyebrow: input.eyebrow || null,
    title: input.title || "Ongetiteld thema",
    description: input.description || null,
    hero_image_url: input.heroImageUrl || null,
    hero_image_alt: input.heroImageAlt || null,
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

  const { data: existingSections } = await supabase
    .from("content_theme_sections")
    .select("id")
    .eq("theme_page_id", themeId);

  const existingSectionIds = new Set(
    (existingSections ?? [])
      .map((section) => section.id)
      .filter((value): value is string => Boolean(value))
  );

  const keptSectionIds = new Set<string>();

  for (const [sectionIndex, section] of input.sections.entries()) {
    if (!section.title.trim()) continue;

    const sectionPayload = {
      theme_page_id: themeId,
      slug: section.slug || slugify(section.title),
      title: section.title,
      description: section.description || null,
      layout_style: section.layoutStyle,
      section_image_url: section.sectionImageUrl || null,
      section_image_alt: section.sectionImageAlt || null,
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
    const normalizedItems = normalizeSectionItems(section).map((item) => ({
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

  return { id: themeId, slug: savedSlug };
}

export async function deleteThemePage(id: string, slug?: string | null) {
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

  return { success: true };
}
