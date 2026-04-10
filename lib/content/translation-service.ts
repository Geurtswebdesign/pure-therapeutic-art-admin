import "server-only";

import {
  getLanguageBaseCode,
  getLanguageDisplayLabel,
  normalizeLanguageCode,
} from "@/lib/i18n/languages";
import type { AccordionSection } from "@/lib/content/accordionSections";

type TranslationInput = {
  sourceLanguage: string;
  targetLanguage: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  featuredImageAlt: string | null;
  accordionSections: AccordionSection[];
};

export type TranslationOutput = {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  featuredImageAlt: string | null;
  accordionSections: AccordionSection[];
};

type OpenAiMessage = {
  role: "system" | "user";
  content: string;
};

function getTranslationTimeoutMs() {
  const rawValue = process.env.OPENAI_TRANSLATION_TIMEOUT_MS?.trim();
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : NaN;

  if (Number.isFinite(parsedValue) && parsedValue >= 10_000) {
    return parsedValue;
  }

  return 180_000;
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

function buildMessages(input: TranslationInput): OpenAiMessage[] {
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

function coerceAccordionSections(
  sections: unknown,
  fallback: AccordionSection[]
): AccordionSection[] {
  if (!Array.isArray(sections)) {
    return fallback;
  }

  return sections.map((section, index) => {
    const sourceSection = fallback[index];
    const record =
      section && typeof section === "object" && !Array.isArray(section)
        ? (section as Record<string, unknown>)
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

function normalizeTranslatedSlug(
  slug: string,
  sourceSlug: string,
  targetLanguage: string
) {
  const normalized = slug
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized) {
    return normalized;
  }

  const fallbackSource = sourceSlug
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const targetSuffix = getLanguageBaseCode(targetLanguage) || "translation";
  return fallbackSource ? `${fallbackSource}-${targetSuffix}` : targetSuffix;
}

export async function translateContentPayload(
  input: TranslationInput
): Promise<TranslationOutput> {
  const sourceLanguage = normalizeLanguageCode(input.sourceLanguage);
  const targetLanguage = normalizeLanguageCode(input.targetLanguage);

  if (!sourceLanguage || !targetLanguage) {
    throw new Error("Bron- of doeltaal ontbreekt voor vertaling.");
  }

  const { apiKey, model } = getOpenAiConfig();
  const timeoutMs = getTranslationTimeoutMs();

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildMessages({
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
        `OpenAI-vertaling duurde te lang en is afgebroken na ${Math.round(timeoutMs / 1000)} seconden. Probeer het opnieuw of verhoog OPENAI_TRANSLATION_TIMEOUT_MS op de server.`
      );
    }

    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429 && /insufficient_quota/i.test(errorText)) {
      throw new Error(
        "OpenAI-vertaling mislukt omdat het API-project geen beschikbare quota meer heeft. Controleer billing en credits in OpenAI Platform."
      );
    }

    throw new Error(
      `OpenAI-vertaling mislukt (${response.status}): ${errorText}`
    );
  }

  const json = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI gaf geen vertaalde inhoud terug.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
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
