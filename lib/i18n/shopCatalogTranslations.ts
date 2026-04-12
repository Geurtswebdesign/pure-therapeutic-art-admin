import type { UiLanguage } from "@/lib/i18n/runtime";
import { resolveBaseUiLanguage } from "@/lib/i18n/runtime";
import type { CatalogItem, ShopCatalogSettings } from "@/lib/shop/catalog";

type CatalogItemTranslation = Partial<
  Pick<
    CatalogItem,
    | "body"
    | "description"
    | "details"
    | "imageAlt"
    | "introTitle"
    | "introText"
    | "descriptionTitle"
    | "detailsTitle"
    | "purchaseTitle"
    | "purchaseDescription"
    | "purchaseButtonLabel"
    | "developmentStateLabel"
    | "unavailablePriceLabel"
    | "developmentCalloutLabel"
    | "developmentPurchaseText"
    | "developmentNotice"
    | "format"
    | "tag"
  >
>;

const EN_SCALARS: Record<string, string> = {
  Beschrijving: "Description",
  "Meer informatie": "More information",
  Bestellen: "Order",
  "Kopen via De Troostboom": "Buy via De Troostboom",
  "In ontwikkeling": "In development",
  "Nog niet beschikbaar": "Not available yet",
  "Deze optie is in ontwikkeling": "This option is in development",
  Boekinformatie: "Book information",
  "E-bookinformatie": "Ebook information",
  Inhoud: "Content",
  Leeservaring: "Reading experience",
  Kopen: "Buy",
  Spelinformatie: "Game information",
  Paperback: "Paperback",
  Download: "Download",
  "E-book": "Ebook",
  Boek: "Book",
  Spel: "Game",
  Memospel: "Memory game",
  Kwartetspel: "Quartet card game",
  "Bekijk eerst de productinformatie in de app. Daarna kun je desgewenst doorklikken om het product via De Troostboom te kopen.":
    "First view the product information in the app. After that, you can continue to the product page on De Troostboom if you want to buy it there.",
  "Wanneer je doorgaat, open je de productpagina van De Troostboom om het product daar verder te bekijken en te kopen.":
    "When you continue, the product page on De Troostboom will open so you can review and buy the product there.",
  "Deze digitale optie is nog niet live. Je kunt hem nu nog niet bestellen.":
    "This digital option is not live yet. You cannot order it yet.",
  "Deze optie blijft alvast zichtbaar in de shop, maar is nog niet te bestellen. Zodra de digitale versie klaar is, kan hier direct een koopknop aan gekoppeld worden.":
    "This option remains visible in the shop for now, but it cannot be ordered yet. As soon as the digital version is ready, a buy button can be connected here directly.",
  "Bekijk eerst de productinformatie in de app. Daarna koop je het e-book in de app en lees je het veilig binnen je account.":
    "First view the product information in the app. After that, you buy the ebook in the app and read it safely inside your account.",
  "Na succesvolle aankoop verschijnt dit e-book automatisch in je account onder EBooks en lees je het alleen binnen de app-reader.":
    "After a successful purchase, this ebook appears automatically in your account under EBooks and can only be read inside the app reader.",
  "Koop e-book in app": "Buy ebook in app",
  "E-book nog niet live": "Ebook not live yet",
  "Dit e-book is nog niet live. Zodra het EPUB-bestand en de in-app betaalstap klaarstaan, kun je het hier kopen.":
    "This ebook is not live yet. As soon as the EPUB file and in-app payment step are ready, you can buy it here.",
  "Dit e-book staat alvast in de shop, maar is nog niet helemaal gereed voor aankoop en lezen in de app.":
    "This ebook is already visible in the shop, but it is not fully ready for purchase and reading in the app yet.",
};

