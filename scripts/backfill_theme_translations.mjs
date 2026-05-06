#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILES = [".env.local", ".env.production", ".env"];
const DEFAULT_PRIMARY_LANGUAGE = "nl";
const DEFAULT_SUPPORTED_LANGUAGES = ["nl", "en", "de", "pt", "es", "ar", "it"];
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_CONCURRENCY = 3;

function normalizeLanguageCode(value) {
  return String(value ?? "").trim().replace(/_/g, "-").toLowerCase();
}

function getLanguageBaseCode(value) {
  const normalized = normalizeLanguageCode(value);
  if (!normalized) return "";
  return normalized.split("-")[0] ?? "";
}

function parseLanguageCodes(input) {
  const values = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/[\n,]/)
      : [];

  const seen = new Set();
  const codes = [];

  for (const value of values) {
    const normalized = normalizeLanguageCode(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    codes.push(normalized);
  }

  return codes;
}

function ensureLanguageCodes(codes, requiredCodes = DEFAULT_SUPPORTED_LANGUAGES) {
  return parseLanguageCodes([...codes, ...requiredCodes]);
}

function getLanguageDisplayLabel(code, displayLocale = "en") {
  const normalized = normalizeLanguageCode(code);
  if (!normalized) return "";

  const baseCode = getLanguageBaseCode(normalized);
  const fallback = normalized.toUpperCase();

  try {
    const formatter = new Intl.DisplayNames([displayLocale], {
      type: "language",
    });
    const label = formatter.of(baseCode);
    if (!label) return fallback;
    const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
    return normalized === baseCode
      ? formattedLabel
      : `${formattedLabel} (${normalized})`;
  } catch {
    return fallback;
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    limit: null,
    concurrency: null,
    envFiles: [],
    languages: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (token === "--limit") {
      const next = Number.parseInt(argv[index + 1] ?? "", 10);
      args.limit = Number.isFinite(next) && next > 0 ? next : null;
      index += 1;
      continue;
    }
    if (token === "--concurrency") {
      const next = Number.parseInt(argv[index + 1] ?? "", 10);
      args.concurrency = Number.isFinite(next) && next > 0 ? next : null;
      index += 1;
      continue;
    }
    if (token === "--language") {
      args.languages.push(...parseLanguageCodes(argv[index + 1] ?? ""));
      index += 1;
      continue;
    }
    if (token === "--env-file") {
      const value = argv[index + 1]?.trim();
      if (value) {
        args.envFiles.push(value);
      }
      index += 1;
      continue;
    }
    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(
    [
      "Gebruik: node scripts/backfill_theme_translations.mjs [options]",
      "",
      "Opties:",
      "  --dry-run           Laat zien welke themevertalingen ontbreken zonder writes",
      "  --limit <aantal>    Stop na dit aantal theme-language taken",
      `  --concurrency <n>  Aantal parallelle themevertalingen tegelijk (standaard: ${DEFAULT_CONCURRENCY})`,
      "  --language <code>   Alleen deze doeltaal meenemen, mag meerdere keren",
      "  --env-file <pad>    Gebruik expliciet dit env-bestand in plaats van de defaults",
      "  --help              Toon deze hulptekst",
    ].join("\n")
  );
}

function getTranslationConcurrency(argsConcurrency) {
  if (Number.isFinite(argsConcurrency) && argsConcurrency > 0) {
    return argsConcurrency;
  }

  const envValue = process.env.CONTENT_TRANSLATION_CONCURRENCY?.trim();
  const parsedValue = envValue ? Number.parseInt(envValue, 10) : NaN;

  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return DEFAULT_CONCURRENCY;
}

async function loadEnvFiles(fileNames = DEFAULT_ENV_FILES) {
  for (const fileName of fileNames) {
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

function hasVisibleText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;
}

function getTranslationTimeoutMs() {
  const rawValue = process.env.OPENAI_TRANSLATION_TIMEOUT_MS?.trim();
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : NaN;

  if (Number.isFinite(parsedValue) && parsedValue >= 10_000) {
    return parsedValue;
  }

  return DEFAULT_TIMEOUT_MS;
}

function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY ontbreekt. Stel eerst een OpenAI API-sleutel in voor automatische vertaling."
    );
  }

  return {
    apiKey,
    model: process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-4.1-mini",
  };
}

