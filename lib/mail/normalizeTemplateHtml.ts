export function normalizeTemplateHtml(html: string): string {
  const stripped = html
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .trim();

  // Enforce shared layout visuals: remove local background overrides from template content.
  return stripped
    .replace(/\sbgcolor=(["']).*?\1/gi, "")
    .replace(
      /\sstyle=(["'])(.*?)\1/gi,
      (_match, quote: string, styleValue: string) => {
        const cleaned = styleValue
          .replace(/(?:^|;)\s*background(?:-color|-image)?\s*:[^;]*/gi, "")
          .replace(/(?:^|;)\s*color\s*:[^;]*/gi, "")
          .replace(/^;+|;+$/g, "")
          .trim();
        return cleaned ? ` style=${quote}${cleaned}${quote}` : "";
      }
    );
}

