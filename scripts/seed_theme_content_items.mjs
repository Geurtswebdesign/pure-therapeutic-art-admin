#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILES = [".env.local", ".env"];
const DEFAULT_OUTPUT = "docs/theme-content-seed-report.json";
const INVALID_SOURCE_TITLES = new Set([
  "achtergrond",
  "in deze app vind je de volgende werkvormen",
]);
const DEFAULT_PRIMARY_LANGUAGE = "nl";

function parseArgs(argv) {
  const args = {
    dryRun: false,
    limit: null,
    output: DEFAULT_OUTPUT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (token === "--limit") {
      const next = Number(argv[index + 1]);
      args.limit = Number.isFinite(next) && next > 0 ? next : null;
      index += 1;
      continue;
    }
    if (token === "--output") {
      args.output = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

async function loadEnvFiles() {
  for (const fileName of DEFAULT_ENV_FILES) {
    const filePath = path.join(process.cwd(), fileName);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separator = trimmed.indexOf("=");
        if (separator === -1) continue;
        const key = trimmed.slice(0, separator).trim();
        if (!key || process.env[key]) continue;
        let value = trimmed.slice(separator + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    } catch {
      // optional file
    }
  }
}

function slugify(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeText(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-");
}

async function readJson(filePath) {
  const absolutePath = path.join(process.cwd(), filePath);
  return JSON.parse(await fs.readFile(absolutePath, "utf-8"));
}

function shouldSkipItemTitle(title) {
  return INVALID_SOURCE_TITLES.has(normalizeText(title));
}

function getPrimaryLanguage(settingsRow) {
  const candidate = settingsRow?.value?.primaryLanguage;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim().toLowerCase();
  }
  return DEFAULT_PRIMARY_LANGUAGE;
}

function makeContentSlug(themeSlug, itemSlug) {
  const value = slugify(`${themeSlug}-${itemSlug}`);
  return value.slice(0, 180);
}

function dedupeSectionItems(section) {
  const deduped = [];
  const seen = new Set();

  for (const item of section.items ?? []) {
    if (shouldSkipItemTitle(item.title)) {
      continue;
    }

    const key = normalizeText(item.title);
    if (!key || seen.has(key)) {
      continue;
    }

    deduped.push(item);
    seen.add(key);
  }

  return deduped;
}

async function writeOutput(outputPath, payload) {
  await fs.writeFile(
    path.join(process.cwd(), outputPath),
    JSON.stringify(payload, null, 2),
    "utf-8"
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvFiles();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase env vars ontbreken.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [sourceManifest, mediaManifest, settingsResult, pagesResult, sectionsResult, itemsResult, relationshipsResult, themeLinksResult] =
    await Promise.all([
      readJson("docs/theme-source-manifest.json"),
      readJson("docs/theme-media-import-map.json"),
      supabase
        .from("app_settings")
        .select("value")
        .eq("scope", "global")
        .is("scope_id", null)
        .eq("key", "general")
        .maybeSingle(),
      supabase
        .from("content_theme_pages")
        .select("id, source_key, slug, primary_category_term_id")
        .not("source_key", "is", null),
      supabase
        .from("content_theme_sections")
        .select("id, theme_page_id, slug, layout_style"),
      supabase
        .from("content_items")
        .select("id, slug, title, featured_image_url, featured_image_alt")
        .neq("status", "trash"),
      supabase
        .from("content_term_relationships")
        .select("content_item_id, term_id"),
      supabase
        .from("content_theme_section_items")
        .select("id, theme_section_id, content_item_id"),
    ]);

  for (const result of [
    settingsResult,
    pagesResult,
    sectionsResult,
    itemsResult,
    relationshipsResult,
    themeLinksResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const primaryLanguage = getPrimaryLanguage(settingsResult.data);
  const mediaBySourcePath = new Map(
    mediaManifest.media
      .filter((entry) => entry.publicUrl)
      .map((entry) => [entry.sourcePath, entry])
  );

  const pageBySourceKey = new Map(
    (pagesResult.data ?? []).map((page) => [page.source_key, page])
  );
  const sectionByPageAndSlug = new Map(
    (sectionsResult.data ?? []).map((section) => [
      `${section.theme_page_id}:${section.slug}`,
      section,
    ])
  );
  const itemBySlug = new Map(
    (itemsResult.data ?? []).map((item) => [item.slug, item])
  );
  const linkedTermSet = new Set(
    (relationshipsResult.data ?? []).map(
      (row) => `${row.content_item_id}:${row.term_id}`
    )
  );
  const themeLinkSet = new Set(
    (themeLinksResult.data ?? []).map(
      (row) => `${row.theme_section_id}:${row.content_item_id}`
    )
  );

  const tasks = [];
  const skipped = [];

  for (const sourceTheme of sourceManifest.themes) {
    const page = pageBySourceKey.get(sourceTheme.key);
    if (!page) {
      skipped.push({
        reason: "theme_page_missing",
        sourceKey: sourceTheme.key,
      });
      continue;
    }

    for (const section of sourceTheme.sections ?? []) {
      const dbSection = sectionByPageAndSlug.get(`${page.id}:${section.slug}`);
      if (!dbSection) {
        skipped.push({
          reason: "theme_section_missing",
          sectionSlug: section.slug,
          sourceKey: sourceTheme.key,
        });
        continue;
      }

      const validItems = dedupeSectionItems(section);
      validItems.forEach((item, itemIndex) => {
        const contentSlug = makeContentSlug(sourceTheme.suggestedSlug, item.slug);
        const mediaEntry = mediaBySourcePath.get(item.suggestedImagePath || "");
        tasks.push({
          contentSlug,
          dbSection,
          featured: itemIndex === 0 && section.suggestedLayout === "featured",
          item,
          page,
          section,
          sourceTheme,
          featuredImageUrl: mediaEntry?.publicUrl ?? null,
          featuredImageAlt: mediaEntry?.altText ?? item.title,
        });
      });
    }
  }

  const selectedTasks = args.limit ? tasks.slice(0, args.limit) : tasks;

  let createdContent = 0;
  let updatedContent = 0;
  let createdLinks = 0;
  let createdTermLinks = 0;
  const reportRows = [];

  for (const task of selectedTasks) {
    const existingItem = itemBySlug.get(task.contentSlug) ?? null;
    let contentItemId = existingItem?.id ?? null;
    const contentPayload = {
      title: task.item.title,
      slug: task.contentSlug,
      status: "draft",
      language: primaryLanguage,
      excerpt: null,
      featured_image_url: task.featuredImageUrl,
      featured_image_alt: task.featuredImageAlt,
    };

    if (args.dryRun) {
      reportRows.push({
        contentSlug: task.contentSlug,
        sectionSlug: task.section.slug,
        sourceKey: task.sourceTheme.key,
        status: existingItem ? "would-update" : "would-create",
        title: task.item.title,
      });
      continue;
    }

    if (!existingItem) {
      const { data, error } = await supabase
        .from("content_items")
        .insert(contentPayload)
        .select("id, slug, title, featured_image_url, featured_image_alt")
        .single();

      if (error || !data) {
        throw new Error(
          `Content item aanmaken mislukt voor ${task.item.title}: ${error?.message || "onbekende fout"}`
        );
      }

      contentItemId = data.id;
      itemBySlug.set(task.contentSlug, data);
      createdContent += 1;
    } else {
      const update = {};
      if (!existingItem.title) {
        update.title = task.item.title;
      }
      if (!existingItem.featured_image_url && task.featuredImageUrl) {
        update.featured_image_url = task.featuredImageUrl;
      }
      if (!existingItem.featured_image_alt && task.featuredImageAlt) {
        update.featured_image_alt = task.featuredImageAlt;
      }

      if (Object.keys(update).length) {
        const { error } = await supabase
          .from("content_items")
          .update(update)
          .eq("id", existingItem.id);

        if (error) {
          throw new Error(
            `Content item updaten mislukt voor ${task.item.title}: ${error.message}`
          );
        }

        updatedContent += 1;
      }

      contentItemId = existingItem.id;
    }

    if (!contentItemId) {
      throw new Error(`Geen content_item_id voor ${task.item.title}`);
    }

    if (
      task.page.primary_category_term_id &&
      !linkedTermSet.has(`${contentItemId}:${task.page.primary_category_term_id}`)
    ) {
      const { error } = await supabase
        .from("content_term_relationships")
        .insert({
          content_item_id: contentItemId,
          term_id: task.page.primary_category_term_id,
        });

      if (!error) {
        linkedTermSet.add(`${contentItemId}:${task.page.primary_category_term_id}`);
        createdTermLinks += 1;
      }
    }

    if (!themeLinkSet.has(`${task.dbSection.id}:${contentItemId}`)) {
      const { error } = await supabase
        .from("content_theme_section_items")
        .insert({
          theme_section_id: task.dbSection.id,
          content_item_id: contentItemId,
          custom_title: null,
          custom_excerpt: null,
          featured: task.featured,
          override_image_url: null,
          override_image_alt: null,
          override_image_position: "inherit",
          sort_order:
            (
              task.section.items.findIndex(
                (item) => normalizeText(item.title) === normalizeText(task.item.title)
              ) + 1
            ) * 10,
        });

      if (error) {
        throw new Error(
          `Theme-link aanmaken mislukt voor ${task.item.title}: ${error.message}`
        );
      }

      themeLinkSet.add(`${task.dbSection.id}:${contentItemId}`);
      createdLinks += 1;
    }

    reportRows.push({
      contentItemId,
      contentSlug: task.contentSlug,
      sectionSlug: task.section.slug,
      sourceKey: task.sourceTheme.key,
      status: existingItem ? "linked-existing" : "created-and-linked",
      title: task.item.title,
    });
  }

  await writeOutput(args.output, {
    createdContent,
    createdLinks,
    createdTermLinks,
    dryRun: args.dryRun,
    generatedAt: new Date().toISOString(),
    processed: selectedTasks.length,
    report: reportRows,
    skipped,
    updatedContent,
  });

  console.log(`Processed tasks: ${selectedTasks.length}`);
  console.log(`Created content: ${createdContent}`);
  console.log(`Updated content: ${updatedContent}`);
  console.log(`Created theme links: ${createdLinks}`);
  console.log(`Created category links: ${createdTermLinks}`);
  console.log(`Skipped issues: ${skipped.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
