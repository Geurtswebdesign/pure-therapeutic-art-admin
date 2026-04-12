import type { UiLanguage } from "@/lib/i18n/runtime";
import { resolveBaseUiLanguage } from "@/lib/i18n/runtime";

type CategoryTranslation = {
  name: string;
  description?: string;
};

type CategoryTerm = {
  slug: string;
  name: string;
  description?: string | null;
};

const en: Record<string, CategoryTranslation> = {
  welkom: {
    name: "Welcome",
    description: "Start here with a calm introduction to the app and its content.",
  },
  "rouw-verlies": {
    name: "Grief & Loss",
    description: "Find space for grief, memories, comfort and recovery.",
  },
  "cognitie-inzicht": {
    name: "Cognition & Insight",
    description:
      "Explore thoughts and mental processes. Gain insight into how your client thinks and makes decisions.",
  },
  "emoties-innerlijke-beleving": {
    name: "Emotions & Inner Experience",
    description:
      "Connect with emotions and your inner world. Develop emotional awareness and resilience.",
  },
  "gedrag-interactie": {
    name: "Behavior & Interaction",
    description:
      "Strengthen social skills and interaction. Learn to recognize patterns in behavior.",
  },
  "lichaam-zintuigen": {
    name: "Body & Senses",
    description:
      "Develop body awareness and sensory awareness. Feel what your body is telling you.",
  },
  "natuur-symboliek": {
    name: "Nature & Symbolism",
    description:
      "Discover the healing power of nature and symbolism. Find connection with yourself and your environment.",
  },
  "zingeving-rituelen-spiritualiteit": {
    name: "Meaning, Rituals & Spirituality",
    description:
      "Find meaning through rituals and spiritual practices. Deepen your inner calm and direction.",
  },
  "specifieke-doelgroepen-context": {
    name: "Specific Target Groups & Context",
    description:
      "Focused support for your unique situation and context. A suitable route for everyone.",
  },
  gratis: {
    name: "Free Content",
    description:
      "Access free exercises, meditations and wellness tools. Start your wellbeing journey today.",
  },
  "symbolen-metaforen": {
    name: "Symbols & Metaphors",
    description:
      "Work with symbolic language, images and layered meaning.",
  },
  "veiligheid-privacy": {
    name: "Safety & Privacy",
    description:
      "Read how we handle access, safety and privacy within the app.",
  },
  "algemene-voorwaarden-en-condities": { name: "Terms and conditions" },
  "angst---bang": { name: "Anxiety / fear" },
  "biologische-en-lichamelijke-gedragingen": {
    name: "Biological and bodily behaviors",
  },
  bomen: { name: "Trees" },
  "boos---kwaad": { name: "Angry / mad" },
  "cognitie-gedachten-piekeren": {
    name: "Cognition, thoughts, rumination",
  },
  copyright: { name: "Copyright" },
  "de-verliescirkel": { name: "The circle of loss" },
  disclaimer: { name: "Disclaimer" },
  divineren: { name: "Divination" },
  "duale-proces-model-dpm": { name: "Dual process model (DPM)" },
  eenzaamheid: { name: "Loneliness" },
  "gekwetstheid-en-teleurstelling": { name: "Hurt and disappointment" },
  hekserij: { name: "Witchcraft" },
  herinneringen: { name: "Memories" },
  impressum: { name: "Imprint" },
  kanker: { name: "Cancer" },
  "keltisch-jaarwiel": { name: "Celtic wheel of the year" },
  kruiden: { name: "Herbs" },
  "maanfases---volle-maan": { name: "Moon phases - full moon" },
  magie: { name: "Magic" },
  "materialenlijst-beeldende-therapie": {
    name: "Materials list for art therapy",
  },
  "materialenlijst-voor-danstherapie": {
    name: "Materials list for dance therapy",
  },
  "materialenlijst-voor-dramatherapie": {
    name: "Materials list for drama therapy",
  },
  "materialenlijst-voor-holistische-therapie": {
    name: "Materials list for holistic therapy",
  },
  "materialenlijst-voor-kunstzinnige-therapiepraktijk": {
    name: "Materials list for artistic therapy practice",
  },
  "materialenlijst-voor-mindfull-therapie": {
    name: "Materials list for mindfulness therapy",
  },
  "materialenlijst-voor-muziektherapie": {
    name: "Materials list for music therapy",
  },
  "materialenlijst-voor-psychomotorische-therapie": {
    name: "Materials list for psychomotor therapy",
  },
  "materialenlijst-voor-speltherapie": {
    name: "Materials list for play therapy",
  },
  meditaties: { name: "Meditations" },
  "negatieve-gedragingen": { name: "Negative behaviors" },
  "niet-aangeboren-hersenletsel-nah": {
    name: "Acquired brain injury (ABI)",
  },
  noten: { name: "Nuts" },
  opluchting: { name: "Relief" },
  planeten: { name: "Planets" },
  "positieve-gedragingen": { name: "Positive behaviors" },
  "privacyverklaring-avg": { name: "Privacy policy (GDPR)" },
  rituelen: { name: "Rituals" },
  rouwtaken: { name: "Tasks of mourning" },
  trauma: { name: "Trauma" },
  trots: { name: "Pride" },
  "veilig-en-onveilig": { name: "Safe and unsafe" },
  verdriet: { name: "Sadness" },
  veren: { name: "Feathers" },
  weersomstandigheden: { name: "Weather conditions" },
  zelfvertrouwen: { name: "Self-confidence" },
  zelfbeeld: { name: "Self-image" },
  "controle-en-loslaten": { name: "Control and letting go" },
  "gevoelens---algemene-werkvormen": {
    name: "Feelings - general exercises",
  },
  grenzen: { name: "Boundaries" },
  toekomst: { name: "Future" },
  "symbolen-tekens-metaforen": { name: "Symbols, signs, metaphors" },
  "sprookjes-archetypen": { name: "Fairy tales / archetypes" },
  "misbruik---mishandeling": { name: "Abuse / mistreatment" },
  sjablonen: { name: "Templates" },
  "bilaterale-werkvormen": { name: "Bilateral exercises" },
  "magische-en-mythische-wezens": { name: "Magical and mythical beings" },
  mindfullness: { name: "Mindfulness" },
  "sensorisch-sensopatische-en-kinesthetsche-werken": {
    name: "Sensory, sensopathic and kinesthetic work",
  },
  troost: { name: "Comfort" },
  stenen: { name: "Stones" },
  verslaving: { name: "Addiction" },
  "vier-elementen-water-aarde-lucht-vuur": {
    name: "Four elements (water-earth-air-fire)",
  },
};