const DE_SCALARS: Record<string, string> = {
  Beschrijving: "Beschreibung",
  "Meer informatie": "Mehr Informationen",
  Bestellen: "Bestellen",
  "Kopen via De Troostboom": "Uber De Troostboom kaufen",
  "In ontwikkeling": "In Entwicklung",
  "Nog niet beschikbaar": "Noch nicht verfugbar",
  "Deze optie is in ontwikkeling": "Diese Option ist in Entwicklung",
  Boekinformatie: "Buchinformationen",
  "E-bookinformatie": "E-Book-Informationen",
  Inhoud: "Inhalt",
  Leeservaring: "Leseerlebnis",
  Kopen: "Kaufen",
  Spelinformatie: "Spielinformationen",
  Paperback: "Paperback",
  Download: "Download",
  "E-book": "E-Book",
  Boek: "Buch",
  Spel: "Spiel",
  Memospel: "Memospiel",
  Kwartetspel: "Quartettspiel",
  "Bekijk eerst de productinformatie in de app. Daarna kun je desgewenst doorklikken om het product via De Troostboom te kopen.":
    "Sieh dir zuerst die Produktinformationen in der App an. Danach kannst du auf Wunsch zur Produktseite bei De Troostboom weitergehen, um dort zu kaufen.",
  "Wanneer je doorgaat, open je de productpagina van De Troostboom om het product daar verder te bekijken en te kopen.":
    "Wenn du fortfahrst, offnet sich die Produktseite von De Troostboom, damit du das Produkt dort ansehen und kaufen kannst.",
  "Deze digitale optie is nog niet live. Je kunt hem nu nog niet bestellen.":
    "Diese digitale Option ist noch nicht live. Du kannst sie jetzt noch nicht bestellen.",
  "Deze optie blijft alvast zichtbaar in de shop, maar is nog niet te bestellen. Zodra de digitale versie klaar is, kan hier direct een koopknop aan gekoppeld worden.":
    "Diese Option bleibt vorerst im Shop sichtbar, ist aber noch nicht bestellbar. Sobald die digitale Version fertig ist, kann hier direkt ein Kaufbutton verknupft werden.",
  "Bekijk eerst de productinformatie in de app. Daarna koop je het e-book in de app en lees je het veilig binnen je account.":
    "Sieh dir zuerst die Produktinformationen in der App an. Danach kaufst du das E-Book in der App und liest es sicher in deinem Konto.",
  "Na succesvolle aankoop verschijnt dit e-book automatisch in je account onder EBooks en lees je het alleen binnen de app-reader.":
    "Nach einem erfolgreichen Kauf erscheint dieses E-Book automatisch in deinem Konto unter EBooks und kann nur im App-Reader gelesen werden.",
  "Koop e-book in app": "E-Book in App kaufen",
  "E-book nog niet live": "E-Book noch nicht live",
  "Dit e-book is nog niet live. Zodra het EPUB-bestand en de in-app betaalstap klaarstaan, kun je het hier kopen.":
    "Dieses E-Book ist noch nicht live. Sobald die EPUB-Datei und der In-App-Bezahlschritt bereitstehen, kannst du es hier kaufen.",
  "Dit e-book staat alvast in de shop, maar is nog niet helemaal gereed voor aankoop en lezen in de app.":
    "Dieses E-Book ist bereits im Shop sichtbar, aber noch nicht vollstandig fur Kauf und Lesen in der App bereit.",
};

