"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sanitizeAccordionSections,
  type AccordionSection,
} from "@/lib/content/accordionSections";


type ContentStatus = "all" | "draft" | "published" | "archived";

export async function updateContentItem({
  id,
  title,
  body,
  status,
  slug,
  excerpt,
  published_at,
  featured_image_url,
  featured_image_alt,
  credit_cost,
  language,
  category_term_ids,
  tag_term_ids,
  accordion_sections,
}: {
  id: string;
  title?: string;
  body?: string;
  status?: ContentStatus;
  slug?: string;
  excerpt?: string | null;
  published_at?: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  credit_cost?: number;
  language?: string;
  category_term_ids?: string[];
  tag_term_ids?: string[];
  accordion_sections?: AccordionSection[];
}) {
  const update: Partial<{
    title: string;
    body: string;
    status: ContentStatus;
    slug: string;
    excerpt: string | null;
    published_at: string | null;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    credit_cost: number;
    language: string;
  }> = {};

  if (title !== undefined) update.title = title;
  if (body !== undefined) update.body = body;
  if (status !== undefined) update.status = status;
  if (slug !== undefined) update.slug = slug;
  if (excerpt !== undefined) update.excerpt = excerpt;
  if (published_at !== undefined) update.published_at = published_at;
  if (featured_image_url !== undefined) update.featured_image_url = featured_image_url;
  if (featured_image_alt !== undefined) update.featured_image_alt = featured_image_alt;
  if (credit_cost !== undefined) update.credit_cost = credit_cost;
  if (language !== undefined) update.language = language;

  const hasItemChanges = Object.keys(update).length > 0;
  if (hasItemChanges) {
    const { error } = await supabaseAdmin
      .from("content_items")
      .update(update)
      .eq("id", id);

    if (error) {
      console.error("[updateContentItem:content_items]", error);
      throw new Error(`Content opslaan mislukt: ${error.message}`);
    }
  }

  async function syncTaxonomyTerms(taxonomySlug: string, selectedTermIds: string[]) {
    const { data: categoryTaxonomy, error: taxonomyError } = await supabaseAdmin
      .from("content_taxonomies")
      .select("id")
      .eq("slug", taxonomySlug)
      .maybeSingle();

    if (taxonomyError) {
      console.error(`[updateContentItem:${taxonomySlug}:taxonomy]`, taxonomyError);
      throw new Error(`Taxonomy laden mislukt (${taxonomySlug}): ${taxonomyError.message}`);
    }

    if (categoryTaxonomy) {
      const { data: categoryTerms, error: termsError } = await supabaseAdmin
        .from("content_terms")
        .select("id")
        .eq("taxonomy_id", categoryTaxonomy.id);

      if (termsError) {
        console.error(`[updateContentItem:${taxonomySlug}:terms]`, termsError);
        throw new Error(`Termen laden mislukt (${taxonomySlug}): ${termsError.message}`);
      }

      const allCategoryTermIds = (categoryTerms ?? []).map((term) => term.id);
      if (allCategoryTermIds.length > 0) {
        const { error: deleteError } = await supabaseAdmin
          .from("content_term_relationships")
          .delete()
          .eq("content_item_id", id)
          .in("term_id", allCategoryTermIds);

        if (deleteError) {
          console.error(`[updateContentItem:${taxonomySlug}:delete]`, deleteError);
          throw new Error(`Bestaande relaties verwijderen mislukt (${taxonomySlug}): ${deleteError.message}`);
        }
      }

      const selectedSet = new Set(selectedTermIds);
      const validSelectedIds = allCategoryTermIds.filter((termId) => selectedSet.has(termId));

      if (validSelectedIds.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from("content_term_relationships")
          .insert(validSelectedIds.map((termId) => ({
            content_item_id: id,
            term_id: termId,
          })));

        if (insertError) {
          console.error(`[updateContentItem:${taxonomySlug}:insert]`, insertError);
          throw new Error(`Relaties opslaan mislukt (${taxonomySlug}): ${insertError.message}`);
        }
      }
    }
  }

  if (category_term_ids !== undefined) {
    await syncTaxonomyTerms("category", category_term_ids);
  }

  if (tag_term_ids !== undefined) {
    await syncTaxonomyTerms("tag", tag_term_ids);
  }

  if (accordion_sections !== undefined) {
    const sanitizedSections = sanitizeAccordionSections(accordion_sections);

    const { data: existingAccordionBlocks, error: existingAccordionError } =
      await supabaseAdmin
        .from("content_blocks")
        .select("id")
        .eq("content_item_id", id)
        .eq("type", "accordion")
        .order("order_index", { ascending: true });

    if (existingAccordionError) {
      console.error("[updateContentItem:accordion:load]", existingAccordionError);
      throw new Error(
        `Accordion laden mislukt: ${existingAccordionError.message}`
      );
    }

    const existingIds = (existingAccordionBlocks ?? [])
      .map((block) => block.id)
      .filter((value): value is string => Boolean(value));

    if (!sanitizedSections.length) {
      if (existingIds.length) {
        const { error: deleteAccordionError } = await supabaseAdmin
          .from("content_blocks")
          .delete()
          .in("id", existingIds);

        if (deleteAccordionError) {
          console.error(
            "[updateContentItem:accordion:delete]",
            deleteAccordionError
          );
          throw new Error(
            `Accordion verwijderen mislukt: ${deleteAccordionError.message}`
          );
        }
      }
    } else {
      const { data: lastNonAccordionBlock, error: lastBlockError } =
        await supabaseAdmin
          .from("content_blocks")
          .select("order_index")
          .eq("content_item_id", id)
          .neq("type", "accordion")
          .order("order_index", { ascending: false })
          .limit(1)
          .maybeSingle<{ order_index: number | null }>();

      if (lastBlockError) {
        console.error("[updateContentItem:accordion:lastBlock]", lastBlockError);
        throw new Error(
          `Accordion positie bepalen mislukt: ${lastBlockError.message}`
        );
      }

      const orderIndex = (lastNonAccordionBlock?.order_index ?? -1) + 1;
      const payload = {
        content_item_id: id,
        type: "accordion",
        order_index: orderIndex,
        data: {
          items: sanitizedSections,
        },
      };

      const [primaryId, ...extraIds] = existingIds;

      if (primaryId) {
        const { error: updateAccordionError } = await supabaseAdmin
          .from("content_blocks")
          .update({
            order_index: orderIndex,
            data: payload.data,
          })
          .eq("id", primaryId);

        if (updateAccordionError) {
          console.error(
            "[updateContentItem:accordion:update]",
            updateAccordionError
          );
          throw new Error(
            `Accordion opslaan mislukt: ${updateAccordionError.message}`
          );
        }

        if (extraIds.length) {
          const { error: cleanupAccordionError } = await supabaseAdmin
            .from("content_blocks")
            .delete()
            .in("id", extraIds);

          if (cleanupAccordionError) {
            console.error(
              "[updateContentItem:accordion:cleanup]",
              cleanupAccordionError
            );
            throw new Error(
              `Accordion opschonen mislukt: ${cleanupAccordionError.message}`
            );
          }
        }
      } else {
        const { error: insertAccordionError } = await supabaseAdmin
          .from("content_blocks")
          .insert(payload);

        if (insertAccordionError) {
          console.error(
            "[updateContentItem:accordion:insert]",
            insertAccordionError
          );
          throw new Error(
            `Accordion toevoegen mislukt: ${insertAccordionError.message}`
          );
        }
      }
    }
  }
}

export async function deleteContentItem(id: string) {
  if (!id) {
    throw new Error("Missing content id");
  }

  const { error } = await supabaseAdmin
    .from("content_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete content failed", error);
    throw new Error("Failed to delete content");
  }

  return { success: true };
}
