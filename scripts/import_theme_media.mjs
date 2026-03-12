#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILES = [".env.local", ".env"];
const DEFAULT_BUCKET = "media";
const DEFAULT_PREFIX = "themes-source";
const TIFF_EXTENSIONS = new Set([".tif", ".tiff"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function parseArgs(argv) {
  const args = {
    bucket: DEFAULT_BUCKET,
    dryRun: false,
    limit: null,
    manifest: "docs/theme-source-manifest.json",
    output: "docs/theme-media-import-map.json",
    prefix: DEFAULT_PREFIX,
    sourceRoot: "/tmp/codex_theme_zip/werkvormen (nieuwe map)",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (token === "--manifest") {
      args.manifest = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--output") {
      args.output = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--source-root") {
      args.sourceRoot = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--prefix") {
      args.prefix = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--bucket") {
      args.bucket = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--limit") {
      const next = Number(argv[index + 1]);
      args.limit = Number.isFinite(next) && next > 0 ? next : null;
      index += 1;
      continue;
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
    .replace(/[^\w\s.-]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getSourcePathHash(sourcePath) {
  return createHash("sha1").update(sourcePath).digest("hex").slice(0, 10);
}

function getUsageLabel(usage) {
  if (usage.kind === "item") return usage.itemTitle || usage.sectionTitle || usage.themeTitle;
  if (usage.kind === "section") return usage.sectionTitle || usage.themeTitle;
  return usage.themeTitle;
}

function toStorageAssetPath(prefix, sourceKey, sourcePath, label, extension) {
  const safeSourceKey = sourceKey
    .split("/")
    .map((part) => slugify(part) || "theme")
    .join("/");
  const baseName = slugify(label || path.basename(sourcePath, path.extname(sourcePath))) || "asset";
  const hash = getSourcePathHash(sourcePath);
  return `${prefix}/${safeSourceKey}/${baseName}-${hash}.${extension}`;
}

function buildReferenceMap(manifest) {
  const referenceBySourcePath = new Map();

  function addUsage(sourcePath, usage) {
    if (!sourcePath) return;
    const current = referenceBySourcePath.get(sourcePath) ?? {
      sourceKey: usage.sourceKey,
      sourcePath,
      usages: [],
    };
    current.usages.push(usage);
    referenceBySourcePath.set(sourcePath, current);
  }

  for (const theme of manifest.themes) {
    addUsage(theme.suggestedHeroImagePath, {
      kind: "hero",
      sourceKey: theme.key,
      themeTitle: theme.title,
    });

    for (const section of theme.sections ?? []) {
      addUsage(section.suggestedSectionImagePath, {
        kind: "section",
        sectionSlug: section.slug,
        sectionTitle: section.title,
        sourceKey: theme.key,
        themeTitle: theme.title,
      });

      for (const item of section.items ?? []) {
        addUsage(item.suggestedImagePath, {
          kind: "item",
          itemSlug: item.slug,
          itemTitle: item.title,
          sectionSlug: section.slug,
          sectionTitle: section.title,
          sourceKey: theme.key,
          themeTitle: theme.title,
        });
      }
    }
  }

  return Array.from(referenceBySourcePath.values()).map((entry) => {
    const firstUsage = entry.usages[0];
    const sourceExt = path.extname(entry.sourcePath).toLowerCase();
    const targetExt = TIFF_EXTENSIONS.has(sourceExt) ? "jpg" : sourceExt.replace(/^\./, "");
    const altText = getUsageLabel(firstUsage) || null;
    return {
      altText,
      convertFromTiff: TIFF_EXTENSIONS.has(sourceExt),
      sourceExt,
      sourceKey: entry.sourceKey,
      sourcePath: entry.sourcePath,
      storagePath: toStorageAssetPath(
        DEFAULT_PREFIX,
        entry.sourceKey,
        entry.sourcePath,
        altText,
        targetExt
      ),
      targetExt,
      usages: entry.usages,
    };
  });
}

function getMimeType(fileExtension) {
  switch (fileExtension.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".tif":
    case ".tiff":
      return "image/tiff";
    default:
      return "application/octet-stream";
  }
}

async function runSipsConvert(sourcePath, targetPath) {
  await new Promise((resolve, reject) => {
    const child = spawn(
      "sips",
      ["-s", "format", "jpeg", "-s", "formatOptions", "normal", sourcePath, "--out", targetPath],
      { stdio: "ignore" }
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`sips conversion failed with code ${code}`));
    });
  });
}

async function prepareUploadPayload(rootPath, reference) {
  const absoluteSourcePath = path.join(rootPath, reference.sourcePath);

  if (!reference.convertFromTiff) {
    const buffer = await fs.readFile(absoluteSourcePath);
    return {
      cleanup: async () => {},
      contentType: getMimeType(reference.sourceExt),
      fileSize: buffer.byteLength,
      absoluteSourcePath,
      buffer,
      converted: false,
    };
  }

  const tempFilePath = path.join(
    os.tmpdir(),
    `theme-media-${getSourcePathHash(reference.sourcePath)}-${randomUUID()}.jpg`
  );
  await runSipsConvert(absoluteSourcePath, tempFilePath);
  const buffer = await fs.readFile(tempFilePath);

  return {
    cleanup: async () => {
      await fs.rm(tempFilePath, { force: true });
    },
    contentType: "image/jpeg",
    fileSize: buffer.byteLength,
    absoluteSourcePath,
    buffer,
    converted: true,
  };
}

async function readManifest(manifestPath) {
  const raw = await fs.readFile(path.join(process.cwd(), manifestPath), "utf-8");
  return JSON.parse(raw);
}

async function fetchExistingAssets(supabase, filePaths) {
  const results = new Map();

  for (let index = 0; index < filePaths.length; index += 100) {
    const batch = filePaths.slice(index, index + 100);
    const { data, error } = await supabase
      .from("media_assets")
      .select("id, file_path, alt_text")
      .in("file_path", batch);

    if (error) {
      throw new Error(`Bestaande media laden mislukt: ${error.message}`);
    }

    for (const row of data ?? []) {
      results.set(row.file_path, row);
    }
  }

  return results;
}

async function writeOutput(outputPath, payload) {
  const absoluteOutputPath = path.join(process.cwd(), outputPath);
  await fs.writeFile(absoluteOutputPath, JSON.stringify(payload, null, 2), "utf-8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvFiles();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase env vars ontbreken.");
  }

  const manifest = await readManifest(args.manifest);
  let references = buildReferenceMap(manifest).filter((reference) =>
    IMAGE_EXTENSIONS.has(reference.sourceExt)
  );

  references = references.map((reference) => ({
    ...reference,
    storagePath: toStorageAssetPath(
      args.prefix,
      reference.sourceKey,
      reference.sourcePath,
      reference.altText,
      reference.targetExt
    ),
  }));

  if (args.limit) {
    references = references.slice(0, args.limit);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const dbFilePaths = references.map((reference) => `${args.bucket}/${reference.storagePath}`);
  const existingByFilePath = await fetchExistingAssets(supabase, dbFilePaths);

  let processed = 0;
  let uploaded = 0;
  let skipped = 0;
  let inserted = 0;
  let converted = 0;
  const failures = [];
  const mediaEntries = [];

  for (const reference of references) {
    processed += 1;
    const dbFilePath = `${args.bucket}/${reference.storagePath}`;
    const existing = existingByFilePath.get(dbFilePath) ?? null;

    if (existing) {
      const { data } = supabase.storage.from(args.bucket).getPublicUrl(reference.storagePath);
      skipped += 1;
      mediaEntries.push({
        altText: existing.alt_text ?? reference.altText,
        convertedFrom: reference.convertFromTiff ? reference.sourceExt : null,
        mediaAssetId: existing.id,
        publicUrl: data.publicUrl,
        sourceKey: reference.sourceKey,
        sourcePath: reference.sourcePath,
        status: "existing",
        storagePath: reference.storagePath,
        usages: reference.usages,
      });
      console.log(`[${processed}/${references.length}] skip ${reference.sourcePath}`);
      continue;
    }

    console.log(`[${processed}/${references.length}] import ${reference.sourcePath}`);

    if (args.dryRun) {
      mediaEntries.push({
        altText: reference.altText,
        convertedFrom: reference.convertFromTiff ? reference.sourceExt : null,
        mediaAssetId: null,
        publicUrl: null,
        sourceKey: reference.sourceKey,
        sourcePath: reference.sourcePath,
        status: "dry-run",
        storagePath: reference.storagePath,
        usages: reference.usages,
      });
      continue;
    }

    let payload = null;

    try {
      payload = await prepareUploadPayload(args.sourceRoot, reference);
      if (payload.converted) {
        converted += 1;
      }

      const { error: uploadError } = await supabase.storage
        .from(args.bucket)
        .upload(reference.storagePath, payload.buffer, {
          contentType: payload.contentType,
          upsert: false,
        });

      if (uploadError && !uploadError.message.toLowerCase().includes("already exists")) {
        throw new Error(`Storage upload mislukt: ${uploadError.message}`);
      }

      if (!uploadError) {
        uploaded += 1;
      }

      const { data: insertData, error: insertError } = await supabase
        .from("media_assets")
        .insert({
          alt_text: reference.altText,
          file_path: dbFilePath,
          mime_type: payload.contentType,
        })
        .select("id, alt_text, file_path")
        .maybeSingle();

      let mediaRow = insertData ?? null;
      if (insertError) {
        const { data: existingRow, error: existingRowError } = await supabase
          .from("media_assets")
          .select("id, alt_text, file_path")
          .eq("file_path", dbFilePath)
          .maybeSingle();

        if (existingRowError || !existingRow) {
          throw new Error(`media_assets insert mislukt: ${insertError.message}`);
        }

        mediaRow = existingRow;
      } else {
        inserted += 1;
      }

      const { data } = supabase.storage.from(args.bucket).getPublicUrl(reference.storagePath);
      mediaEntries.push({
        altText: mediaRow.alt_text ?? reference.altText,
        convertedFrom: payload.converted ? reference.sourceExt : null,
        mediaAssetId: mediaRow.id,
        publicUrl: data.publicUrl,
        sourceKey: reference.sourceKey,
        sourcePath: reference.sourcePath,
        status: "imported",
        storagePath: reference.storagePath,
        usages: reference.usages,
      });

      if (processed % 10 === 0 || processed === references.length) {
        await writeOutput(args.output, {
          bucket: args.bucket,
          generatedAt: new Date().toISOString(),
          importedCount: mediaEntries.filter((entry) => entry.status === "imported").length,
          media: mediaEntries,
          prefix: args.prefix,
          sourceRoot: args.sourceRoot,
          totalCount: references.length,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({
        message,
        sourcePath: reference.sourcePath,
      });
      console.error(`  failed: ${message}`);
    } finally {
      await payload?.cleanup?.();
    }
  }

  await writeOutput(args.output, {
    bucket: args.bucket,
    failures,
    generatedAt: new Date().toISOString(),
    importedCount: mediaEntries.filter((entry) => entry.status === "imported").length,
    media: mediaEntries,
    prefix: args.prefix,
    skippedCount: skipped,
    sourceRoot: args.sourceRoot,
    totalCount: references.length,
  });

  console.log("");
  console.log(`Processed: ${processed}`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Inserted media rows: ${inserted}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Converted TIFF: ${converted}`);
  console.log(`Failures: ${failures.length}`);

  if (failures.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
