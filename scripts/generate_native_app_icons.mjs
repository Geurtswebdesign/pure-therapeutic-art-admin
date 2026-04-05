import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE_ICON = path.join(ROOT, "assets", "branding", "logo.png");
const IOS_ICON = path.join(
  ROOT,
  "ios",
  "App",
  "App",
  "Assets.xcassets",
  "AppIcon.appiconset",
  "AppIcon-512@2x.png"
);
const ANDROID_RES = path.join(ROOT, "android", "app", "src", "main", "res");
const BG = { r: 247, g: 240, b: 233, alpha: 1 };

const LEGACY_ANDROID_SIZES = [
  ["mipmap-mdpi", 48],
  ["mipmap-hdpi", 72],
  ["mipmap-xhdpi", 96],
  ["mipmap-xxhdpi", 144],
  ["mipmap-xxxhdpi", 192],
];

const FOREGROUND_ANDROID_SIZES = [
  ["mipmap-mdpi", 108],
  ["mipmap-hdpi", 162],
  ["mipmap-xhdpi", 216],
  ["mipmap-xxhdpi", 324],
  ["mipmap-xxxhdpi", 432],
];

async function ensureSourcePng(sourcePath) {
  const extension = path.extname(sourcePath).toLowerCase();
  if (extension === ".png") {
    return sourcePath;
  }

  if (extension !== ".ico") {
    throw new Error(`Unsupported icon source: ${extension}`);
  }

  const tempPath = path.join(os.tmpdir(), "pta-native-icon-source.png");
  execFileSync("sips", ["-s", "format", "png", sourcePath, "--out", tempPath], {
    stdio: "ignore",
  });
  return tempPath;
}

async function createIosIcon(sourcePngPath) {
  const foreground = await sharp(sourcePngPath)
    .resize(760, 760, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: foreground, gravity: "center" }])
    .png()
    .toFile(IOS_ICON);
}

async function createAndroidIcons(sourcePngPath) {
  const fullIcon = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      {
        input: await sharp(sourcePngPath)
          .resize(760, 760, { fit: "contain" })
          .png()
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toBuffer();

  for (const [dir, size] of LEGACY_ANDROID_SIZES) {
    const baseFile = path.join(ANDROID_RES, dir, "ic_launcher.png");
    const roundFile = path.join(ANDROID_RES, dir, "ic_launcher_round.png");

    await sharp(fullIcon).resize(size, size).png().toFile(baseFile);
    await sharp(fullIcon).resize(size, size).png().toFile(roundFile);
  }

  for (const [dir, size] of FOREGROUND_ANDROID_SIZES) {
    const file = path.join(ANDROID_RES, dir, "ic_launcher_foreground.png");
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: await sharp(sourcePngPath)
            .resize(Math.round(size * 0.72), Math.round(size * 0.72), {
              fit: "contain",
            })
            .png()
            .toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(file);
  }
}

async function main() {
  await fs.access(SOURCE_ICON);
  const sourcePngPath = await ensureSourcePng(SOURCE_ICON);
  await createIosIcon(sourcePngPath);
  await createAndroidIcons(sourcePngPath);
  console.log("Native app icons generated from assets/branding/logo.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
