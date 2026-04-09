#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILES = [".env.local", ".env.production", ".env"];
const PUBLIC_STORAGE_PATH_PREFIX = "/storage/v1/object/public/";

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

function getConfiguredSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ontbreekt.");
  }

  return new URL(value);
}

function normalizeSupabaseStorageUrl(value, targetUrl) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const sourceUrl = new URL(trimmed);
    if (!sourceUrl.pathname.startsWith(PUBLIC_STORAGE_PATH_PREFIX)) {
      return trimmed;
    }

    const sameHost =
      sourceUrl.protocol === targetUrl.protocol &&
      sourceUrl.hostname === targetUrl.hostname &&
      sourceUrl.port === targetUrl.port;

    if (sameHost) {
      return trimmed;
    }

    if (!sourceUrl.hostname.endsWith(".supabase.co")) {
      return trimmed;
    }

    sourceUrl.protocol = targetUrl.protocol;
    sourceUrl.hostname = targetUrl.hostname;
    sourceUrl.port = targetUrl.port;
    return sourceUrl.toString();
  } catch {
    return trimmed;
  }
}

async function migrateColumnTable(supabase, targetUrl, table, columns) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${columns.join(", ")}`);

  if (error) {
    throw new Error(`${table} laden mislukt: ${error.message}`);
  }

  const rows = data ?? [];
  let changed = 0;

  for (const row of rows) {
    const update = {};

    for (const column of columns) {
      const normalized = normalizeSupabaseStorageUrl(row[column], targetUrl);
      if (normalized !== row[column]) {
        update[column] = normalized;
      }
    }

    if (!Object.keys(update).length) {
      continue;
    }

    changed += 1;

    if (process.argv.includes("--apply")) {
      const { error: updateError } = await supabase
        .from(table)
        .update(update)
        .eq("id", row.id);

      if (updateError) {
        throw new Error(`${table} update mislukt voor ${row.id}: ${updateError.message}`);
      }
    }
  }

  return changed;
}

async function migrateAppSettings(supabase, targetUrl) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("id, key, value")
    .in("key", ["general", "customizer"]);

  if (error) {
    throw new Error(`app_settings laden mislukt: ${error.message}`);
  }

  let changed = 0;

  for (const row of data ?? []) {
    const value =
      row.value && typeof row.value === "object" && !Array.isArray(row.value)
        ? { ...row.value }
        : null;

    if (!value) {
      continue;
    }

    let dirty = false;

    if (row.key === "general" && "logoUrl" in value) {
      const normalized = normalizeSupabaseStorageUrl(value.logoUrl, targetUrl);
      if (normalized !== value.logoUrl) {
        value.logoUrl = normalized;
        dirty = true;
      }
    }

    if (row.key === "customizer" && "splashImageUrl" in value) {
      const normalized = normalizeSupabaseStorageUrl(value.splashImageUrl, targetUrl);
      if (normalized !== value.splashImageUrl) {
        value.splashImageUrl = normalized;
        dirty = true;
      }
    }

    if (!dirty) {
      continue;
    }

    changed += 1;

    if (process.argv.includes("--apply")) {
      const { error: updateError } = await supabase
        .from("app_settings")
        .update({ value })
        .eq("id", row.id);

      if (updateError) {
        throw new Error(`app_settings update mislukt voor ${row.id}: ${updateError.message}`);
      }
    }
  }

  return changed;
}

async function main() {
  await loadEnvFiles();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt.");
  }

  const targetUrl = getConfiguredSupabaseUrl();
  const apply = process.argv.includes("--apply");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const results = [];

  for (const job of [
    ["content_items", ["featured_image_url"]],
    ["content_terms", ["featured_image_url"]],
    ["content_theme_pages", ["hero_image_url"]],
    ["content_theme_sections", ["section_image_url"]],
    ["content_theme_section_items", ["override_image_url"]],
    ["customizer_headers", ["logo_url"]],
    ["email_branding_settings", ["logo_url"]],
  ]) {
    const [table, columns] = job;
    const changed = await migrateColumnTable(
      supabase,
      targetUrl,
      table,
      columns
    );
    results.push({ scope: table, changed });
  }

  results.push({
    scope: "app_settings",
    changed: await migrateAppSettings(supabase, targetUrl),
  });

  const totalChanged = results.reduce((sum, entry) => sum + entry.changed, 0);

  console.log(apply ? "APPLY MODE" : "DRY RUN");
  console.log(`Target base URL: ${targetUrl.origin}`);

  for (const result of results) {
    console.log(`${result.scope}: ${result.changed}`);
  }

  console.log(`total_changed: ${totalChanged}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
