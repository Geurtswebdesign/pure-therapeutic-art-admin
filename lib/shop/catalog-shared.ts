export type CatalogCategory = "boeken" | "ebooks" | "spellen";
export type CatalogStatus = "concept" | "live" | "in_development";

export type CatalogItem = {
  id: string;
  category: CatalogCategory;
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  introTitle: string;
  introText: string;
  descriptionTitle: string;
  detailsTitle: string;
  purchaseTitle: string;
  purchaseDescription: string;
  purchaseButtonLabel: string;
  developmentStateLabel: string;
  unavailablePriceLabel: string;
  developmentCalloutLabel: string;
  developmentPurchaseText: string;
  developmentNotice: string;
  format: string;
  price: number;
  description: string;
  details: string[];
  tag: string;
  href?: string;
  contentSlug?: string;
  epubUrl?: string;
  status?: CatalogStatus;
};

export type ShopCatalogSettings = {
  books: CatalogItem[];
  ebooks: CatalogItem[];
  games: CatalogItem[];
};

export const SHOP_CATALOG_SETTINGS_KEY = "shop_catalog";

const COMMON_PRODUCT_TEXT_DEFAULTS = {
  descriptionTitle: "Beschrijving",
  detailsTitle: "Meer informatie",
  purchaseTitle: "Bestellen",
  purchaseDescription:
    "Wanneer je doorgaat, open je de productpagina van De Troostboom om het product daar verder te bekijken en te kopen.",
  purchaseButtonLabel: "Kopen via De Troostboom",
  developmentStateLabel: "In ontwikkeling",
  unavailablePriceLabel: "Nog niet beschikbaar",
  developmentCalloutLabel: "Deze optie is in ontwikkeling",
  developmentPurchaseText:
    "Deze digitale optie is nog niet live. Je kunt hem nu nog niet bestellen.",
  developmentNotice:
    "Deze optie blijft alvast zichtbaar in de shop, maar is nog niet te bestellen. Zodra de digitale versie klaar is, kan hier direct een koopknop aan gekoppeld worden.",
} as const;

const BOOK_PRODUCT_TEXT_DEFAULTS = {
  introTitle: "Boekinformatie",
  introText:
    "Bekijk eerst de productinformatie in de app. Daarna kun je desgewenst doorklikken om het product via De Troostboom te kopen.",
  ...COMMON_PRODUCT_TEXT_DEFAULTS,
} as const;

const EBOOK_PRODUCT_TEXT_DEFAULTS = {
  introTitle: "E-bookinformatie",
  introText:
    "Bekijk eerst de productinformatie in de app. Daarna speel je het e-book vrij met boekcredits en lees je het veilig binnen de app.",
  descriptionTitle: "Inhoud",
  detailsTitle: "Leeservaring",
  purchaseTitle: "Vrijspelen in de app",
  purchaseDescription:
    "Dit e-book speel je direct in de app vrij met boekcredits. Daarna verschijnt het in je account onder EBooks.",
  purchaseButtonLabel: "Speel e-book vrij in app",
  developmentStateLabel: "In ontwikkeling",
  unavailablePriceLabel: "Nog niet beschikbaar",
  developmentCalloutLabel: "E-book nog niet gekoppeld",
  developmentPurchaseText:
    "Dit e-book is nog niet beschikbaar in de app. Zodra de koppeling live staat, kun je het hier direct vrijspelen.",
  developmentNotice:
    "Dit e-book staat alvast in de shop, maar is nog niet volledig gekoppeld aan de app-reader. Zodra de koppeling live is, kun je het direct in de app vrijspelen.",
} as const;

const GAME_PRODUCT_TEXT_DEFAULTS = {
  introTitle: "Spelinformatie",
  introText:
    "Bekijk eerst de productinformatie in de app. Daarna kun je desgewenst doorklikken om het product via De Troostboom te kopen.",
  ...COMMON_PRODUCT_TEXT_DEFAULTS,
} as const;

