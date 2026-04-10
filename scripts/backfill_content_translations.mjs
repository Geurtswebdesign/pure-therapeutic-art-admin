#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILES = [".env.local", ".env.production", ".env"];
const DEFAULT_PRIMARY_LANGUAGE = "nl";
const DEFAULT_SUPPORTED_LANGUAGES = ["nl", "en", "de"];
const DEFAULT_TIMEOUT_MS = 180_000;

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
      "Gebruik: node scripts/backfill_content_translations.mjs [options]",
      "",
      "Opties:",
      "  --dry-run           Laat zien welke vertalingen ontbreken zonder writes",
      "  --limit <aantal>    Stop na dit aantal nieuw aan te maken vertalingen",
      "  --language <code>   Alleen deze doeltaal meenemen, mag meerdere keren",
      "  --env-file <pad>    Gebruik expliciet dit env-bestand in plaats van de defaults",
      "  --help              Toon deze hulptekst",
    ].join("\n")
  );
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

function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function hasVisibleBodyContent(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;
}

function sanitizeAccordionSections(sections) {
  return (Array.isArray(sections) ? sections : [])
    .map((section, index) => ({
      id:
        String(section?.id ?? "").trim() ||
        `accordion-${Date.now().toString(36)}-${index + 1}`,
      title: String(section?.title ?? "").trim(),
      body: typeof section?.body === "string" ? section.body : "",
    }))
    .filter(
      (section) => section.title.length > 0 || hasVisibleBodyContent(section.body)
    );
}

function extractAccordionSectionsFromRawBlocks(rawBlocks) {
  const accordionBlock = (Array.isArray(rawBlocks) ? rawBlocks : []).find(
    (block) => block?.type === "accordion"
  );

  if (!accordionBlock || !accordionBlock.data || typeof accordionBlock.data !== "object") {
    return [];
  }

  return sanitizeAccordionSections(accordionBlock.data.items);
}

function translateAccordionBlockData(data, translatedSections) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  return {
    ...data,
    items: translatedSections,
  };
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

function buildTranslationMessages(input) {
  const sourceLanguageLabel = getLanguageDisplayLabel(input.sourceLanguage, "en");
  const targetLanguageLabel = getLanguageDisplayLabel(input.targetLanguage, "en");

  return [
    {
      role: "system",
      content:
        "You are a professional translator for a therapeutic wellbeing application. " +
        "Translate content accurately while preserving nuance, formatting, URLs, placeholders, and HTML tags. " +
        "Keep accordion section ids unchanged. Return only JSON that matches the requested schema.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "Translate this content payload",
        instructions: [
          `Translate from ${sourceLanguageLabel} (${input.sourceLanguage}) to ${targetLanguageLabel} (${input.targetLanguage}).`,
          "Preserve HTML tags and attributes exactly, but translate visible text content inside the HTML.",
          "Return an ASCII URL slug using lowercase letters, digits, and hyphens.",
          "Do not add commentary or explanations.",
          "Keep the emotional tone suitable for grief support and therapeutic content.",
        ],
        payload: {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt ?? "",
          body: input.body,
          featuredImageAlt: input.featuredImageAlt ?? "",
          accordionSections: input.accordionSections,
        },
      }),
    },
  ];
}

function buildResponseFormat() {
  return {
    type: "json_schema",
    json_schema: {
      name: "content_translation",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string" },
          body: { type: "string" },
          featuredImageAlt: { type: "string" },
          accordionSections: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                body: { type: "string" },
              },
              required: ["id", "title", "body"],
            },
          },
        },
        required: [
          "title",
          "slug",
          "excerpt",
          "body",
          "featuredImageAlt",
          "accordionSections",
        ],
      },
    },
  };
}

function normalizeTranslatedSlug(slug, sourceSlug, targetLanguage) {
  const normalized = slugify(slug);
  if (normalized) {
    return normalized;
  }

  const fallbackSource = slugify(sourceSlug);
  const targetSuffix = getLanguageBaseCode(targetLanguage) || "translation";
  return fallbackSource ? `${fallbackSource}-${targetSuffix}` : targetSuffix;
}

function coerceAccordionSections(sections, fallback) {
  if (!Array.isArray(sections)) {
    return fallback;
  }

  return sections.map((section, index) => {
    const sourceSection = fallback[index];
    const record =
      section && typeof section === "object" && !Array.isArray(section)
        ? section
        : {};

    return {
      id:
        (typeof record.id === "string" && record.id.trim()) ||
        sourceSection?.id ||
        `accordion-${index + 1}`,
      title:
        typeof record.title === "string"
          ? record.title
          : sourceSection?.title || "",
      body:
        typeof record.body === "string"
          ? record.body
          : sourceSection?.body || "",
    };
  });
}

