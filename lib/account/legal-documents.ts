import "server-only";

import type { UiLanguage } from "@/lib/i18n/runtime";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripRichText } from "@/lib/content/stripRichText";

export type LegalDocumentSlug = string;

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  body: string;
  href?: string | null;
};

type LegalContentItemRow = {
  id?: string | null;
  slug: string | null;
  title: string | null;
  excerpt?: string | null;
  body?: string | null;
  language: string | null;
  status: string | null;
  published_at?: string | null;
  updated_at?: string | null;
};

type LegalDocumentDefinition = LegalDocument & {
  slugAliases: string[];
  titleAliases: string[];
};

function buildContentHref(item: Pick<LegalContentItemRow, "slug" | "language">) {
  if (!item.slug) {
    return null;
  }

  return item.language ? `/${item.language}/${item.slug}` : `/content/${item.slug}`;
}

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function summarizeContent(item: Pick<LegalContentItemRow, "excerpt" | "body">) {
  const text = stripRichText(item.excerpt || item.body || "");
  if (!text) return "";
  return text.length > 220 ? `${text.slice(0, 217).trim()}...` : text;
}

function toNormalizedSet(values: string[]) {
  return new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function scoreContentMatch(
  item: LegalContentItemRow,
  slugAliases: Set<string>,
  titleAliases: Set<string>,
  preferredLanguage: UiLanguage
) {
  let score = 0;

  const normalizedSlug = item.slug?.trim().toLowerCase() ?? "";
  const normalizedTitle = item.title?.trim().toLowerCase() ?? "";
  const normalizedLanguage = item.language?.trim().toLowerCase() ?? "";

  if (normalizedSlug && slugAliases.has(normalizedSlug)) {
    score += 3;
  }

  if (normalizedTitle && titleAliases.has(normalizedTitle)) {
    score += 2;
  }

  if (normalizedLanguage === preferredLanguage) {
    score += 1;
  }

  return score;
}

async function attachLegalContentHrefs(
  documents: LegalDocumentDefinition[],
  preferredLanguage: UiLanguage
): Promise<LegalDocument[]> {
  const supabase = createAdminClient();
  const slugCandidates = Array.from(
    new Set(documents.flatMap((document) => document.slugAliases))
  );

  const titleCandidates = Array.from(
    new Set(documents.flatMap((document) => document.titleAliases))
  );

  const orClauses = [
    ...slugCandidates.map((slug) => `slug.eq.${slug}`),
    ...titleCandidates.map((title) => `title.eq.${title}`),
  ];

  if (!orClauses.length) {
    return documents;
  }

  const { data, error } = await supabase
    .from("content_items")
    .select("slug, title, language, status")
    .eq("status", "published")
    .or(orClauses.join(","))
    .returns<LegalContentItemRow[]>();

  if (error) {
    console.error("attachLegalContentHrefs", error);
    return documents;
  }

  const rows = data ?? [];

  return documents.map((document) => {
    const slugAliases = toNormalizedSet(document.slugAliases);
    const titleAliases = toNormalizedSet(document.titleAliases);
    const bestMatch = rows
      .map((row) => ({
        row,
        score: scoreContentMatch(row, slugAliases, titleAliases, preferredLanguage),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)[0]?.row;

    return {
      slug: document.slug,
      title: document.title,
      body: document.body,
      href: bestMatch ? buildContentHref(bestMatch) : null,
    };
  });
}

async function getSecurityPrivacyCategoryDocuments(
  preferredLanguage: UiLanguage
): Promise<LegalDocument[]> {
  const supabase = createAdminClient();

  const { data: terms, error: termsError } = await supabase
    .from("content_terms")
    .select("id, parent_id, slug, name, sort_order")
    .order("sort_order", { ascending: true })
    .returns<
      Array<{
        id: string;
        parent_id: string | null;
        slug: string | null;
        name: string | null;
        sort_order: number | null;
      }>
    >();

  if (termsError) {
    console.error("getSecurityPrivacyCategoryDocuments:terms", termsError);
    return [];
  }

  const legalRootIds = new Set(
    (terms ?? [])
      .filter((term) => {
        const slug = normalizeValue(term.slug);
        const name = normalizeValue(term.name);
        return (
          slug === "veiligheid-privacy" ||
          slug === "security-privacy" ||
          name === "veiligheid & privacy" ||
          name === "security & privacy" ||
          name === "sicherheit & datenschutz"
        );
      })
      .map((term) => term.id)
  );

  if (!legalRootIds.size) return [];

  const termIds = new Set(legalRootIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const term of terms ?? []) {
      if (term.parent_id && termIds.has(term.parent_id) && !termIds.has(term.id)) {
        termIds.add(term.id);
        changed = true;
      }
    }
  }

  const { data: relationships, error: relationshipsError } = await supabase
    .from("content_term_relationships")
    .select("content_item_id, term_id")
    .in("term_id", Array.from(termIds))
    .returns<Array<{ content_item_id: string | null; term_id: string | null }>>();

  if (relationshipsError) {
    console.error(
      "getSecurityPrivacyCategoryDocuments:relationships",
      relationshipsError
    );
    return [];
  }

  const contentItemIds = Array.from(
    new Set(
      (relationships ?? [])
        .map((relationship) => relationship.content_item_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!contentItemIds.length) return [];

  const { data: items, error: itemsError } = await supabase
    .from("content_items")
    .select("id, slug, title, excerpt, body, language, status, published_at, updated_at")
    .in("id", contentItemIds)
    .eq("status", "published")
    .returns<LegalContentItemRow[]>();

  if (itemsError) {
    console.error("getSecurityPrivacyCategoryDocuments:items", itemsError);
    return [];
  }

  return (items ?? [])
    .filter((item) => item.slug && item.title)
    .sort((left, right) => {
      const leftLanguage = normalizeValue(left.language);
      const rightLanguage = normalizeValue(right.language);
      if (leftLanguage === preferredLanguage && rightLanguage !== preferredLanguage) return -1;
      if (rightLanguage === preferredLanguage && leftLanguage !== preferredLanguage) return 1;

      const leftDate = left.published_at ?? left.updated_at ?? "";
      const rightDate = right.published_at ?? right.updated_at ?? "";
      return rightDate.localeCompare(leftDate);
    })
    .map((item) => ({
      slug: item.slug!,
      title: item.title!,
      body: summarizeContent(item),
      href: buildContentHref(item),
    }));
}

export async function getLegalDocuments(
  language: UiLanguage,
  currentYear = new Date().getFullYear()
): Promise<LegalDocument[]> {
  let definitions: LegalDocumentDefinition[];

  if (language === "en") {
    definitions = [
      {
        slug: "disclaimer",
        title: "Disclaimer",
        body:
          "This app supports reflection and therapeutic work, but does not replace medical care, mental health treatment or emergency services. If acute or severe complaints arise, always contact an appropriate healthcare provider or emergency service.",
        slugAliases: ["disclaimer"],
        titleAliases: ["Disclaimer", "disclaimer"],
      },
      {
        slug: "terms",
        title: "Terms & conditions",
        body:
          "These terms describe how accounts, purchases, subscriptions, content access and liability limits are handled within the app. They apply to the use of the platform, the protected content and any related services.",
        slugAliases: [
          "terms-and-conditions",
          "algemene-voorwaarden-en-condities",
        ],
        titleAliases: [
          "Terms & conditions",
          "Algemene voorwaarden en condities",
        ],
      },
      {
        slug: "privacy",
        title: "Privacy statement (GDPR)",
        body:
          "The privacy statement explains which personal data is processed, for which purposes, how long the data is retained, who may receive it and which rights users have under GDPR, including access, correction and deletion.",
        slugAliases: ["privacyverklaring-avg", "privacy-statement-gdpr"],
        titleAliases: [
          "Privacy statement (GDPR)",
          "Privacyverklaring AVG",
        ],
      },
      {
        slug: "impressum",
        title: "Impressum",
        body:
          "The impressum contains the legal identity of the organisation, contact details, registration information and the party responsible for the content and publication of the app.",
        slugAliases: ["impressum", "imperssum"],
        titleAliases: ["Impressum", "Imperssum"],
      },
      {
        slug: "copyright",
        title: `Copyright © 2025 - ${currentYear}`,
        body:
          "All texts, assignments, downloads, visuals and other app materials are protected by copyright. Use outside the app or without written permission is not allowed.",
        slugAliases: ["copyright"],
        titleAliases: ["Copyright", "copyright"],
      },
    ];
  } else if (language === "de") {
    definitions = [
      {
        slug: "disclaimer",
        title: "Haftungsausschluss",
        body:
          "Diese App unterstutzt Reflexion und therapeutische Arbeit, ersetzt jedoch weder medizinische Versorgung noch psychologische Behandlung oder Notfallhilfe. Bei akuten oder schweren Beschwerden ist immer ein geeigneter Gesundheitsdienst zu kontaktieren.",
        slugAliases: ["haftungsausschluss", "disclaimer"],
        titleAliases: ["Haftungsausschluss", "Disclaimer", "disclaimer"],
      },
      {
        slug: "terms",
        title: "Allgemeine Geschaftsbedingungen",
        body:
          "Diese Bedingungen regeln die Nutzung von Konten, Einkaufen, Abonnements, Inhaltszugang und Haftungsgrenzen innerhalb der App. Sie gelten fur die Nutzung der Plattform, geschutzter Inhalte und zugehoriger Dienste.",
        slugAliases: [
          "allgemeine-geschaftsbedingungen",
          "algemene-voorwaarden-en-condities",
        ],
        titleAliases: [
          "Allgemeine Geschaftsbedingungen",
          "Algemene voorwaarden en condities",
        ],
      },
      {
        slug: "privacy",
        title: "Datenschutzerklarung (DSGVO)",
        body:
          "Die Datenschutzerklarung beschreibt, welche personenbezogenen Daten verarbeitet werden, zu welchen Zwecken dies geschieht, wie lange Daten gespeichert werden, wer sie erhalten kann und welche Rechte Nutzer nach der DSGVO haben.",
        slugAliases: ["datenschutzerklarung-dsgvo", "privacyverklaring-avg"],
        titleAliases: [
          "Datenschutzerklarung (DSGVO)",
          "Privacyverklaring AVG",
        ],
      },
      {
        slug: "impressum",
        title: "Impressum",
        body:
          "Im Impressum stehen die rechtliche Identitat der Organisation, Kontaktdaten, Registrierungsangaben und die fur Inhalte und Veroffentlichung der App verantwortliche Stelle.",
        slugAliases: ["impressum", "imperssum"],
        titleAliases: ["Impressum", "Imperssum"],
      },
      {
        slug: "copyright",
        title: `Copyright © 2025 - ${currentYear}`,
        body:
          "Alle Texte, Aufgaben, Downloads, visuellen Materialien und sonstigen Inhalte der App sind urheberrechtlich geschutzt. Eine Nutzung ausserhalb der App oder ohne schriftliche Erlaubnis ist nicht gestattet.",
        slugAliases: ["copyright"],
        titleAliases: ["Copyright", "copyright"],
      },
    ];
  } else {
    definitions = [
      {
        slug: "disclaimer",
        title: "Disclaimer",
        body:
          "Deze app ondersteunt reflectie en therapeutisch werk, maar vervangt geen medische zorg, geestelijke gezondheidszorg of spoedhulp. Neem bij acute of ernstige klachten altijd contact op met een passende zorgverlener of noodhulpdienst.",
        slugAliases: ["disclaimer"],
        titleAliases: ["Disclaimer", "disclaimer"],
      },
      {
        slug: "terms",
        title: "Algemene voorwaarden en condities",
        body:
          "Deze voorwaarden beschrijven hoe accounts, aankopen, abonnementen, toegang tot content en aansprakelijkheidsgrenzen binnen de app geregeld zijn. Ze gelden voor het gebruik van het platform, de afgeschermde inhoud en bijbehorende diensten.",
        slugAliases: ["algemene-voorwaarden-en-condities"],
        titleAliases: ["Algemene voorwaarden en condities"],
      },
      {
        slug: "privacy",
        title: "Privacyverklaring AVG",
        body:
          "De privacyverklaring legt uit welke persoonsgegevens worden verwerkt, voor welke doelen dat gebeurt, hoe lang gegevens worden bewaard, met wie gegevens gedeeld kunnen worden en welke rechten gebruikers hebben onder de AVG.",
        slugAliases: ["privacyverklaring-avg"],
        titleAliases: ["Privacyverklaring AVG"],
      },
      {
        slug: "impressum",
        title: "Impressum",
        body:
          "In het impressum staat de juridische identiteit van de organisatie, contactinformatie, registratiedetails en wie verantwoordelijk is voor de inhoud en publicatie van de app.",
        slugAliases: ["impressum", "imperssum"],
        titleAliases: ["Impressum", "Imperssum"],
      },
      {
        slug: "copyright",
        title: `Copyright © 2025 - ${currentYear}`,
        body:
          "Alle teksten, opdrachten, downloads, visuele materialen en overige inhoud van de app vallen onder het auteursrecht. Gebruik buiten de app of zonder schriftelijke toestemming is niet toegestaan.",
        slugAliases: ["copyright"],
        titleAliases: ["Copyright", "copyright"],
      },
    ];
  }

  const [configuredDocuments, categoryDocuments] = await Promise.all([
    attachLegalContentHrefs(definitions, language),
    getSecurityPrivacyCategoryDocuments(language),
  ]);

  const existingHrefs = new Set(
    configuredDocuments
      .map((document) => document.href)
      .filter((href): href is string => Boolean(href))
  );
  const existingSlugs = new Set(
    configuredDocuments.map((document) => normalizeValue(document.slug))
  );

  const extraDocuments = categoryDocuments.filter((document) => {
    const normalizedSlug = normalizeValue(document.slug);
    return (
      !existingSlugs.has(normalizedSlug) &&
      (!document.href || !existingHrefs.has(document.href))
    );
  });

  return [...configuredDocuments, ...extraDocuments];
}