const EN_ITEM_TRANSLATIONS: Record<string, CatalogItemTranslation> = {
  "gekleurde-tranen": {
    body:
      "<p>Gekleurde tranen brings together creative assignments and methods that help make grief and loss visible and discussable.</p><p>The book offers a calm entry point for conversations, reflection and visual work, both individually and in guidance.</p>",
    imageAlt: "Book cover Gekleurde tranen",
    description:
      "Paperback with creative assignments and guidance to make grief and loss discussable.",
    details: [
      "Focused on grief, loss and exploring emotions through creative exercises.",
      "Suitable for home use, guidance, coaching and therapeutic conversations.",
      "Purchase and fulfillment take place via De Troostboom.",
    ],
  },
  "onzichtbaar-verdriet": {
    body:
      "<p>Onzichtbaar verdriet focuses on forms of loss that are often less quickly recognized by the people around you.</p><p>With accessible exercises, the book helps give language and space to grief that is difficult to name.</p>",
    imageAlt: "Book cover Onzichtbaar verdriet",
    description:
      "Paperback for loss while living and other forms of grief that often remain less visible.",
    details: [
      "Focuses on experiences of loss that are not always immediately recognized by others.",
      "Helps give language and form to grief that is difficult to discuss.",
      "Purchase and fulfillment take place via De Troostboom.",
    ],
  },
  "liefdevol-koesteren": {
    body:
      "<p>Liefdevol koesteren supports preserving memories and shaping what remains valuable after loss.</p><p>The book combines creative exercises with comforting reflection and practical usability.</p>",
    imageAlt: "Book cover Liefdevol koesteren",
    description:
      "Paperback with creative exercises around loss, comfort and holding on to meaningful memories.",
    details: [
      "Supports preserving and shaping cherished memories.",
      "Can be used as a calm workbook in grief guidance or personal use.",
      "Purchase and fulfillment take place via De Troostboom.",
    ],
  },
  "memospel-vergeet-niet-me-verdrietjes": {
    body:
      "<p>This memory game makes it easier to pause playfully with emotions, memories and connection around loss.</p><p>The approachable game format creates space for recognition, conversation and shared attention.</p>",
    imageAlt: "Packaging Vergeet-niet-me-verdrietjes",
    description:
      "Memory game to pause playfully with emotions, memories and connection around loss.",
    details: [
      "Game format that invites recognizing, naming and sharing feelings.",
      "Easy to use in families, guidance and therapeutic settings.",
      "Purchase and fulfillment take place via De Troostboom.",
    ],
  },
  "kwartetspel-niet-hier-wel-dichtbij": {
    body:
      "<p>Niet hier, wel dichtbij is a quartet card game that invites conversation about absence, connection and remembering.</p><p>The game is suitable for home use, groups or as a method within guidance and therapy.</p>",
    imageAlt: "Packaging Niet hier, wel dichtbij",
    description:
      "Quartet card game as an approachable entry point for conversation, remembrance and shared reflection on absence.",
    details: [
      "Stimulates conversation and encounter around absence, memory and connection.",
      "Suitable for families, classes, groups or guidance sessions.",
      "Purchase and fulfillment take place via De Troostboom.",
    ],
  },
  "digitale-werkset": {
    body:
      "<p>The digital toolkit is intended as a flexible addition for online guidance and situations where digital material is needed quickly.</p><p>This option is still being further developed and is therefore not yet available as a product.</p>",
    imageAlt: "Preview digital toolkit",
    description:
      "Digital game and exercise formats for print or screen use, useful for online guidance and quick deployment in sessions.",
    details: [
      "Intended as a digital addition for online guidance and flexible use.",
      "Can later become available as a download or printable set.",
      "This option is currently still in development.",
    ],
  },
};

