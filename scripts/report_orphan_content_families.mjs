#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILES = [".env.local", ".env.production", ".env"];
const DEFAULT_PRIMARY_LANGUAGE = "nl";
const DEFAULT_OUTPUT_DIR = "tmp";

function normalizeLanguageCode(value) {
  return String(value ?? "").trim().replace(/_/g, "-").toLowerCase();
}

function parseArgs(argv) {
  const args = {
    envFiles: [],
    outputDir: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--env-file") {
      const value = argv[index + 1]?.trim();
      if (value) {
        args.envFiles.push(value);
      }
      index += 1;
      continue;
    }

    if (token === "--output-dir") {
      const value = argv[index + 1]?.trim();
      if (value) {
        args.outputDir = value;
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
      "Gebruik: node scripts/report_orphan_content_families.mjs [options]",
      "",
      "Opties:",
      "  --env-file <pad>    Gebruik expliciet dit env-bestand in plaats van de defaults",
      `  --output-dir <pad>  Schrijf rapportbestanden naar deze map (standaard: ${DEFAULT_OUTPUT_DIR})`,
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

  return {
    primaryLanguage:
      normalizeLanguageCode(value.primaryLanguage) || DEFAULT_PRIMARY_LANGUAGE,
  };
}

function getTranslationRootId(item) {
  return item.translation_source_id ?? item.id;
}

function hasVisibleBodyContent(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;
}

function getRepresentativeItemScore(item) {
  let score = 0;
  if (!item.translation_source_id) score += 10;
  if (item.status === "published") score += 5;
  if (hasVisibleBodyContent(item.body)) score += 2;
  if (String(item.title ?? "").trim()) score += 1;
  return score;
}

function pickRepresentativeItem(items) {
  return [...items].sort((left, right) => {
    const scoreDelta =
      getRepresentativeItemScore(right) - getRepresentativeItemScore(left);

    if (scoreDelta !== 0) return scoreDelta;

    const languageDelta = String(left.language ?? "").localeCompare(
      String(right.language ?? "")
    );
    if (languageDelta !== 0) return languageDelta;

    return String(left.id).localeCompare(String(right.id));
  })[0] ?? null;
}

function sortItems(items) {
  return [...items].sort((left, right) => {
    const languageDelta = String(left.language ?? "").localeCompare(
      String(right.language ?? "")
    );
    if (languageDelta !== 0) return languageDelta;

    const titleDelta = String(left.title ?? "").localeCompare(
      String(right.title ?? "")
    );
    if (titleDelta !== 0) return titleDelta;

    return String(left.id).localeCompare(String(right.id));
  });
}

function formatItemLabel(item) {
  const language = normalizeLanguageCode(item.language) || "?";
  const title = String(item.title ?? "").trim() || "(zonder titel)";
  const slug = String(item.slug ?? "").trim() || "-";
  const status = String(item.status ?? "").trim() || "-";
  return `- [${language}] ${title} | slug: ${slug} | status: ${status} | id: ${item.id}`;
}

function buildLanguageCombinationCounts(families) {
  const counts = new Map();

  for (const family of families) {
    const key = family.languages.join(", ");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([languages, count]) => ({ languages, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.languages.localeCompare(right.languages);
    });
}

function buildMarkdownReport(report) {
  const lines = [
    "# Orphan Content Families",
    "",
    `- Generated at: ${report.generatedAt}`,
    `- Primary language: ${report.primaryLanguage}`,
    `- Total families: ${report.totalFamilies}`,
    `- Families with primary language: ${report.primaryLanguageFamilies}`,
    `- Orphan families without primary language: ${report.orphanFamiliesWithoutPrimaryLanguage}`,
    `- Orphan items: ${report.orphanItems}`,
    "",
    "## Language Combinations",
    "",
  ];

  for (const entry of report.languageCombinationCounts) {
    lines.push(`- ${entry.languages}: ${entry.count}`);
  }

  lines.push("");
  lines.push("## Families");
  lines.push("");

  for (const family of report.families) {
    const representativeTitle =
      String(family.representativeItem?.title ?? "").trim() || "(zonder titel)";
    const representativeLanguage =
      normalizeLanguageCode(family.representativeItem?.language) || "?";

    lines.push(
      `### ${representativeTitle} [${representativeLanguage}] (${family.familyId})`
    );
    lines.push("");
    lines.push(`- Languages: ${family.languages.join(", ")}`);
    lines.push(`- Items: ${family.itemCount}`);
    lines.push("");
    for (const item of family.items) {
      lines.push(formatItemLabel(item));
    }
    lines.push("");
  }

  return lines.join("\n");
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
  const { primaryLanguage } = await getConfiguredLanguageSettings(supabase);

  const { data: contentItems, error: contentItemsError } = await supabase
    .from("content_items")
    .select(
      "id, title, slug, body, language, status, translation_source_id"
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

  const orphanFamilies = [];
  let orphanItems = 0;

  for (const [familyId, familyItems] of familyMap.entries()) {
    const normalizedItems = sortItems(
      familyItems.map((item) => ({
        ...item,
        language: normalizeLanguageCode(item.language),
      }))
    );

    const hasPrimaryLanguage = normalizedItems.some(
      (item) => item.language === primaryLanguage
    );

    if (hasPrimaryLanguage) {
      continue;
    }

    orphanItems += normalizedItems.length;

    const representativeItem = pickRepresentativeItem(normalizedItems);
    const languages = [...new Set(normalizedItems.map((item) => item.language).filter(Boolean))];

    orphanFamilies.push({
      familyId,
      itemCount: normalizedItems.length,
      languages,
      representativeItem,
      items: normalizedItems.map((item) => ({
        id: item.id,
        title: item.title ?? null,
        slug: item.slug ?? null,
        language: item.language ?? null,
        status: item.status ?? null,
        isRoot: getTranslationRootId(item) === item.id,
        translation_source_id: item.translation_source_id ?? null,
      })),
    });
  }

  orphanFamilies.sort((left, right) => {
    const leftTitle = String(left.representativeItem?.title ?? "").trim();
    const rightTitle = String(right.representativeItem?.title ?? "").trim();
    const titleDelta = leftTitle.localeCompare(rightTitle);
    if (titleDelta !== 0) return titleDelta;
    return left.familyId.localeCompare(right.familyId);
  });

  const report = {
    generatedAt: new Date().toISOString(),
    primaryLanguage,
    totalFamilies: familyMap.size,
    primaryLanguageFamilies: familyMap.size - orphanFamilies.length,
    orphanFamiliesWithoutPrimaryLanguage: orphanFamilies.length,
    orphanItems,
    languageCombinationCounts: buildLanguageCombinationCounts(orphanFamilies),
    families: orphanFamilies,
  };

  const outputDir = path.resolve(process.cwd(), args.outputDir ?? DEFAULT_OUTPUT_DIR);
  await fs.mkdir(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, "orphan-content-families.json");
  const mdPath = path.join(outputDir, "orphan-content-families.md");

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  await fs.writeFile(mdPath, `${buildMarkdownReport(report)}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        primaryLanguage: report.primaryLanguage,
        totalFamilies: report.totalFamilies,
        primaryLanguageFamilies: report.primaryLanguageFamilies,
        orphanFamiliesWithoutPrimaryLanguage:
          report.orphanFamiliesWithoutPrimaryLanguage,
        orphanItems: report.orphanItems,
        topLanguageCombinations: report.languageCombinationCounts.slice(0, 10),
        jsonPath,
        mdPath,
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
