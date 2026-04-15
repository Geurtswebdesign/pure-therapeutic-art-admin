import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const ROOT = process.cwd();
const FALLBACK_IMAGE = path.join(ROOT, "assets", "branding", "logo2.png");
const IOS_SPLASH_DIR = path.join(
  ROOT,
  "ios",
  "App",
  "App",
  "Assets.xcassets",
  "Splash.imageset"
);
const ANDROID_RES = path.join(ROOT, "android", "app", "src", "main", "res");
const ANDROID_SPLASH_FOREGROUND = path.join(
  ANDROID_RES,
  "drawable-nodpi",
  "splash_foreground.png"
);
const ANDROID_SPLASH_BRANDING = path.join(
  ANDROID_RES,
  "drawable-nodpi",
  "splash_branding.png"
);

const IOS_SPLASH_FILES = [
  "splash-2732x2732-2.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732.png",
];

const ANDROID_SPLASH_SIZES = [
  ["drawable/splash.png", 480, 320],
  ["drawable-land-mdpi/splash.png", 480, 320],
  ["drawable-land-hdpi/splash.png", 800, 480],
  ["drawable-land-xhdpi/splash.png", 1280, 720],
  ["drawable-land-xxhdpi/splash.png", 1600, 960],
  ["drawable-land-xxxhdpi/splash.png", 1920, 1280],
  ["drawable-port-mdpi/splash.png", 320, 480],
  ["drawable-port-hdpi/splash.png", 480, 800],
  ["drawable-port-xhdpi/splash.png", 720, 1280],
  ["drawable-port-xxhdpi/splash.png", 960, 1600],
  ["drawable-port-xxxhdpi/splash.png", 1280, 1920],
];

const TITLE_LINES = ["Pure Grief", "and", "Therapeutic", "ART"];
const FALLBACK_SLOGAN = "Rust, groei en troost in een plek";

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) return null;
  let [, key, value] = match;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

async function loadLocalEnv() {
  for (const fileName of [".env.local", ".env.production", ".env"]) {
    const filePath = path.join(ROOT, fileName);

    try {
      const contents = await fs.readFile(filePath, "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const entry = parseEnvLine(line);
        if (!entry) continue;
        const [key, value] = entry;
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    } catch {
      // Ignore missing env files.
    }
  }
}

async function getSplashConfig() {
  await loadLocalEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    return { imageUrl: null, slogan: FALLBACK_SLOGAN };
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "customizer")
      .maybeSingle();

    if (error) {
      throw error;
    }

    const value = data?.value || {};
    return {
      imageUrl: value?.splashImageUrl?.trim() || null,
      slogan: value?.splashSlogan?.trim() || FALLBACK_SLOGAN,
    };
  } catch {
    return { imageUrl: null, slogan: FALLBACK_SLOGAN };
  }
}

