export type CatalogCategory = "boeken" | "spellen";
export type CatalogStatus = "live" | "in_development";

export type CatalogItem = {
  id: string;
  category: CatalogCategory;
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  format: string;
  price: number;
  description: string;
  details: string[];
  tag: string;
  href?: string;
  status?: CatalogStatus;
  palette: "rain" | "hearts" | "moods" | "cards" | "board" | "digital";
};

export type ShopCatalogSettings = {
  books: CatalogItem[];
  games: CatalogItem[];
};

export const SHOP_CATALOG_SETTINGS_KEY = "shop_catalog";

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
      palette: "rain",
    },
    {
      id: "onzichtbaar-verdriet",
      category: "boeken",
      title: "Onzichtbaar verdriet",
      body:
        "<p>Onzichtbaar verdriet richt zich op vormen van verlies die vaak minder snel door de omgeving worden herkend.</p><p>Met toegankelijke werkvormen helpt het boek om taal en ruimte te geven aan verdriet dat moeilijk te benoemen is.</p>",
      imageUrl: "",
      imageAlt: "Boekcover Onzichtbaar verdriet",
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
      palette: "hearts",
    },
    {
      id: "liefdevol-koesteren",
      category: "boeken",
      title: "Liefdevol koesteren",
      body:
        "<p>Liefdevol koesteren ondersteunt bij het bewaren van herinneringen en het vormgeven van wat waardevol blijft na verlies.</p><p>Het boek combineert creatieve oefeningen met troostrijke reflectie en praktische toepasbaarheid.</p>",
      imageUrl: "",
      imageAlt: "Boekcover Liefdevol koesteren",
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
      palette: "moods",
    },
  ],
  games: [
    {
      id: "memospel-vergeet-niet-me-verdrietjes",
      category: "spellen",
      title: "Vergeet-niet-me-verdrietjes",
      body:
        "<p>Dit memospel maakt het makkelijker om spelenderwijs stil te staan bij emoties, herinneringen en contact rond verlies.</p><p>Door de laagdrempelige spelvorm ontstaat ruimte voor herkenning, gesprek en gezamenlijke aandacht.</p>",
      imageUrl: "",
      imageAlt: "Verpakking Vergeet-niet-me-verdrietjes",
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
      palette: "cards",
    },
    {
      id: "kwartetspel-niet-hier-wel-dichtbij",
      category: "spellen",
      title: "Niet hier, wel dichtbij",
      body:
        "<p>Niet hier, wel dichtbij is een kwartetspel dat uitnodigt tot gesprek over gemis, verbondenheid en herinneren.</p><p>Het spel is geschikt voor thuis, in groepen of als werkvorm binnen begeleiding en therapie.</p>",
      imageUrl: "",
      imageAlt: "Verpakking Niet hier, wel dichtbij",
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
      palette: "board",
    },
    {
      id: "digitale-werkset",
      category: "spellen",
      title: "Digitale werkset",
      body:
        "<p>De digitale werkset is bedoeld als flexibele aanvulling voor online begeleiding en situaties waarin snel digitaal materiaal nodig is.</p><p>Deze optie wordt nog verder ontwikkeld en is daarom nog niet beschikbaar als product.</p>",
      imageUrl: "",
      imageAlt: "Preview Digitale werkset",
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
      palette: "digital",
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
  return value === "in_development" || value === "live" ? value : fallback;
}

function normalizeCatalogCategory(
  value: unknown,
  fallback: CatalogCategory
): CatalogCategory {
  return value === "boeken" || value === "spellen" ? value : fallback;
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
    format: asString(item?.format, fallback.format),
    price: asNumber(item?.price, fallback.price),
    description: asString(item?.description, fallback.description),
    details: asStringArray(item?.details, fallback.details),
    tag: asString(item?.tag, fallback.tag),
    href: asString(item?.href, fallback.href || ""),
    status: normalizeCatalogStatus(item?.status, fallback.status || "live"),
    palette:
      item?.palette === "rain" ||
      item?.palette === "hearts" ||
      item?.palette === "moods" ||
      item?.palette === "cards" ||
      item?.palette === "board" ||
      item?.palette === "digital"
        ? item.palette
        : fallback.palette,
  };
}

function normalizeCatalogArray(
  value: unknown,
  fallback: CatalogItem[]
): CatalogItem[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return fallback.map((fallbackItem, index) => {
    const byId = value.find((entry) => asObject(entry)?.id === fallbackItem.id);
    const candidate = byId ?? value[index] ?? null;
    return normalizeCatalogItem(candidate, fallbackItem);
  });
}

export function normalizeShopCatalogSettings(value: unknown): ShopCatalogSettings {
  const settings = asObject(value);

  return {
    books: normalizeCatalogArray(settings?.books, DEFAULT_SHOP_CATALOG_SETTINGS.books),
    games: normalizeCatalogArray(settings?.games, DEFAULT_SHOP_CATALOG_SETTINGS.games),
  };
}

export function getCatalogItemsByCategory(
  catalog: ShopCatalogSettings,
  category: CatalogCategory
) {
  return category === "boeken" ? catalog.books : catalog.games;
}

export function getCatalogItem(
  catalog: ShopCatalogSettings,
  category: CatalogCategory,
  slug: string
) {
  return getCatalogItemsByCategory(catalog, category).find((item) => item.id === slug) ?? null;
}

export function getAllCatalogItems(catalog: ShopCatalogSettings) {
  return [...catalog.books, ...catalog.games];
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
    games: catalog.games.map((item) => (item.id === itemId ? nextItem : item)),
  };
}

export function getCatalogItemPath(item: CatalogItem) {
  return `/shop/${item.category}/${item.id}`;
}

export function isCatalogItemInDevelopment(item: CatalogItem) {
  return item.status === "in_development";
}