export const DEFAULT_SHOP_CATALOG_SETTINGS: ShopCatalogSettings = {
  books: [
    {
      id: "gekleurde-tranen",
      category: "boeken",
      title: "Gekleurde tranen",
      body:
        "<p>Gekleurde tranen bundelt creatieve opdrachten en werkvormen die helpen om rouw en verlies zichtbaar en bespreekbaar te maken.</p><p>Het boek biedt een rustige ingang voor gesprekken, reflectie en beeldend werken, zowel individueel als in begeleiding.</p>",
      imageUrl: "",
      imageAlt: "Boekcover Gekleurde tranen",
      ...BOOK_PRODUCT_TEXT_DEFAULTS,
      format: "Paperback",
      price: 29.95,
      description:
        "Paperback met creatieve opdrachten en handvatten om rouw en verlies bespreekbaar te maken.",
      details: [
        "Gericht op rouw, verlies en het verkennen van gevoelens via creatieve werkvormen.",
        "Geschikt voor thuis, begeleiding, coaching en therapeutische gesprekken.",
        "Aankoop en afhandeling verlopen via De Troostboom.",
      ],
      tag: "Paperback",
      href: "https://detroostboom.nl/product/gekleurde-tranen/",
      status: "live",
    },
    {
      id: "onzichtbaar-verdriet",
      category: "boeken",
      title: "Onzichtbaar verdriet",
      body:
        "<p>Onzichtbaar verdriet richt zich op vormen van verlies die vaak minder snel door de omgeving worden herkend.</p><p>Met toegankelijke werkvormen helpt het boek om taal en ruimte te geven aan verdriet dat moeilijk te benoemen is.</p>",
      imageUrl: "",
      imageAlt: "Boekcover Onzichtbaar verdriet",
      ...BOOK_PRODUCT_TEXT_DEFAULTS,
      format: "Paperback",
      price: 29.95,
      description:
        "Paperback voor verlies bij leven en andere vormen van verdriet die vaak minder zichtbaar blijven.",
      details: [
        "Richt zich op verlieservaringen die niet altijd direct door de omgeving worden gezien.",
        "Helpt taal en vorm te geven aan verdriet dat moeilijk bespreekbaar is.",
        "Aankoop en afhandeling verlopen via De Troostboom.",
      ],
      tag: "Paperback",
      href: "https://detroostboom.nl/product/onzichtbaar-verdriet/",
      status: "live",
    },
    {
      id: "liefdevol-koesteren",
      category: "boeken",
      title: "Liefdevol koesteren",
      body:
        "<p>Liefdevol koesteren ondersteunt bij het bewaren van herinneringen en het vormgeven van wat waardevol blijft na verlies.</p><p>Het boek combineert creatieve oefeningen met troostrijke reflectie en praktische toepasbaarheid.</p>",
      imageUrl: "",
      imageAlt: "Boekcover Liefdevol koesteren",
      ...BOOK_PRODUCT_TEXT_DEFAULTS,
      format: "Paperback",
      price: 29.95,
      description:
        "Paperback met creatieve oefeningen rond verlies, troost en het vasthouden van betekenisvolle herinneringen.",
      details: [
        "Ondersteunt bij het bewaren en vormgeven van dierbare herinneringen.",
        "Inzetbaar als rustig werkboek binnen rouwbegeleiding of persoonlijk gebruik.",
        "Aankoop en afhandeling verlopen via De Troostboom.",
      ],
      tag: "Paperback",
      href: "https://detroostboom.nl/product/liefdevol-koesteren-2/",
      status: "live",
    },
  ],
  ebooks: [],
  games: [
    {
      id: "memospel-vergeet-niet-me-verdrietjes",
      category: "spellen",
      title: "Vergeet-niet-me-verdrietjes",
      body:
        "<p>Dit memospel maakt het makkelijker om spelenderwijs stil te staan bij emoties, herinneringen en contact rond verlies.</p><p>Door de laagdrempelige spelvorm ontstaat ruimte voor herkenning, gesprek en gezamenlijke aandacht.</p>",
      imageUrl: "",
      imageAlt: "Verpakking Vergeet-niet-me-verdrietjes",
      ...GAME_PRODUCT_TEXT_DEFAULTS,
      format: "Memospel",
      price: 29.95,
      description:
        "Memospel om spelenderwijs stil te staan bij emoties, herinneringen en contact rond verlies.",
      details: [
        "Spelvorm die uitnodigt tot herkennen, benoemen en delen van gevoelens.",
        "Laagdrempelig inzetbaar in gezinnen, begeleiding en therapeutische setting.",
        "Aankoop en afhandeling verlopen via De Troostboom.",
      ],
      tag: "Memospel",
      href: "https://detroostboom.nl/product/memospel-vergeet-niet-me-verdrietjes/",
      status: "live",
    },
    {
      id: "kwartetspel-niet-hier-wel-dichtbij",
      category: "spellen",
      title: "Niet hier, wel dichtbij",
      body:
        "<p>Niet hier, wel dichtbij is een kwartetspel dat uitnodigt tot gesprek over gemis, verbondenheid en herinneren.</p><p>Het spel is geschikt voor thuis, in groepen of als werkvorm binnen begeleiding en therapie.</p>",
      imageUrl: "",
      imageAlt: "Verpakking Niet hier, wel dichtbij",
      ...GAME_PRODUCT_TEXT_DEFAULTS,
      format: "Kwartetspel",
      price: 54.95,
      description:
        "Kwartetspel als laagdrempelige ingang voor gesprek, herinneren en samen stilstaan bij gemis.",
      details: [
        "Stimuleert gesprek en ontmoeting rond gemis, herinnering en verbondenheid.",
        "Geschikt voor samen spelen in gezinnen, klas, groep of begeleiding.",
        "Aankoop en afhandeling verlopen via De Troostboom.",
      ],
      tag: "Kwartetspel",
      href: "https://detroostboom.nl/product/kwartetspel-niet-hier-wel-dichtbij/",
      status: "live",
    },
    {
      id: "digitale-werkset",
      category: "spellen",
      title: "Digitale werkset",
      body:
        "<p>De digitale werkset is bedoeld als flexibele aanvulling voor online begeleiding en situaties waarin snel digitaal materiaal nodig is.</p><p>Deze optie wordt nog verder ontwikkeld en is daarom nog niet beschikbaar als product.</p>",
      imageUrl: "",
      imageAlt: "Preview Digitale werkset",
      ...GAME_PRODUCT_TEXT_DEFAULTS,
      format: "Download",
      price: 24.95,
      description:
        "Digitale spel- en werkvormen voor print of schermgebruik, handig voor online begeleiding en snelle inzet in sessies.",
      details: [
        "Bedoeld als digitale aanvulling voor online begeleiding en flexibel gebruik.",
        "Kan later als download of printbare set beschikbaar worden gemaakt.",
        "Deze optie is op dit moment nog in ontwikkeling.",
      ],
      tag: "Download",
      href: "",
      status: "in_development",
    },
  ],
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const strings = value.filter((entry): entry is string => typeof entry === "string");
  return strings.length ? strings : fallback;
}