async function getSourceImageBuffer(imageUrl) {
  if (imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }
    } catch {
      // Fallback below.
    }
  }

  return fs.readFile(FALLBACK_IMAGE);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function makeOverlaySvg(width, height, slogan) {
  const titleBase = Math.min(width, height);
  const isLandscape = width > height;
  const titleFontSize = Math.round(titleBase * (isLandscape ? 0.07 : 0.084));
  const titleLineHeight = Math.round(titleFontSize * 1.18);
  const titleStartY = Math.round(height * (isLandscape ? 0.55 : 0.57));
  const spinnerSize = Math.round(titleBase * (isLandscape ? 0.08 : 0.09));
  const spinnerY = Math.round(height * (isLandscape ? 0.79 : 0.78));
  const sloganFontSize = Math.round(titleBase * (isLandscape ? 0.04 : 0.052));
  const sloganY = Math.round(height * (isLandscape ? 0.91 : 0.89));
  const sloganLineHeight = Math.round(sloganFontSize * 1.3);
  const safeSlogan = escapeXml(`“${slogan}”`);

  const titleText = TITLE_LINES.map(
    (line, index) =>
      `<text x="50%" y="${titleStartY + index * titleLineHeight}" text-anchor="middle" fill="#5a514d" font-family="Georgia, 'Times New Roman', serif" font-size="${titleFontSize}" font-weight="400">${escapeXml(line)}</text>`
  ).join("");

  const sloganLines = safeSlogan.split("\n");
  const sloganText = sloganLines
    .map(
      (line, index) =>
        `<text x="50%" y="${sloganY + index * sloganLineHeight}" text-anchor="middle" fill="#756c68" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${sloganFontSize}" font-weight="500">${line}</text>`
    )
    .join("");

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="bg" cx="50%" cy="18%" r="90%">
          <stop offset="0%" stop-color="#faf3ea"/>
          <stop offset="45%" stop-color="#f2e6dc"/>
          <stop offset="100%" stop-color="#ebddd6"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      ${titleText}
      <circle cx="${width / 2}" cy="${spinnerY}" r="${spinnerSize / 2}" fill="none" stroke="#d8c8c2" stroke-width="${Math.max(4, Math.round(spinnerSize * 0.12))}" />
      <path d="M ${width / 2} ${spinnerY - spinnerSize / 2} A ${spinnerSize / 2} ${spinnerSize / 2} 0 0 1 ${width / 2 + spinnerSize / 2} ${spinnerY}" fill="none" stroke="#8f372f" stroke-width="${Math.max(4, Math.round(spinnerSize * 0.12))}" stroke-linecap="round" />
      <path d="M ${width / 2} ${spinnerY + spinnerSize / 2} A ${spinnerSize / 2} ${spinnerSize / 2} 0 0 1 ${width / 2 - spinnerSize / 3} ${spinnerY + spinnerSize / 3}" fill="none" stroke="#8fae96" stroke-width="${Math.max(4, Math.round(spinnerSize * 0.12))}" stroke-linecap="round" />
      ${sloganText}
    </svg>
  `);
}

async function makeSplash(width, height, imageBuffer, slogan) {
  const isLandscape = width > height;
  const artBox = Math.round(Math.min(width * 0.52, height * (isLandscape ? 0.42 : 0.3)));
  const artY = Math.round(height * (isLandscape ? 0.12 : 0.12));

  const artwork = await sharp(imageBuffer)
    .resize(artBox, artBox, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 247, g: 239, b: 232, alpha: 1 },
    },
  })
    .composite([
      { input: makeOverlaySvg(width, height, slogan), gravity: "center" },
      {
        input: artwork,
        top: artY,
        left: Math.round((width - artBox) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function writeIosSplash(imageBuffer, slogan) {
  const splash = await makeSplash(2732, 2732, imageBuffer, slogan);

  await Promise.all(
    IOS_SPLASH_FILES.map((fileName) =>
      sharp(splash).toFile(path.join(IOS_SPLASH_DIR, fileName))
    )
  );
}

async function writeAndroidSplash(imageBuffer, slogan) {
  for (const [relativePath, width, height] of ANDROID_SPLASH_SIZES) {
    const outputPath = path.join(ANDROID_RES, relativePath);
    const splash = await makeSplash(width, height, imageBuffer, slogan);
    await sharp(splash).toFile(outputPath);
  }
}

async function writeAndroidSplashForeground(imageBuffer) {
  await fs.mkdir(path.dirname(ANDROID_SPLASH_FOREGROUND), { recursive: true });

  const foreground = await sharp({
    create: {
      width: 960,
      height: 960,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(imageBuffer)
          .resize(860, 860, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer(),
        top: 50,
        left: 50,
      }
    ])
    .png()
    .toBuffer();

  await sharp(foreground).toFile(ANDROID_SPLASH_FOREGROUND);
}

async function writeAndroidSplashBranding(slogan) {
  await fs.mkdir(path.dirname(ANDROID_SPLASH_BRANDING), { recursive: true });

  const safeSlogan = escapeXml(`“${slogan}”`);
  const branding = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="720" viewBox="0 0 1400 720">
      <text x="50%" y="140" text-anchor="middle" fill="#5a514d" font-family="Georgia, 'Times New Roman', serif" font-size="124" font-weight="400">Pure Grief</text>
      <text x="50%" y="275" text-anchor="middle" fill="#5a514d" font-family="Georgia, 'Times New Roman', serif" font-size="124" font-weight="400">and Therapeutic ART</text>
      <circle cx="700" cy="405" r="58" fill="none" stroke="#d8c8c2" stroke-width="12" />
      <path d="M 700 347 A 58 58 0 0 1 758 405" fill="none" stroke="#8f372f" stroke-width="12" stroke-linecap="round" />
      <path d="M 700 463 A 58 58 0 0 1 662 445" fill="none" stroke="#8fae96" stroke-width="12" stroke-linecap="round" />
      <text x="50%" y="600" text-anchor="middle" fill="#756c68" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="62" font-weight="500">${safeSlogan}</text>
    </svg>
  `);

  await sharp(branding).png().toFile(ANDROID_SPLASH_BRANDING);
}

async function main() {
  const config = await getSplashConfig();
  const imageBuffer = await getSourceImageBuffer(config.imageUrl);
  await writeIosSplash(imageBuffer, config.slogan);
  await writeAndroidSplash(imageBuffer, config.slogan);
  await writeAndroidSplashForeground(imageBuffer);
  await writeAndroidSplashBranding(config.slogan);
  console.log("Native splash assets generated from current splash settings");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
