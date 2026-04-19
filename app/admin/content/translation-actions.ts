"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupportedLanguageCodes } from "@/lib/i18n/settings";
import { isKnownLanguage, normalizeLanguageCode } from "@/lib/i18n/languages";
import {
  extractAccordionSectionsFromBlocks,
  sanitizeAccordionSections,
  type AccordionSection,
} from "@/lib/content/accordionSections";
import { parseContentBlocks } from "@/lib/content/renderer";
import { translateContentPayload } from "@/lib/content/translation-service";
import { normalizeContentItemType } from "@/lib/content/item-types";

type ContentItemRow = {
  id: string;
  title: string | null;
  body: string | null;
  slug: string | null;
  excerpt: string | null;
  featured_image_alt: string | null;
  featured_image_url: string | null;
  credit_cost: number | null;
  language: string | null;
  item_type?: string | null;
  translation_source_id?: string | null;
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureTranslationColumnSupport() {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("content_items")
    .select("id, translation_source_id")
    .limit(1);

  if (error) {
    throw new Error(
      "De database mist nog translation_source_id op content_items. Voer eerst sql/content_item_translation_source.sql uit."
    );
  }
}

async function buildUniqueSlug(
  preferredSlug: string,
  targetLanguage: string
): Promise<string> {
  const supabase = createAdminClient();
  const normalizedTarget = normalizeLanguageCode(targetLanguage);
  const baseSlug = slugify(preferredSlug) || `content-${normalizedTarget}`;
  const candidates = [baseSlug, `${baseSlug}-${normalizedTarget}`];

  for (let index = 2; index <= 50; index += 1) {
    candidates.push(`${baseSlug}-${normalizedTarget}-${index}`);
  }

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("content_items")
      .select("id")
      .eq("slug", candidate)
      .limit(1);

    if (error) {
      throw new Error(`Slugcontrole mislukt: ${error.message}`);
    }

    if (!data?.length) {
      return candidate;
    }
  }

  throw new Error("Kon geen unieke slug genereren voor de vertaling.");
}

function translateAccordionBlockData(
  data: unknown,
  translatedSections: AccordionSection[]
) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  return {
    ...(data as Record<string, unknown>),
    items: translatedSections,
  };
}

export async function translateContentItemToLanguage(input: {
  contentItemId: string;
  targetLanguage: string;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  await ensureTranslationColumnSupport();

  const normalizedTargetLanguage = normalizeLanguageCode(input.targetLanguage);
  const supportedLanguages = await getSupportedLanguageCodes();
  if (!isKnownLanguage(normalizedTargetLanguage, supportedLanguages)) {
    throw new Error("De gekozen doeltaal is niet toegestaan in de app-instellingen.");
  }

  const supabase = createAdminClient();
  const { data: sourceItem, error: sourceError } = await supabase
    .from("content_items")
    .select(
      "id, title, body, slug, excerpt, featured_image_alt, featured_image_url, credit_cost, language, item_type, translation_source_id"
    )
    .eq("id", input.contentItemId)
    .maybeSingle<ContentItemRow>();

  if (sourceError || !sourceItem) {
    throw new Error(sourceError?.message || "Content-item niet gevonden.");
  }

  const sourceLanguage = normalizeLanguageCode(sourceItem.language ?? "");
  if (!sourceLanguage) {
    throw new Error("Het bronitem heeft geen geldige taalcode.");
  }

  if (sourceLanguage === normalizedTargetLanguage) {
    throw new Error("Bron- en doeltaal mogen niet gelijk zijn.");
  }

  const translationRootId = sourceItem.translation_source_id ?? sourceItem.id;
  const { data: existingTranslation, error: existingError } = await supabase
    .from("content_items")
    .select("id")
    .eq("translation_source_id", translationRootId)
    .eq("language", normalizedTargetLanguage)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingTranslation?.id) {
    return {
      contentItemId: existingTranslation.id,
      created: false,
    };
  }

  const [{ data: rawBlocks, error: blocksError }, { data: relationships, error: relError }] =
    await Promise.all([
      supabase
        .from("content_blocks")
        .select("type, data, order_index")
        .eq("content_item_id", sourceItem.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("content_term_relationships")
        .select("term_id")
        .eq("content_item_id", sourceItem.id),
    ]);

  if (blocksError) {
    throw new Error(`Contentblokken laden mislukt: ${blocksError.message}`);
  }

  if (relError) {
    throw new Error(`Termrelaties laden mislukt: ${relError.message}`);
  }

  const accordionSections = sanitizeAccordionSections(
    extractAccordionSectionsFromBlocks(parseContentBlocks(rawBlocks ?? []))
  );
  const translated = await translateContentPayload({
    sourceLanguage,
    targetLanguage: normalizedTargetLanguage,
    title: sourceItem.title ?? "",
    slug: sourceItem.slug ?? "",
    excerpt: sourceItem.excerpt,
    body: sourceItem.body ?? "",
    featuredImageAlt: sourceItem.featured_image_alt,
    accordionSections,
  });
  const translatedSlug = await buildUniqueSlug(
    translated.slug || sourceItem.slug || sourceItem.id,
    normalizedTargetLanguage
  );

  const { data: createdItem, error: createError } = await supabase
    .from("content_items")
    .insert({
      title: translated.title,
      body: translated.body,
      slug: translatedSlug,
      excerpt: translated.excerpt,
      featured_image_alt: translated.featuredImageAlt,
      featured_image_url: sourceItem.featured_image_url,
      credit_cost: sourceItem.credit_cost ?? 0,
      item_type: normalizeContentItemType(sourceItem.item_type),
      language: normalizedTargetLanguage,
      status: "draft",
      translation_source_id: translationRootId,
    })
    .select("id")
    .single<{ id: string }>();

  if (createError || !createdItem) {
    throw new Error(createError?.message || "Vertaalde content aanmaken mislukt.");
  }

  if (relationships?.length) {
    const { error: insertRelationshipError } = await supabase
      .from("content_term_relationships")
      .insert(
        relationships.map((relationship) => ({
          content_item_id: createdItem.id,
          term_id: relationship.term_id,
        }))
      );

    if (insertRelationshipError) {
      throw new Error(
        `Termrelaties kopieren mislukt: ${insertRelationshipError.message}`
      );
    }
  }

  if (rawBlocks?.length) {
    const { error: insertBlocksError } = await supabase
      .from("content_blocks")
      .insert(
        rawBlocks.map((block) => ({
          content_item_id: createdItem.id,
          type: block.type,
          order_index: block.order_index,
          data:
            block.type === "accordion"
              ? translateAccordionBlockData(
                  block.data,
                  translated.accordionSections
                )
              : block.data,
        }))
      );

    if (insertBlocksError) {
      throw new Error(
        `Contentblokken kopieren mislukt: ${insertBlocksError.message}`
      );
    }
  }

  revalidatePath(`/admin/content/${sourceItem.id}`);
  revalidatePath(`/admin/content/${createdItem.id}`);
  revalidatePath("/admin/content");

  return {
    contentItemId: createdItem.id,
    created: true,
  };
}
