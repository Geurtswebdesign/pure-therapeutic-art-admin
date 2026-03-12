"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";

export type ThemeSourceItem = {
  order: number;
  title: string;
  slug: string;
  imagePaths: string[];
  suggestedImagePath: string | null;
};

export type ThemeSourceSection = {
  title: string;
  slug: string;
  description: string;
  suggestedLayout: "featured" | "grid" | "list";
  suggestedSectionImagePath: string | null;
  items: ThemeSourceItem[];
};

export type ThemeSourceEntry = {
  key: string;
  parentKey: string | null;
  folderName: string;
  folderPath: string;
  title: string;
  suggestedSlug: string;
  description: string;
  introHeading: string | null;
  docxPath: string | null;
  imageCount: number;
  suggestedHeroImagePath: string | null;
  sections: ThemeSourceSection[];
  childThemeKeys?: string[];
};

export type ThemeSourceManifest = {
  sourceRoot: string;
  topLevelThemeKeys: string[];
  themeCount: number;
  themes: ThemeSourceEntry[];
};

let manifestPromise: Promise<ThemeSourceManifest> | null = null;

async function loadManifestFile() {
  const manifestPath = path.join(process.cwd(), "docs", "theme-source-manifest.json");
  const raw = await readFile(manifestPath, "utf-8");
  return JSON.parse(raw) as ThemeSourceManifest;
}

export async function getThemeSourceManifest(): Promise<ThemeSourceManifest> {
  if (!manifestPromise) {
    manifestPromise = loadManifestFile();
  }

  return manifestPromise;
}

export async function getThemeSourceEntry(
  sourceKey: string
): Promise<ThemeSourceEntry | null> {
  const manifest = await getThemeSourceManifest();
  return manifest.themes.find((theme) => theme.key === sourceKey) ?? null;
}