function buildThemeTranslationMessages(input) {
  const sourceLanguageLabel = getLanguageDisplayLabel(input.sourceLanguage, "en");
  const targetLanguageLabel = getLanguageDisplayLabel(input.targetLanguage, "en");

  return [
    {
      role: "system",
      content:
        "You are a professional translator for a therapeutic wellbeing application. " +
        "Translate theme page metadata accurately while preserving nuance, IDs, formatting, URLs, placeholders, and HTML tags. " +
        "Return only JSON that matches the requested schema.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "Translate this therapeutic theme page payload",
        instructions: [
          `Translate from ${sourceLanguageLabel} (${input.sourceLanguage}) to ${targetLanguageLabel} (${input.targetLanguage}).`,
          "Preserve HTML tags and attributes exactly, but translate visible text content inside the HTML.",
          "Keep all section ids and item ids unchanged.",
          "Do not add commentary or explanations.",
          "Keep the emotional tone suitable for grief support and therapeutic content.",
        ],
        payload: {
          page: {
            eyebrow: input.page.eyebrow ?? "",
            title: input.page.title ?? "",
            description: input.page.description ?? "",
            heroImageAlt: input.page.heroImageAlt ?? "",
          },
          sections: input.sections.map((section) => ({
            id: section.id,
            title: section.title ?? "",
            description: section.description ?? "",
            sectionImageAlt: section.sectionImageAlt ?? "",
            items: section.items.map((item) => ({
              id: item.id,
              customTitle: item.customTitle ?? "",
              customExcerpt: item.customExcerpt ?? "",
              overrideImageAlt: item.overrideImageAlt ?? "",
            })),
          })),
        },
      }),
    },
  ];
}

function buildThemeTranslationResponseFormat() {
  return {
    type: "json_schema",
    json_schema: {
      name: "theme_translation",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          page: {
            type: "object",
            additionalProperties: false,
            properties: {
              eyebrow: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              heroImageAlt: { type: "string" },
            },
            required: ["eyebrow", "title", "description", "heroImageAlt"],
          },
          sections: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                sectionImageAlt: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      customTitle: { type: "string" },
                      customExcerpt: { type: "string" },
                      overrideImageAlt: { type: "string" },
                    },
                    required: [
                      "id",
                      "customTitle",
                      "customExcerpt",
                      "overrideImageAlt",
                    ],
                  },
                },
              },
              required: ["id", "title", "description", "sectionImageAlt", "items"],
            },
          },
        },
        required: ["page", "sections"],
      },
    },
  };
}

