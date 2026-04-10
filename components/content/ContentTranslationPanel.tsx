"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LanguageOption } from "@/lib/i18n/languages";
import { getLanguageDisplayLabel } from "@/lib/i18n/languages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { resolveBaseUiLanguage } from "@/lib/i18n/runtime";
import { translateContentItemToLanguage } from "@/app/admin/content/translation-actions";
import type { ContentTranslationSummary } from "@/lib/content/translation-queries";

const COPY = {
  nl: {
    title: "Automatische vertaling",
    intro:
      "Maak een nieuwe conceptversie van dit content-item in een andere taal. Bestaande vertalingen worden niet overschreven.",
    targetLanguage: "Doeltaal",
    noneAvailable:
      "Alle ondersteunde talen bestaan al voor dit item of zijn gelijk aan de huidige taal.",
    translate: "Vertaal naar concept",
    translating: "Vertalen...",
    open: "Openen",
    existing: "Bestaande vertalingen",
    exists: "Deze vertaling bestaat al en is geopend in de editor.",
    source: "bron",
  },
  en: {
    title: "Automatic translation",
    intro:
      "Create a new draft version of this content item in another language. Existing translations are not overwritten.",
    targetLanguage: "Target language",
    noneAvailable:
      "All supported languages already exist for this item or match the current language.",
    translate: "Translate to draft",
    translating: "Translating...",
    open: "Open",
    existing: "Existing translations",
    exists: "This translation already exists and has been opened in the editor.",
    source: "source",
  },
  de: {
    title: "Automatische Ubersetzung",
    intro:
      "Erstelle eine neue Entwurfsversion dieses Inhaltselements in einer anderen Sprache. Bestehende Ubersetzungen werden nicht uberschrieben.",
    targetLanguage: "Zielsprache",
    noneAvailable:
      "Alle unterstutzten Sprachen existieren bereits fur dieses Element oder entsprechen der aktuellen Sprache.",
    translate: "Als Entwurf ubersetzen",
    translating: "Wird ubersetzt...",
    open: "Offnen",
    existing: "Bestehende Ubersetzungen",
    exists:
      "Diese Ubersetzung existiert bereits und wurde im Editor geoffnet.",
    source: "quelle",
  },
} as const;

type Props = {
  contentItemId: string;
  currentLanguage: string;
  uiLanguage: UiLanguage;
  languageOptions: LanguageOption[];
  existingTranslations: ContentTranslationSummary[];
};

export default function ContentTranslationPanel({
  contentItemId,
  currentLanguage,
  uiLanguage,
  languageOptions,
  existingTranslations,
}: Props) {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = COPY[resolveBaseUiLanguage(uiLanguage)];

  const availableOptions = useMemo(() => {
    const existingLanguages = new Set(
      existingTranslations
        .map((entry) => entry.language?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
    );

    return languageOptions.filter((option) => {
      const normalizedOption = option.code.trim().toLowerCase();
      return (
        normalizedOption !== currentLanguage.trim().toLowerCase() &&
        !existingLanguages.has(normalizedOption)
      );
    });
  }, [currentLanguage, existingTranslations, languageOptions]);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full border border-stone-200 bg-stone-50 p-2 text-stone-700">
          <Languages size={18} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-stone-950">{t.title}</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">{t.intro}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,260px)_auto] lg:items-end">
        <label className="block">
          <span className="block text-sm font-medium text-stone-800">
            {t.targetLanguage}
          </span>
          <select
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            disabled={!availableOptions.length || isPending}
          >
            <option value="">-</option>
            {availableOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <button
            type="button"
            disabled={!selectedLanguage || isPending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                setMessage(null);

                try {
                  const result = await translateContentItemToLanguage({
                    contentItemId,
                    targetLanguage: selectedLanguage,
                  });

                  if (!result.created) {
                    setMessage(t.exists);
                  }

                  router.push(`/admin/content/${result.contentItemId}`);
                  router.refresh();
                } catch (nextError) {
                  setError(
                    nextError instanceof Error
                      ? nextError.message
                      : "Vertalen mislukt."
                  );
                }
              })
            }
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t.translating : t.translate}
          </button>
        </div>
      </div>

      {!availableOptions.length ? (
        <p className="mt-3 text-sm text-stone-600">{t.noneAvailable}</p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}

      {existingTranslations.length ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <h3 className="text-sm font-semibold text-stone-900">{t.existing}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {existingTranslations.map((translation) => (
              <Link
                key={translation.id}
                href={`/admin/content/${translation.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs text-stone-700"
              >
                <span>
                  {getLanguageDisplayLabel(translation.language ?? "")}
                  {translation.isSource ? ` • ${t.source}` : ""}
                </span>
                <span className="text-stone-400">/</span>
                <span>{translation.title || translation.slug || t.open}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
