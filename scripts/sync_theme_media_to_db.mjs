#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILES = [".env.local", ".env"];

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
      // optional
    }
  }
}

async function readJson(filePath) {
  const absolutePath = path.join(process.cwd(), filePath);
  return JSON.parse(await fs.readFile(absolutePath, "utf-8"));
}

async function main() {
  await loadEnvFiles();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase env vars ontbreken.");
  }

  const [sourceManifest, mediaManifest] = await Promise.all([
    readJson("docs/theme-source-manifest.json"),
    readJson("docs/theme-media-import-map.json"),
  ]);

  const sourceByKey = new Map(
    sourceManifest.themes.map((theme) => [theme.key, theme])
  );
  const mediaBySourcePath = new Map(
    mediaManifest.media
      .filter((entry) => entry.publicUrl)
      .map((entry) => [entry.sourcePath, entry])
  );

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: pages, error: pageError } = await supabase
    .from("content_theme_pages")
    .select("id, source_key, hero_image_url, hero_image_alt")
    .not("source_key", "is", null);

  if (pageError) {
    throw new Error(`Themadata laden mislukt: ${pageError.message}`);
  }

  let updatedPages = 0;
  for (const page of pages ?? []) {
    const sourceEntry = sourceByKey.get(page.source_key);
    if (!sourceEntry?.suggestedHeroImagePath) continue;

    const mediaEntry = mediaBySourcePath.get(sourceEntry.suggestedHeroImagePath);
    if (!mediaEntry?.publicUrl) continue;

    const update = {};
    if (!page.hero_image_url) {
      update.hero_image_url = mediaEntry.publicUrl;
    }
    if (!page.hero_image_alt) {
      update.hero_image_alt = mediaEntry.altText || sourceEntry.title;
    }

    if (!Object.keys(update).length) continue;

    const { error } = await supabase
      .from("content_theme_pages")
      .update(update)
      .eq("id", page.id);

    if (error) {
      throw new Error(`Theme page updaten mislukt: ${error.message}`);
    }

    updatedPages += 1;
  }

  const { data: sections, error: sectionError } = await supabase
    .from("content_theme_sections")
    .select(
      "id, slug, title, theme_page_id, section_image_url, section_image_alt"
    );

  if (sectionError) {
    throw new Error(`Theme secties laden mislukt: ${sectionError.message}`);
  }

  const sourceKeyByPageId = new Map(
    (pages ?? []).map((page) => [page.id, page.source_key])
  );

  let updatedSections = 0;
  for (const section of sections ?? []) {
    const sourceKey = sourceKeyByPageId.get(section.theme_page_id);
    if (!sourceKey) continue;

    const sourceEntry = sourceByKey.get(sourceKey);
    const sourceSection =
      sourceEntry?.sections?.find((entry) => entry.slug === section.slug) ?? null;
    if (!sourceSection?.suggestedSectionImagePath) continue;

    const mediaEntry = mediaBySourcePath.get(sourceSection.suggestedSectionImagePath);
    if (!mediaEntry?.publicUrl) continue;

    const update = {};
    if (!section.section_image_url) {
      update.section_image_url = mediaEntry.publicUrl;
    }
    if (!section.section_image_alt) {
      update.section_image_alt = mediaEntry.altText || sourceSection.title;
    }

    if (!Object.keys(update).length) continue;

    const { error } = await supabase
      .from("content_theme_sections")
      .update(update)
      .eq("id", section.id);

    if (error) {
      throw new Error(`Theme sectie updaten mislukt: ${error.message}`);
    }

    updatedSections += 1;
  }

  console.log(`Updated pages: ${updatedPages}`);
  console.log(`Updated sections: ${updatedSections}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