function normalizeCatalogStatus(value: unknown, fallback: CatalogStatus): CatalogStatus {
  return value === "concept" || value === "in_development" || value === "live"
    ? value
    : fallback;
}

function normalizeCatalogCategory(
  value: unknown,
  fallback: CatalogCategory
): CatalogCategory {
  return value === "boeken" || value === "ebooks" || value === "spellen"
    ? value
    : fallback;
}

function normalizeCatalogItem(
  value: unknown,
  fallback: CatalogItem
): CatalogItem {
  const item = asObject(value);

  return {
    id: asString(item?.id, fallback.id),
    category: normalizeCatalogCategory(item?.category, fallback.category),
    title: asString(item?.title, fallback.title),
    body: typeof item?.body === "string" ? item.body : fallback.body,
    imageUrl: asString(item?.imageUrl, fallback.imageUrl || ""),
    imageAlt: asString(item?.imageAlt, fallback.imageAlt || ""),
    introTitle: asString(item?.introTitle, fallback.introTitle),
    introText: asString(item?.introText, fallback.introText),
    descriptionTitle: asString(
      item?.descriptionTitle,
      fallback.descriptionTitle
    ),
    detailsTitle: asString(item?.detailsTitle, fallback.detailsTitle),
    purchaseTitle: asString(item?.purchaseTitle, fallback.purchaseTitle),
    purchaseDescription: asString(
      item?.purchaseDescription,
      fallback.purchaseDescription
    ),
    purchaseButtonLabel: asString(
      item?.purchaseButtonLabel,
      fallback.purchaseButtonLabel
    ),
    developmentStateLabel: asString(
      item?.developmentStateLabel,
      fallback.developmentStateLabel
    ),
    unavailablePriceLabel: asString(
      item?.unavailablePriceLabel,
      fallback.unavailablePriceLabel
    ),
    developmentCalloutLabel: asString(
      item?.developmentCalloutLabel,
      fallback.developmentCalloutLabel
    ),
    developmentPurchaseText: asString(
      item?.developmentPurchaseText,
      fallback.developmentPurchaseText
    ),
    developmentNotice: asString(
      item?.developmentNotice,
      fallback.developmentNotice
    ),
    format: asString(item?.format, fallback.format),
    price: asNumber(item?.price, fallback.price),
    description: asString(item?.description, fallback.description),
    details: asStringArray(item?.details, fallback.details),
    tag: asString(item?.tag, fallback.tag),
    href: asString(item?.href, fallback.href || ""),
    contentSlug: asString(item?.contentSlug, fallback.contentSlug || ""),
    epubUrl: asString(item?.epubUrl, fallback.epubUrl || ""),
    status: normalizeCatalogStatus(item?.status, fallback.status || "concept"),
  };
}

