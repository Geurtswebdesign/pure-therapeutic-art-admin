"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";

export type ThemeImportedMediaUsage = {
  kind: "hero" | "section" | "item";
  sourceKey: string;
  themeTitle: string;
  sectionSlug?: string;
  sectionTitle?: string;
  itemSlug?: string;
  itemTitle?: string;
};

export type ThemeImportedMediaEntry = {
  altText: string | null;
  convertedFrom: string | null;
  mediaAssetId: string | null;
  publicUrl: string | null;
  sourceKey: string;
  sourcePath: string;
  status: "dry-run" | "existing" | "imported";
  storagePath: string;
  usages: ThemeImportedMediaUsage[];
};

export type ThemeImportedMediaManifest = {
  bucket: string;
  failures?: Array<{ message: string; sourcePath: string }>;
  generatedAt: string;
  importedCount: number;
  media: ThemeImportedMediaEntry[];
  prefix: string;
  skippedCount?: number;
  sourceRoot: string;
  totalCount: number;
};

let manifestPromise: Promise<ThemeImportedMediaManifest | null> | null = null;

async function loadManifestFile() {
  const manifestPath = path.join(
    process.cwd(),
    "docs",
    "theme-media-import-map.json"
  );

  try {
    const raw = await readFile(manifestPath, "utf-8");
    return JSON.parse(raw) as ThemeImportedMediaManifest;
  } catch {
    return null;
  }
}

export async function getThemeImportedMediaManifest() {
  if (!manifestPromise) {
    manifestPromise = loadManifestFile();
  }

  return manifestPromise;
}

export async function getThemeImportedMediaLookup() {
  const manifest = await getThemeImportedMediaManifest();
  if (!manifest) {
    return new Map<string, ThemeImportedMediaEntry>();
  }

  return new Map(
    manifest.media
      .filter((entry) => entry.publicUrl && entry.status !== "dry-run")
      .map((entry) => [entry.sourcePath, entry])
  );
}