function pickOptionalText(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function coerceTranslatedThemePayload(parsed, fallback) {
  const parsedPage =
    parsed?.page && typeof parsed.page === "object" && !Array.isArray(parsed.page)
      ? parsed.page
      : {};
  const parsedSections = Array.isArray(parsed?.sections) ? parsed.sections : [];
  const parsedSectionById = new Map(
    parsedSections
      .filter(
        (section) =>
          section &&
          typeof section === "object" &&
          !Array.isArray(section) &&
          typeof section.id === "string"
      )
      .map((section) => [section.id, section])
  );

  return {
    page: {
      eyebrow: pickOptionalText(parsedPage.eyebrow, fallback.page.eyebrow),
      title: pickOptionalText(parsedPage.title, fallback.page.title),
      description: pickOptionalText(
        parsedPage.description,
        fallback.page.description
      ),
      heroImageAlt: pickOptionalText(
        parsedPage.heroImageAlt,
        fallback.page.heroImageAlt
      ),
    },
    sections: fallback.sections.map((section) => {
      const parsedSection = parsedSectionById.get(section.id) ?? {};
      const parsedItems = Array.isArray(parsedSection.items) ? parsedSection.items : [];
      const parsedItemById = new Map(
        parsedItems
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              !Array.isArray(item) &&
              typeof item.id === "string"
          )
          .map((item) => [item.id, item])
      );

      return {
        id: section.id,
        title: pickOptionalText(parsedSection.title, section.title),
        description: pickOptionalText(
          parsedSection.description,
          section.description
        ),
        sectionImageAlt: pickOptionalText(
          parsedSection.sectionImageAlt,
          section.sectionImageAlt
        ),
        items: section.items.map((item) => {
          const parsedItem = parsedItemById.get(item.id) ?? {};
          return {
            id: item.id,
            customTitle: pickOptionalText(parsedItem.customTitle, item.customTitle),
            customExcerpt: pickOptionalText(
              parsedItem.customExcerpt,
              item.customExcerpt
            ),
            overrideImageAlt: pickOptionalText(
              parsedItem.overrideImageAlt,
              item.overrideImageAlt
            ),
          };
        }),
      };
    }),
  };
}