function createEmptyCatalogItem(
  category: CatalogCategory,
  id: string
): CatalogItem {
  if (category === "boeken") {
    return {
      id,
      category,
      title: "Nieuw boek",
      body: "<p>Voeg hier de beschrijving van het boek toe.</p>",
      imageUrl: "",
      imageAlt: "",
      ...BOOK_PRODUCT_TEXT_DEFAULTS,
      format: "Paperback",
      price: 0,
      description: "Korte omschrijving van dit boek.",
      details: [
        "Voeg hier productdetails toe.",
        "Gebruik dit blok voor doelgroep, formaat en praktische informatie.",
      ],
      tag: "Boek",
      href: "",
      contentSlug: "",
      epubUrl: "",
      status: "concept",
    };
  }

  if (category === "ebooks") {
    return {
      id,
      category,
      title: "Nieuw e-book",
      body: "<p>Voeg hier de beschrijving van het e-book toe.</p>",
      imageUrl: "",
      imageAlt: "",
      ...EBOOK_PRODUCT_TEXT_DEFAULTS,
      format: "E-book",
      price: 0,
      description: "Korte omschrijving van dit e-book.",
      details: [
        "Na aankoop lees je dit e-book veilig in de app.",
        "Koppel hier dezelfde slug als het gepubliceerde e-book in content.",
      ],
      tag: "E-book",
      href: "",
      contentSlug: "",
      epubUrl: "",
      status: "concept",
    };
  }

  return {
    id,
    category,
    title: "Nieuw spel",
    body: "<p>Voeg hier de beschrijving van het spel toe.</p>",
    imageUrl: "",
    imageAlt: "",
    ...GAME_PRODUCT_TEXT_DEFAULTS,
    format: "Spel",
    price: 0,
    description: "Korte omschrijving van dit spel.",
    details: [
      "Voeg hier productdetails toe.",
      "Gebruik dit blok voor doelgroep, spelvorm en praktische informatie.",
    ],
    tag: "Spel",
    href: "",
    contentSlug: "",
    epubUrl: "",
    status: "concept",
  };
}

function normalizeCatalogArray(
  value: unknown,
  fallback: CatalogItem[],
  category: CatalogCategory
): CatalogItem[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const fallbackById = new Map(fallback.map((item) => [item.id, item]));

  return value.map((entry, index) => {
    const candidate = asObject(entry);
    const candidateId =
      typeof candidate?.id === "string" && candidate.id.trim()
        ? candidate.id.trim()
        : `${category}-${index + 1}`;
    const fallbackItem =
      fallbackById.get(candidateId) ?? createEmptyCatalogItem(category, candidateId);
    return normalizeCatalogItem(
      { ...candidate, id: candidateId, category },
      fallbackItem
    );
  });
}