const DE_ITEM_TRANSLATIONS: Record<string, CatalogItemTranslation> = {
  "gekleurde-tranen": {
    body:
      "<p>Gekleurde tranen bundelt kreative Aufgaben und Arbeitsformen, die helfen, Trauer und Verlust sichtbar und besprechbar zu machen.</p><p>Das Buch bietet einen ruhigen Einstieg fur Gesprache, Reflexion und bildnerisches Arbeiten, sowohl individuell als auch in der Begleitung.</p>",
    imageAlt: "Buchcover Gekleurde tranen",
    description:
      "Paperback mit kreativen Aufgaben und Impulsen, um Trauer und Verlust besprechbar zu machen.",
    details: [
      "Fokussiert auf Trauer, Verlust und das Erkunden von Gefuhlen uber kreative Arbeitsformen.",
      "Geeignet fur zuhause, Begleitung, Coaching und therapeutische Gesprache.",
      "Kauf und Abwicklung erfolgen uber De Troostboom.",
    ],
  },
  "onzichtbaar-verdriet": {
    body:
      "<p>Onzichtbaar verdriet richtet sich auf Formen von Verlust, die von der Umgebung oft weniger schnell erkannt werden.</p><p>Mit zuganglichen Arbeitsformen hilft das Buch dabei, Trauer Sprache und Raum zu geben, wenn sie schwer zu benennen ist.</p>",
    imageAlt: "Buchcover Onzichtbaar verdriet",
    description:
      "Paperback fur Verluste wahrend des Lebens und andere Formen von Trauer, die oft weniger sichtbar bleiben.",
    details: [
      "Richtet sich auf Verlusterfahrungen, die von der Umgebung nicht immer sofort wahrgenommen werden.",
      "Hilft, Trauer Sprache und Form zu geben, wenn sie schwer besprechbar ist.",
      "Kauf und Abwicklung erfolgen uber De Troostboom.",
    ],
  },
  "liefdevol-koesteren": {
    body:
      "<p>Liefdevol koesteren unterstutzt beim Bewahren von Erinnerungen und beim Gestalten dessen, was nach einem Verlust wertvoll bleibt.</p><p>Das Buch verbindet kreative Ubungen mit trostlicher Reflexion und praktischer Anwendbarkeit.</p>",
    imageAlt: "Buchcover Liefdevol koesteren",
    description:
      "Paperback mit kreativen Ubungen rund um Verlust, Trost und das Bewahren bedeutungsvoller Erinnerungen.",
    details: [
      "Unterstutzt beim Bewahren und Gestalten kostbarer Erinnerungen.",
      "Einsetzbar als ruhiges Arbeitsbuch in der Trauerbegleitung oder fur den eigenen Gebrauch.",
      "Kauf und Abwicklung erfolgen uber De Troostboom.",
    ],
  },
  "memospel-vergeet-niet-me-verdrietjes": {
    body:
      "<p>Dieses Memospiel macht es leichter, sich spielerisch mit Emotionen, Erinnerungen und Verbindung rund um Verlust zu beschaftigen.</p><p>Durch die niedrigschwellige Spielform entsteht Raum fur Wiedererkennen, Gesprach und gemeinsame Aufmerksamkeit.</p>",
    imageAlt: "Verpackung Vergeet-niet-me-verdrietjes",
    description:
      "Memospiel, um spielerisch bei Emotionen, Erinnerungen und Verbindung rund um Verlust innezuhalten.",
    details: [
      "Spielform, die dazu einladt, Gefuhle zu erkennen, zu benennen und zu teilen.",
      "Niedrigschwellig einsetzbar in Familien, Begleitung und therapeutischen Settings.",
      "Kauf und Abwicklung erfolgen uber De Troostboom.",
    ],
  },
  "kwartetspel-niet-hier-wel-dichtbij": {
    body:
      "<p>Nicht hier, doch nah ist ein Quartettspiel, das zu Gesprachen uber Vermissen, Verbundenheit und Erinnern einladt.</p><p>Das Spiel eignet sich fur zuhause, in Gruppen oder als Arbeitsform in Begleitung und Therapie.</p>",
    imageAlt: "Verpackung Niet hier, wel dichtbij",
    description:
      "Quartettspiel als niedrigschwelliger Einstieg fur Gesprach, Erinnern und gemeinsames Innehalten bei Vermissen.",
    details: [
      "Fordert Gesprach und Begegnung rund um Vermissen, Erinnerung und Verbundenheit.",
      "Geeignet fur Familien, Klassen, Gruppen oder Begleitung.",
      "Kauf und Abwicklung erfolgen uber De Troostboom.",
    ],
  },
  "digitale-werkset": {
    body:
      "<p>Das digitale Arbeitspaket ist als flexible Erganzung fur Online-Begleitung und Situationen gedacht, in denen schnell digitales Material benotigt wird.</p><p>Diese Option wird noch weiterentwickelt und ist deshalb noch nicht als Produkt verfugbar.</p>",
    imageAlt: "Vorschau digitales Arbeitspaket",
    description:
      "Digitale Spiel- und Arbeitsformen fur Druck oder Bildschirm, praktisch fur Online-Begleitung und den schnellen Einsatz in Sitzungen.",
    details: [
      "Gedacht als digitale Erganzung fur Online-Begleitung und flexible Nutzung.",
      "Kann spater als Download oder druckbares Set verfugbar werden.",
      "Diese Option befindet sich aktuell noch in Entwicklung.",
    ],
  },
};