const de: Record<string, CategoryTranslation> = {
  welkom: {
    name: "Willkommen",
    description: "Starte hier mit einer ruhigen Einfuhrung in die App und ihre Inhalte.",
  },
  "rouw-verlies": {
    name: "Trauer & Verlust",
    description: "Finde Raum fur Trauer, Erinnerungen, Trost und Erholung.",
  },
  "cognitie-inzicht": {
    name: "Kognition & Einsicht",
    description:
      "Erkunde Gedanken und mentale Prozesse. Gewinne Einsicht darin, wie dein Klient denkt und Entscheidungen trifft.",
  },
  "emoties-innerlijke-beleving": {
    name: "Emotionen & Inneres Erleben",
    description:
      "Verbinde dich mit Emotionen und deiner inneren Welt. Entwickle emotionales Bewusstsein und Resilienz.",
  },
  "gedrag-interactie": {
    name: "Verhalten & Interaktion",
    description:
      "Starke soziale Fahigkeiten und Interaktion. Lerne Muster im Verhalten zu erkennen.",
  },
  "lichaam-zintuigen": {
    name: "Korper & Sinne",
    description:
      "Entwickle Korperbewusstsein und sensorische Wahrnehmung. Spure, was dein Korper dir sagt.",
  },
  "natuur-symboliek": {
    name: "Natur & Symbolik",
    description:
      "Entdecke die heilende Kraft von Natur und Symbolik. Finde Verbindung zu dir selbst und deiner Umgebung.",
  },
  "zingeving-rituelen-spiritualiteit": {
    name: "Sinn, Rituale & Spiritualitat",
    description:
      "Finde Bedeutung durch Rituale und spirituelle Praktiken. Vertiefe innere Ruhe und Orientierung.",
  },
  "specifieke-doelgroepen-context": {
    name: "Spezifische Zielgruppen & Kontext",
    description:
      "Gezielte Unterstutzung fur deine einzigartige Situation und deinen Kontext. Eine passende Route fur alle.",
  },
  gratis: {
    name: "Kostenlose Inhalte",
    description:
      "Zugang zu kostenlosen Ubungen, Meditationen und Wellness-Tools. Starte heute deine Wohlbefindensreise.",
  },
  "symbolen-metaforen": {
    name: "Symbole & Metaphern",
    description:
      "Arbeite mit symbolischer Sprache, Bildern und mehrschichtiger Bedeutung.",
  },
  "veiligheid-privacy": {
    name: "Sicherheit & Datenschutz",
    description:
      "Lies, wie wir Zugang, Sicherheit und Datenschutz in der App handhaben.",
  },
  "algemene-voorwaarden-en-condities": {
    name: "Allgemeine Bedingungen und Konditionen",
  },
  "angst---bang": { name: "Angst / Furcht" },
  "biologische-en-lichamelijke-gedragingen": {
    name: "Biologische und korperliche Verhaltensweisen",
  },
  bomen: { name: "Baume" },
  "boos---kwaad": { name: "Wut / Arger" },
  "cognitie-gedachten-piekeren": {
    name: "Kognition, Gedanken, Grubeln",
  },
  copyright: { name: "Copyright" },
  "de-verliescirkel": { name: "Der Verlustkreis" },
  disclaimer: { name: "Disclaimer" },
  divineren: { name: "Divination" },
  "duale-proces-model-dpm": { name: "Duales Prozessmodell (DPM)" },
  eenzaamheid: { name: "Einsamkeit" },
  "gekwetstheid-en-teleurstelling": {
    name: "Verletztheit und Enttauschung",
  },
  hekserij: { name: "Hexerei" },
  herinneringen: { name: "Erinnerungen" },
  impressum: { name: "Impressum" },
  kanker: { name: "Krebs" },
  "keltisch-jaarwiel": { name: "Keltisches Jahresrad" },
  kruiden: { name: "Krauter" },
  "maanfases---volle-maan": { name: "Mondphasen - Vollmond" },
  magie: { name: "Magie" },
  "materialenlijst-beeldende-therapie": {
    name: "Materialliste fur Kunsttherapie",
  },
  "materialenlijst-voor-danstherapie": {
    name: "Materialliste fur Tanztherapie",
  },
  "materialenlijst-voor-dramatherapie": {
    name: "Materialliste fur Dramatherapie",
  },
  "materialenlijst-voor-holistische-therapie": {
    name: "Materialliste fur ganzheitliche Therapie",
  },
  "materialenlijst-voor-kunstzinnige-therapiepraktijk": {
    name: "Materialliste fur kunsttherapeutische Praxis",
  },
  "materialenlijst-voor-mindfull-therapie": {
    name: "Materialliste fur Achtsamkeitstherapie",
  },
  "materialenlijst-voor-muziektherapie": {
    name: "Materialliste fur Musiktherapie",
  },
  "materialenlijst-voor-psychomotorische-therapie": {
    name: "Materialliste fur psychomotorische Therapie",
  },
  "materialenlijst-voor-speltherapie": {
    name: "Materialliste fur Spieltherapie",
  },
  meditaties: { name: "Meditationen" },
  "negatieve-gedragingen": { name: "Negative Verhaltensweisen" },
  "niet-aangeboren-hersenletsel-nah": {
    name: "Nicht angeborene Hirnverletzung (NAH)",
  },
  noten: { name: "Nusse" },
  opluchting: { name: "Erleichterung" },
  planeten: { name: "Planeten" },
  "positieve-gedragingen": { name: "Positive Verhaltensweisen" },
  "privacyverklaring-avg": { name: "Datenschutzerklarung (DSGVO)" },
  rituelen: { name: "Rituale" },
  rouwtaken: { name: "Traueraufgaben" },
  trauma: { name: "Trauma" },
  trots: { name: "Stolz" },
  "veilig-en-onveilig": { name: "Sicher und unsicher" },
  verdriet: { name: "Traurigkeit" },
  veren: { name: "Federn" },
  weersomstandigheden: { name: "Wetterbedingungen" },
  zelfvertrouwen: { name: "Selbstvertrauen" },
  zelfbeeld: { name: "Selbstbild" },
  "controle-en-loslaten": { name: "Kontrolle und Loslassen" },
  "gevoelens---algemene-werkvormen": {
    name: "Gefuhle - allgemeine Arbeitsformen",
  },
  grenzen: { name: "Grenzen" },
  toekomst: { name: "Zukunft" },
  "symbolen-tekens-metaforen": {
    name: "Symbole, Zeichen, Metaphern",
  },
  "sprookjes-archetypen": { name: "Marchen / Archetypen" },
  "misbruik---mishandeling": { name: "Missbrauch / Misshandlung" },
  sjablonen: { name: "Vorlagen" },
  "bilaterale-werkvormen": { name: "Bilaterale Arbeitsformen" },
  "magische-en-mythische-wezens": {
    name: "Magische und mythische Wesen",
  },
  mindfullness: { name: "Achtsamkeit" },
  "sensorisch-sensopatische-en-kinesthetsche-werken": {
    name: "Sensorisches, sensopathisches und kinasthetisches Arbeiten",
  },
  troost: { name: "Trost" },
  stenen: { name: "Steine" },
  verslaving: { name: "Sucht" },
  "vier-elementen-water-aarde-lucht-vuur": {
    name: "Vier Elemente (Wasser-Erde-Luft-Feuer)",
  },
};

function getTranslationMap(language: UiLanguage) {
  const baseLanguage = resolveBaseUiLanguage(language);
  if (baseLanguage === "en") return en;
  if (baseLanguage === "de") return de;
  return null;
}

export function translateCategoryTerm<T extends CategoryTerm>(
  term: T,
  language: UiLanguage
): T {
  const translations = getTranslationMap(language);
  const translation = translations?.[term.slug];

  if (!translation) {
    return term;
  }

  return {
    ...term,
    name: translation.name,
    description:
      translation.description !== undefined
        ? translation.description
        : term.description,
  };
}

export function getTranslatedCategoryName(
  slug: string,
  language: UiLanguage,
  fallbackName?: string | null
) {
  const translations = getTranslationMap(language);
  const translation = translations?.[slug];
  return translation?.name ?? fallbackName ?? slug;
}
