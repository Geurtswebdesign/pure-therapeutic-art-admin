#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILES = [".env.local", ".env"];
const DEFAULT_BUCKETS = ["media", "content-public", "content-private"];
const LIST_LIMIT = 1000;

function parseArgs(argv) {
  const args = {
    buckets: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--bucket") {
      const value = argv[index + 1];
      if (value) {
        args.buckets.push(value);
        index += 1;
      }
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

function joinPath(prefix, name) {
  return prefix ? `${prefix}/${name}` : name;
}

function isFolderEntry(entry) {
  return !entry.id && !entry.metadata;
}

async function listFolder(client, bucket, prefix = "") {
  const entries = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: LIST_LIMIT,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`List ${bucket}/${prefix || ""} mislukt: ${error.message}`);
    }

    const page = data ?? [];
    entries.push(...page);

    if (page.length < LIST_LIMIT) break;
    offset += LIST_LIMIT;
  }

  return entries;
}

async function listAllFiles(client, bucket, prefix = "") {
  const entries = await listFolder(client, bucket, prefix);
  const files = [];

  for (const entry of entries) {
    const itemPath = joinPath(prefix, entry.name);
    if (isFolderEntry(entry)) {
      files.push(...(await listAllFiles(client, bucket, itemPath)));
      continue;
    }

    files.push({
      bucket,
      path: itemPath,
      metadata: entry.metadata ?? {},
    });
  }

  return files;
}

async function copyFile(source, destination, item, index, total) {
  const label = `[${index}/${total}] ${item.bucket}/${item.path}`;
  console.log(`Downloading ${label}`);

  const { data, error } = await source.storage.from(item.bucket).download(item.path);
  if (error) {
    throw new Error(`Download mislukt voor ${item.bucket}/${item.path}: ${error.message}`);
  }

  const body = new Uint8Array(await data.arrayBuffer());
  const contentType = data.type || item.metadata?.mimetype || "application/octet-stream";
  const cacheControlRaw = item.metadata?.cacheControl;
  const cacheControl = typeof cacheControlRaw === "string"
    ? cacheControlRaw.replace(/^max-age=/, "")
    : undefined;

  console.log(`Uploading ${label}`);
  const { error: uploadError } = await destination.storage.from(item.bucket).upload(item.path, body, {
    cacheControl,
    contentType,
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Upload mislukt voor ${item.bucket}/${item.path}: ${uploadError.message}`);
  }
}

async function main() {
  await loadEnvFiles();

  const args = parseArgs(process.argv.slice(2));
  const sourceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const destinationUrl = process.env.DEST_SUPABASE_URL;
  const destinationKey = process.env.DEST_SUPABASE_SERVICE_ROLE_KEY;
  const buckets = args.buckets.length ? args.buckets : DEFAULT_BUCKETS;

  if (!sourceUrl || !sourceKey) {
    throw new Error("Bron-Supabase env vars ontbreken in .env.local.");
  }
  if (!destinationUrl || !destinationKey) {
    throw new Error("DEST_SUPABASE_URL en DEST_SUPABASE_SERVICE_ROLE_KEY zijn verplicht.");
  }

  const source = createClient(sourceUrl, sourceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const destination = createClient(destinationUrl, destinationKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const bucket of buckets) {
    console.log(`\nBucket: ${bucket}`);
    const files = await listAllFiles(source, bucket);
    console.log(`Found ${files.length} files in ${bucket}`);

    for (let index = 0; index < files.length; index += 1) {
      await copyFile(source, destination, files[index], index + 1, files.length);
    }
  }

  console.log("\nStorage copy klaar.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