function translateScalar(value: string, language: UiLanguage) {
  const baseLanguage = resolveBaseUiLanguage(language);
  if (baseLanguage === "en") {
    return EN_SCALARS[value] ?? value;
  }
  if (baseLanguage === "de") {
    return DE_SCALARS[value] ?? value;
  }
  return value;
}

function getItemTranslation(itemId: string, language: UiLanguage) {
  const baseLanguage = resolveBaseUiLanguage(language);
  if (baseLanguage === "en") {
    return EN_ITEM_TRANSLATIONS[itemId] ?? null;
  }
  if (baseLanguage === "de") {
    return DE_ITEM_TRANSLATIONS[itemId] ?? null;
  }
  return null;
}

export function translateCatalogItem(
  item: CatalogItem,
  language: UiLanguage
): CatalogItem {
  const baseLanguage = resolveBaseUiLanguage(language);
  if (baseLanguage === "nl") {
    return item;
  }

  const translation = getItemTranslation(item.id, language);

  return {
    ...item,
    imageAlt: translation?.imageAlt ?? translateScalar(item.imageAlt || "", language),
    introTitle: translation?.introTitle ?? translateScalar(item.introTitle, language),
    introText: translation?.introText ?? translateScalar(item.introText, language),
    descriptionTitle:
      translation?.descriptionTitle ??
      translateScalar(item.descriptionTitle, language),
    detailsTitle:
      translation?.detailsTitle ?? translateScalar(item.detailsTitle, language),
    purchaseTitle:
      translation?.purchaseTitle ?? translateScalar(item.purchaseTitle, language),
    purchaseDescription:
      translation?.purchaseDescription ??
      translateScalar(item.purchaseDescription, language),
    purchaseButtonLabel:
      translation?.purchaseButtonLabel ??
      translateScalar(item.purchaseButtonLabel, language),
    developmentStateLabel:
      translation?.developmentStateLabel ??
      translateScalar(item.developmentStateLabel, language),
    unavailablePriceLabel:
      translation?.unavailablePriceLabel ??
      translateScalar(item.unavailablePriceLabel, language),
    developmentCalloutLabel:
      translation?.developmentCalloutLabel ??
      translateScalar(item.developmentCalloutLabel, language),
    developmentPurchaseText:
      translation?.developmentPurchaseText ??
      translateScalar(item.developmentPurchaseText, language),
    developmentNotice:
      translation?.developmentNotice ??
      translateScalar(item.developmentNotice, language),
    format: translation?.format ?? translateScalar(item.format, language),
    description:
      translation?.description ?? translateScalar(item.description, language),
    details:
      translation?.details ??
      item.details.map((detail) => translateScalar(detail, language)),
    tag: translation?.tag ?? translateScalar(item.tag, language),
    body: translation?.body ?? item.body,
  };
}

export function translateShopCatalogSettings(
  catalog: ShopCatalogSettings,
  language: UiLanguage
): ShopCatalogSettings {
  const baseLanguage = resolveBaseUiLanguage(language);
  if (baseLanguage === "nl") {
    return catalog;
  }

  return {
    books: catalog.books.map((item) => translateCatalogItem(item, language)),
    ebooks: catalog.ebooks.map((item) => translateCatalogItem(item, language)),
    games: catalog.games.map((item) => translateCatalogItem(item, language)),
  };
}