async function translateContentPayload(input) {
  const sourceLanguage = normalizeLanguageCode(input.sourceLanguage);
  const targetLanguage = normalizeLanguageCode(input.targetLanguage);

  if (!sourceLanguage || !targetLanguage) {
    throw new Error("Bron- of doeltaal ontbreekt voor vertaling.");
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
        messages: buildTranslationMessages({
          ...input,
          sourceLanguage,
          targetLanguage,
        }),
        response_format: buildResponseFormat(),
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
        `OpenAI-vertaling duurde te lang en is afgebroken na ${Math.round(timeoutMs / 1000)} seconden.`
      );
    }

    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429 && /insufficient_quota/i.test(errorText)) {
      throw new Error(
        "OpenAI-vertaling mislukt omdat het API-project geen beschikbare quota meer heeft."
      );
    }

    throw new Error(`OpenAI-vertaling mislukt (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI gaf geen vertaalde inhoud terug.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI gaf ongeldige JSON terug voor de vertaling.");
  }

  return {
    title:
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title
        : input.title,
    slug: normalizeTranslatedSlug(
      typeof parsed.slug === "string" ? parsed.slug : "",
      input.slug,
      targetLanguage
    ),
    excerpt:
      typeof parsed.excerpt === "string" && parsed.excerpt.trim()
        ? parsed.excerpt
        : input.excerpt,
    body:
      typeof parsed.body === "string" && parsed.body.trim()
        ? parsed.body
        : input.body,
    featuredImageAlt:
      typeof parsed.featuredImageAlt === "string" &&
      parsed.featuredImageAlt.trim()
        ? parsed.featuredImageAlt
        : input.featuredImageAlt,
    accordionSections: coerceAccordionSections(
      parsed.accordionSections,
      input.accordionSections
    ),
  };
}

async function ensureTranslationColumnSupport(supabase) {
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

function getTranslationRootId(item) {
  return item.translation_source_id ?? item.id;
}

function getSourceItemScore(item, primaryLanguage) {
  let score = 0;
  const itemLanguage = normalizeLanguageCode(item.language);
  if (itemLanguage === primaryLanguage) score += 100;
  if (!item.translation_source_id) score += 10;
  if (item.status === "published") score += 5;
  if (String(item.body ?? "").trim()) score += 2;
  if (String(item.title ?? "").trim()) score += 1;
  return score;
}

function pickSourceItem(items, primaryLanguage) {
  return [...items].sort((left, right) => {
    const scoreDelta =
      getSourceItemScore(right, primaryLanguage) -
      getSourceItemScore(left, primaryLanguage);

    if (scoreDelta !== 0) return scoreDelta;
    return String(left.id).localeCompare(String(right.id));
  })[0] ?? null;
}

async function buildUniqueSlug(supabase, preferredSlug, targetLanguage) {
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

async function fetchSourceDependencies(supabase, contentItemId) {
  const [{ data: rawBlocks, error: blocksError }, { data: relationships, error: relError }] =
    await Promise.all([
      supabase
        .from("content_blocks")
        .select("type, data, order_index")
        .eq("content_item_id", contentItemId)
        .order("order_index", { ascending: true }),
      supabase
        .from("content_term_relationships")
        .select("term_id")
        .eq("content_item_id", contentItemId),
    ]);

  if (blocksError) {
    throw new Error(`Contentblokken laden mislukt: ${blocksError.message}`);
  }

  if (relError) {
    throw new Error(`Termrelaties laden mislukt: ${relError.message}`);
  }

  return {
    rawBlocks: rawBlocks ?? [],
    relationships: relationships ?? [],
    accordionSections: extractAccordionSectionsFromRawBlocks(rawBlocks ?? []),
  };
}

async function createTranslatedContentItem(supabase, sourceItem, targetLanguage, dependencies) {
  const translated = await translateContentPayload({
    sourceLanguage: sourceItem.language,
    targetLanguage,
    title: sourceItem.title ?? "",
    slug: sourceItem.slug ?? "",
    excerpt: sourceItem.excerpt,
    body: sourceItem.body ?? "",
    featuredImageAlt: sourceItem.featured_image_alt,
    accordionSections: dependencies.accordionSections,
  });

  const translatedSlug = await buildUniqueSlug(
    supabase,
    translated.slug || sourceItem.slug || sourceItem.id,
    targetLanguage
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
      language: targetLanguage,
      status: "draft",
      translation_source_id: getTranslationRootId(sourceItem),
    })
    .select("id")
    .single();

  if (createError || !createdItem) {
    throw new Error(createError?.message || "Vertaalde content aanmaken mislukt.");
  }

  if (dependencies.relationships.length) {
    const { error: relationshipError } = await supabase
      .from("content_term_relationships")
      .insert(
        dependencies.relationships.map((relationship) => ({
          content_item_id: createdItem.id,
          term_id: relationship.term_id,
        }))
      );

    if (relationshipError) {
      throw new Error(`Termrelaties kopieren mislukt: ${relationshipError.message}`);
    }
  }

  if (dependencies.rawBlocks.length) {
    const { error: blocksError } = await supabase
      .from("content_blocks")
      .insert(
        dependencies.rawBlocks.map((block) => ({
          content_item_id: createdItem.id,
          type: block.type,
          order_index: block.order_index,
          data:
            block.type === "accordion"
              ? translateAccordionBlockData(block.data, translated.accordionSections)
              : block.data,
        }))
      );

    if (blocksError) {
      throw new Error(`Contentblokken kopieren mislukt: ${blocksError.message}`);
    }
  }

  return createdItem.id;
}

function shouldStopAtLimit(limit, createdCount) {
  return Number.isFinite(limit) && limit !== null && createdCount >= limit;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvFiles(args.envFiles.length ? args.envFiles : DEFAULT_ENV_FILES);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn verplicht.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await ensureTranslationColumnSupport(supabase);

  const { primaryLanguage, supportedLanguages } =
    await getConfiguredLanguageSettings(supabase);

  const requestedTargetLanguages = args.languages.length
    ? parseLanguageCodes(args.languages)
    : supportedLanguages;
  const invalidTargetLanguages = requestedTargetLanguages.filter(
    (language) => !supportedLanguages.includes(language)
  );

  if (invalidTargetLanguages.length) {
    throw new Error(
      `Deze talen staan niet in de app-instellingen: ${invalidTargetLanguages.join(", ")}`
    );
  }

  const targetLanguages = requestedTargetLanguages.length
    ? requestedTargetLanguages
    : supportedLanguages;

  const { data: contentItems, error: contentItemsError } = await supabase
    .from("content_items")
    .select(
      "id, title, body, slug, excerpt, featured_image_alt, featured_image_url, credit_cost, language, translation_source_id, status"
    )
    .neq("status", "trash");

  if (contentItemsError) {
    throw new Error(`Content-items laden mislukt: ${contentItemsError.message}`);
  }

  const familyMap = new Map();
  for (const item of contentItems ?? []) {
    const familyId = getTranslationRootId(item);
    const familyItems = familyMap.get(familyId) ?? [];
    familyItems.push(item);
    familyMap.set(familyId, familyItems);
  }

  const summary = {
    primaryLanguage,
    supportedLanguages,
    targetLanguages,
    families: familyMap.size,
    inspectedFamilies: 0,
    created: 0,
    planned: 0,
    skippedNoMissing: 0,
    skippedNoSourceLanguage: 0,
    errors: 0,
  };

  for (const [familyId, familyItems] of familyMap.entries()) {
    summary.inspectedFamilies += 1;

    const sourceItem = pickSourceItem(familyItems, primaryLanguage);
    const sourceLanguage = normalizeLanguageCode(sourceItem?.language);

    if (!sourceItem || !sourceLanguage) {
      summary.skippedNoSourceLanguage += 1;
      console.warn(`[skip] family ${familyId}: geen bruikbare brontaal`);
      continue;
    }

    const existingLanguages = new Set(
      familyItems
        .map((item) => normalizeLanguageCode(item.language))
        .filter(Boolean)
    );
    const missingLanguages = targetLanguages.filter(
      (language) => !existingLanguages.has(language)
    );

    if (!missingLanguages.length) {
      summary.skippedNoMissing += 1;
      continue;
    }

    if (args.dryRun) {
      for (const targetLanguage of missingLanguages) {
        if (shouldStopAtLimit(args.limit, summary.planned)) {
          break;
        }

        summary.planned += 1;
        console.log(
          `[dry-run] ${sourceItem.title || sourceItem.slug || sourceItem.id} :: ${sourceLanguage} -> ${targetLanguage}`
        );
      }

      if (shouldStopAtLimit(args.limit, summary.planned)) {
        break;
      }

      continue;
    }

    const dependencies = await fetchSourceDependencies(supabase, sourceItem.id);

    for (const targetLanguage of missingLanguages) {
      if (shouldStopAtLimit(args.limit, summary.created)) {
        break;
      }

      try {
        const createdId = await createTranslatedContentItem(
          supabase,
          sourceItem,
          targetLanguage,
          dependencies
        );
        summary.created += 1;
        console.log(
          `[created] ${sourceItem.title || sourceItem.slug || sourceItem.id} :: ${sourceLanguage} -> ${targetLanguage} (${createdId})`
        );
      } catch (error) {
        summary.errors += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[error] family ${familyId} :: ${sourceLanguage} -> ${targetLanguage} :: ${message}`
        );

        if (/beschikbare quota/i.test(message)) {
          console.error("Stoppen omdat OpenAI quota op is.");
          throw error;
        }
      }
    }

    if (shouldStopAtLimit(args.limit, args.dryRun ? summary.planned : summary.created)) {
      break;
    }
  }

  console.log("");
  console.log(
    JSON.stringify(
      {
        mode: args.dryRun ? "dry-run" : "apply",
        ...summary,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