async function translateThemePayload(input) {
  const sourceLanguage = normalizeLanguageCode(input.sourceLanguage);
  const targetLanguage = normalizeLanguageCode(input.targetLanguage);

  if (!sourceLanguage || !targetLanguage) {
    throw new Error("Bron- of doeltaal ontbreekt voor themevertaling.");
  }

  const { apiKey, model } = getOpenAiConfig();
  const timeoutMs = getTranslationTimeoutMs();

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildThemeTranslationMessages({
          ...input,
          sourceLanguage,
          targetLanguage,
        }),
        response_format: buildThemeTranslationResponseFormat(),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const isTimeoutError =
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError" ||
        /aborted due to timeout/i.test(error.message));

    if (isTimeoutError) {
      throw new Error(
        `OpenAI-themevertaling duurde te lang en is afgebroken na ${Math.round(timeoutMs / 1000)} seconden.`
      );
    }

    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429 && /insufficient_quota/i.test(errorText)) {
      throw new Error(
        "OpenAI-themevertaling mislukt omdat het API-project geen beschikbare quota meer heeft."
      );
    }

    throw new Error(`OpenAI-themevertaling mislukt (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI gaf geen themevertaling terug.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI gaf ongeldige JSON terug voor de themevertaling.");
  }

  return coerceTranslatedThemePayload(parsed, input);
}

async function ensureThemeTranslationSupport(supabase) {
  const checks = [
    {
      table: "content_theme_page_translations",
      select: "theme_page_id, language",
    },
    {
      table: "content_theme_section_translations",
      select: "theme_section_id, language",
    },
    {
      table: "content_theme_section_item_translations",
      select: "theme_section_item_id, language",
    },
  ];

  for (const check of checks) {
    const { error } = await supabase
      .from(check.table)
      .select(check.select)
      .limit(1);

    if (error) {
      throw new Error(
        "De database mist nog de theme-vertaaltabellen. Voer eerst sql/content_theme_translations.sql uit."
      );
    }
  }
}

async function getConfiguredLanguageSettings(supabase) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "general")
    .maybeSingle();

  if (error) {
    throw new Error(`App-instellingen laden mislukt: ${error.message}`);
  }

  const value =
    data?.value && typeof data.value === "object" && !Array.isArray(data.value)
      ? data.value
      : {};
  const primaryLanguage =
    normalizeLanguageCode(value.primaryLanguage) || DEFAULT_PRIMARY_LANGUAGE;
  const supportedLanguages = ensureLanguageCodes(
    parseLanguageCodes(
      Array.isArray(value.supportedLanguages)
        ? value.supportedLanguages
        : typeof value.supportedLanguages === "string"
          ? value.supportedLanguages
          : []
    ),
    [primaryLanguage, ...DEFAULT_SUPPORTED_LANGUAGES]
  );

  return { primaryLanguage, supportedLanguages };
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase-omgeving ontbreekt. Controleer NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return { url, serviceRoleKey };
}

function buildSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isTranslatableThemeSectionItem(item) {
  return (
    hasVisibleText(item.custom_title) ||
    hasVisibleText(item.custom_excerpt) ||
    hasVisibleText(item.override_image_alt)
  );
}

async function loadThemeGraph(supabase) {
  const { data: pages, error: pagesError } = await supabase
    .from("content_theme_pages")
    .select("id, slug, eyebrow, title, description, hero_image_alt")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (pagesError) {
    throw new Error(`Themabronnen laden mislukt: ${pagesError.message}`);
  }

  const pageRows = (pages ?? []).map((page) => ({
    id: page.id,
    slug: page.slug,
    eyebrow: page.eyebrow ?? "",
    title: page.title ?? "",
    description: page.description ?? "",
    heroImageAlt: page.hero_image_alt ?? "",
  }));

  const pageIds = pageRows.map((page) => page.id);
  if (!pageIds.length) {
    return [];
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("content_theme_sections")
    .select("id, theme_page_id, title, description, section_image_alt, sort_order")
    .in("theme_page_id", pageIds)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    throw new Error(`Themesecties laden mislukt: ${sectionsError.message}`);
  }

  const sectionRows = (sections ?? []).map((section) => ({
    id: section.id,
    themePageId: section.theme_page_id,
    title: section.title ?? "",
    description: section.description ?? "",
    sectionImageAlt: section.section_image_alt ?? "",
    sortOrder: section.sort_order ?? 0,
  }));

  const sectionIds = sectionRows.map((section) => section.id);
  const itemsBySectionId = new Map(sectionIds.map((sectionId) => [sectionId, []]));

  if (sectionIds.length) {
    const { data: sectionItems, error: sectionItemsError } = await supabase
      .from("content_theme_section_items")
      .select(
        "id, theme_section_id, custom_title, custom_excerpt, override_image_alt, sort_order"
      )
      .in("theme_section_id", sectionIds)
      .order("sort_order", { ascending: true });

    if (sectionItemsError) {
      throw new Error(
        `Theme-sectie-items laden mislukt: ${sectionItemsError.message}`
      );
    }

    for (const item of sectionItems ?? []) {
      if (!isTranslatableThemeSectionItem(item)) {
        continue;
      }

      const currentItems = itemsBySectionId.get(item.theme_section_id) ?? [];
      currentItems.push({
        id: item.id,
        customTitle: item.custom_title ?? "",
        customExcerpt: item.custom_excerpt ?? "",
        overrideImageAlt: item.override_image_alt ?? "",
        sortOrder: item.sort_order ?? 0,
      });
      itemsBySectionId.set(item.theme_section_id, currentItems);
    }
  }

  const sectionsByPageId = new Map(pageIds.map((pageId) => [pageId, []]));
  for (const section of sectionRows) {
    const currentSections = sectionsByPageId.get(section.themePageId) ?? [];
    currentSections.push({
      id: section.id,
      title: section.title,
      description: section.description,
      sectionImageAlt: section.sectionImageAlt,
      sortOrder: section.sortOrder,
      items: (itemsBySectionId.get(section.id) ?? []).sort(
        (left, right) => left.sortOrder - right.sortOrder
      ),
    });
    sectionsByPageId.set(section.themePageId, currentSections);
  }

  return pageRows.map((page) => ({
    ...page,
    sections: (sectionsByPageId.get(page.id) ?? []).sort(
      (left, right) => left.sortOrder - right.sortOrder
    ),
  }));
}

async function loadExistingThemeTranslationSets(
  supabase,
  pages,
  targetLanguages
) {
  const pageIds = pages.map((page) => page.id);
  const sectionIds = pages.flatMap((page) => page.sections.map((section) => section.id));
  const sectionItemIds = pages.flatMap((page) =>
    page.sections.flatMap((section) => section.items.map((item) => item.id))
  );

  const [pageRows, sectionRows, sectionItemRows] = await Promise.all([
    pageIds.length
      ? supabase
          .from("content_theme_page_translations")
          .select("theme_page_id, language")
          .in("theme_page_id", pageIds)
          .in("language", targetLanguages)
      : { data: [], error: null },
    sectionIds.length
      ? supabase
          .from("content_theme_section_translations")
          .select("theme_section_id, language")
          .in("theme_section_id", sectionIds)
          .in("language", targetLanguages)
      : { data: [], error: null },
    sectionItemIds.length
      ? supabase
          .from("content_theme_section_item_translations")
          .select("theme_section_item_id, language")
          .in("theme_section_item_id", sectionItemIds)
          .in("language", targetLanguages)
      : { data: [], error: null },
  ]);

  if (pageRows.error) {
    throw new Error(`Theme-paginavertalingen laden mislukt: ${pageRows.error.message}`);
  }
  if (sectionRows.error) {
    throw new Error(`Theme-sectievertalingen laden mislukt: ${sectionRows.error.message}`);
  }
  if (sectionItemRows.error) {
    throw new Error(
      `Theme-sectie-itemvertalingen laden mislukt: ${sectionItemRows.error.message}`
    );
  }

  return {
    pageLanguageSet: new Set(
      (pageRows.data ?? []).map((row) => `${row.theme_page_id}:${row.language}`)
    ),
    sectionLanguageSet: new Set(
      (sectionRows.data ?? []).map((row) => `${row.theme_section_id}:${row.language}`)
    ),
    sectionItemLanguageSet: new Set(
      (sectionItemRows.data ?? []).map(
        (row) => `${row.theme_section_item_id}:${row.language}`
      )
    ),
  };
}

function buildThemeWorkItems(pages, targetLanguages, existing, limit = null) {
  const workItems = [];

  outer: for (const page of pages) {
    for (const targetLanguage of targetLanguages) {
      const pageKey = `${page.id}:${targetLanguage}`;
      const pageMissing = !existing.pageLanguageSet.has(pageKey);
      const sectionMissing = page.sections.some(
        (section) => !existing.sectionLanguageSet.has(`${section.id}:${targetLanguage}`)
      );
      const sectionItemMissing = page.sections.some((section) =>
        section.items.some(
          (item) =>
            !existing.sectionItemLanguageSet.has(`${item.id}:${targetLanguage}`)
        )
      );

      if (!pageMissing && !sectionMissing && !sectionItemMissing) {
        continue;
      }

      workItems.push({
        page,
        sourceLanguage: DEFAULT_PRIMARY_LANGUAGE,
        targetLanguage,
      });

      if (limit && workItems.length >= limit) {
        break outer;
      }
    }
  }

  return workItems;
}

async function upsertThemeTranslationPayload(
  supabase,
  page,
  targetLanguage,
  translated
) {
  const now = new Date().toISOString();
  const { error: pageError } = await supabase
    .from("content_theme_page_translations")
    .upsert(
      {
        theme_page_id: page.id,
        language: targetLanguage,
        eyebrow: translated.page.eyebrow || null,
        title: translated.page.title || page.title,
        description: translated.page.description || null,
        hero_image_alt: translated.page.heroImageAlt || null,
        updated_at: now,
      },
      {
        onConflict: "theme_page_id,language",
      }
    );

  if (pageError) {
    throw new Error(pageError.message);
  }

  const sectionRows = translated.sections.map((section) => ({
    theme_section_id: section.id,
    language: targetLanguage,
    title: section.title || "",
    description: section.description || null,
    section_image_alt: section.sectionImageAlt || null,
    updated_at: now,
  }));

  if (sectionRows.length) {
    const { error: sectionError } = await supabase
      .from("content_theme_section_translations")
      .upsert(sectionRows, {
        onConflict: "theme_section_id,language",
      });

    if (sectionError) {
      throw new Error(sectionError.message);
    }
  }

  const sectionItemRows = translated.sections.flatMap((section) =>
    section.items.map((item) => ({
      theme_section_item_id: item.id,
      language: targetLanguage,
      custom_title: item.customTitle || null,
      custom_excerpt: item.customExcerpt || null,
      override_image_alt: item.overrideImageAlt || null,
      updated_at: now,
    }))
  );

  if (sectionItemRows.length) {
    const { error: sectionItemError } = await supabase
      .from("content_theme_section_item_translations")
      .upsert(sectionItemRows, {
        onConflict: "theme_section_item_id,language",
      });

    if (sectionItemError) {
      throw new Error(sectionItemError.message);
    }
  }

  return {
    pageCount: 1,
    sectionCount: sectionRows.length,
    sectionItemCount: sectionItemRows.length,
  };
}

async function runWithConcurrency(items, concurrency, handler) {
  if (!items.length) {
    return [];
  }

  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await handler(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length)) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvFiles(args.envFiles.length ? args.envFiles : DEFAULT_ENV_FILES);

  const supabase = buildSupabaseClient();
  await ensureThemeTranslationSupport(supabase);

  const { primaryLanguage, supportedLanguages } =
    await getConfiguredLanguageSettings(supabase);
  const targetLanguages = (
    args.languages.length
      ? args.languages
      : supportedLanguages.filter((code) => code !== primaryLanguage)
  ).filter((code) => code !== primaryLanguage);

  if (!targetLanguages.length) {
    throw new Error("Geen doeltalen gevonden voor themevertaling.");
  }

  const pages = await loadThemeGraph(supabase);
  const existing = await loadExistingThemeTranslationSets(
    supabase,
    pages,
    targetLanguages
  );
  const workItems = buildThemeWorkItems(pages, targetLanguages, existing, args.limit);

  const summary = {
    mode: args.dryRun ? "dry-run" : "run",
    primaryLanguage,
    supportedLanguages,
    targetLanguages,
    pages: pages.length,
    planned: workItems.length,
    translated: 0,
    upsertedPages: 0,
    upsertedSections: 0,
    upsertedSectionItems: 0,
    skippedComplete:
      pages.length * targetLanguages.length - workItems.length,
    errors: 0,
  };

  if (args.dryRun) {
    for (const item of workItems) {
      console.log(
        `[dry-run] ${item.page.title} :: ${item.sourceLanguage} -> ${item.targetLanguage}`
      );
    }

    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const concurrency = getTranslationConcurrency(args.concurrency);
  await runWithConcurrency(workItems, concurrency, async (item) => {
    try {
      const translated = await translateThemePayload({
        sourceLanguage: item.sourceLanguage,
        targetLanguage: item.targetLanguage,
        page: {
          eyebrow: item.page.eyebrow,
          title: item.page.title,
          description: item.page.description,
          heroImageAlt: item.page.heroImageAlt,
        },
        sections: item.page.sections.map((section) => ({
          id: section.id,
          title: section.title,
          description: section.description,
          sectionImageAlt: section.sectionImageAlt,
          items: section.items.map((sectionItem) => ({
            id: sectionItem.id,
            customTitle: sectionItem.customTitle,
            customExcerpt: sectionItem.customExcerpt,
            overrideImageAlt: sectionItem.overrideImageAlt,
          })),
        })),
      });

      const persisted = await upsertThemeTranslationPayload(
        supabase,
        item.page,
        item.targetLanguage,
        translated
      );

      summary.translated += 1;
      summary.upsertedPages += persisted.pageCount;
      summary.upsertedSections += persisted.sectionCount;
      summary.upsertedSectionItems += persisted.sectionItemCount;

      console.log(
        `[translated] ${item.page.title} :: ${item.sourceLanguage} -> ${item.targetLanguage}`
      );
    } catch (error) {
      summary.errors += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[error] theme ${item.page.id} :: ${item.sourceLanguage} -> ${item.targetLanguage} :: ${message}`
      );
    }
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
});