export function normalizeShopCatalogSettings(value: unknown): ShopCatalogSettings {
  const settings = asObject(value);

  return {
    books: normalizeCatalogArray(
      settings?.books,
      DEFAULT_SHOP_CATALOG_SETTINGS.books,
      "boeken"
    ),
    ebooks: normalizeCatalogArray(
      settings?.ebooks,
      DEFAULT_SHOP_CATALOG_SETTINGS.ebooks,
      "ebooks"
    ),
    games: normalizeCatalogArray(
      settings?.games,
      DEFAULT_SHOP_CATALOG_SETTINGS.games,
      "spellen"
    ),
  };
}

export function getCatalogItemsByCategory(
  catalog: ShopCatalogSettings,
  category: CatalogCategory
) {
  if (category === "boeken") return catalog.books;
  if (category === "ebooks") return catalog.ebooks;
  return catalog.games;
}

export function isCatalogItemPublic(item: CatalogItem) {
  return item.status !== "concept";
}

export function getPublicCatalogItemsByCategory(
  catalog: ShopCatalogSettings,
  category: CatalogCategory
) {
  return getCatalogItemsByCategory(catalog, category).filter(isCatalogItemPublic);
}

export function getCatalogItem(
  catalog: ShopCatalogSettings,
  category: CatalogCategory,
  slug: string
) {
  return getCatalogItemsByCategory(catalog, category).find((item) => item.id === slug) ?? null;
}

export function getPublicCatalogItem(
  catalog: ShopCatalogSettings,
  category: CatalogCategory,
  slug: string
) {
  return (
    getPublicCatalogItemsByCategory(catalog, category).find(
      (item) => item.id === slug
    ) ?? null
  );
}

export function getAllCatalogItems(catalog: ShopCatalogSettings) {
  return [...catalog.books, ...catalog.ebooks, ...catalog.games];
}

export function getCatalogItemById(
  catalog: ShopCatalogSettings,
  itemId: string
) {
  return getAllCatalogItems(catalog).find((item) => item.id === itemId) ?? null;
}

export function replaceCatalogItem(
  catalog: ShopCatalogSettings,
  itemId: string,
  nextItem: CatalogItem
): ShopCatalogSettings {
  return {
    books: catalog.books.map((item) => (item.id === itemId ? nextItem : item)),
    ebooks: catalog.ebooks.map((item) => (item.id === itemId ? nextItem : item)),
    games: catalog.games.map((item) => (item.id === itemId ? nextItem : item)),
  };
}

export function createCatalogItem(category: CatalogCategory, id: string) {
  return createEmptyCatalogItem(category, id);
}

export function addCatalogItem(
  catalog: ShopCatalogSettings,
  item: CatalogItem
): ShopCatalogSettings {
  if (item.category === "boeken") {
    return { ...catalog, books: [...catalog.books, item] };
  }
  if (item.category === "ebooks") {
    return { ...catalog, ebooks: [...catalog.ebooks, item] };
  }
  return { ...catalog, games: [...catalog.games, item] };
}

export function removeCatalogItem(
  catalog: ShopCatalogSettings,
  itemId: string
): ShopCatalogSettings {
  return {
    books: catalog.books.filter((item) => item.id !== itemId),
    ebooks: catalog.ebooks.filter((item) => item.id !== itemId),
    games: catalog.games.filter((item) => item.id !== itemId),
  };
}

export function getCatalogItemPath(item: CatalogItem) {
  return `/shop/${item.category}/${item.id}`;
}

export function isCatalogItemInDevelopment(item: CatalogItem) {
  return item.status === "in_development";
}

export function getCatalogStatusLabel(status?: CatalogStatus) {
  if (status === "concept") return "Concept";
  if (status === "in_development") return "In ontwikkeling";
  return "Live";
}
