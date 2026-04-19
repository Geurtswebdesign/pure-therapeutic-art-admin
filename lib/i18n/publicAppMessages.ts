import type { UiLanguage } from "@/lib/i18n/runtime";
import { resolveBaseUiLanguage } from "@/lib/i18n/runtime";

export type PublicAppMessages = {
  nav: {
    home: string;
    trainingen: string;
    shop: string;
    therapeuten: string;
    profiel: string;
  };
  home: {
    headerSubtitle: string;
    signedInTitle: string;
    signedInMotivation: string;
    userFallback: string;
    register: string;
    openCategory: string;
    categoryFallbackDescription: string;
    emptyState: string;
  };
  content: {
    seedFallbackDescription: string;
    regularFallbackDescription: string;
    chooseRegularCategory: string;
    chooseTheme: string;
    back: string;
    themesTitle: string;
    themesSubtitle: string;
    noThemes: string;
    noLevelContent: string;
    noSeedCategories: string;
  };
  themeIndex: {
    eyebrow: string;
    title: string;
    subtitle: string;
    empty: string;
  };
  themeCard: {
    themeLabel: string;
    childThemes: string;
    sections: string;
    items: string;
  };
  themePage: {
    back: string;
    subthemes: string;
    noItemsInSection: string;
    noSections: string;
  };
  article: {
    back: string;
    imageFallbackAlt: string;
    partOfTheme: string;
    previous: string;
    next: string;
    noPrevious: string;
    noNext: string;
  };
  pdfViewer: {
    back: string;
    openExternal: string;
    loading: string;
    loadError: string;
    fallbackPrefix: string;
    fallbackLink: string;
  };
  trainings: {
    title: string;
    subtitle: string;
    loadErrorTitle: string;
    loadErrorBody: string;
    emptyTitle: string;
    emptyBody: string;
    noDate: string;
    freePrice: string;
    startLabel: string;
    sessionSingular: string;
    sessionPlural: string;
    maxPrefix: string;
    bookNow: string;
    noBookingLink: string;
  };
  therapists: {
    title: string;
    searchLabel: string;
    searchPlaceholder: string;
    allCities: string;
    allSpecializations: string;
    allTargetGroups: string;
    allLanguages: string;
    allMethods: string;
    filter: string;
    reset: string;
    resultSingular: string;
    resultPlural: string;
    email: string;
    call: string;
    website: string;
    showMore: string;
    showLess: string;
    yearsExperienceSuffix: string;
  };
  shop: {
    assignmentCreditsTitle: string;
    assignmentCreditsDescription: string;
    assignmentCreditsListTitle: string;
    therapistSubscriptionTitle: string;
    therapistSubscriptionDescription: string;
    therapistSubscriptionDetailDescription: string;
    booksTitle: string;
    booksDescription: string;
    booksListTitle: string;
    ebooksTitle: string;
    ebooksDescription: string;
    ebooksListTitle: string;
    gamesTitle: string;
    gamesDescription: string;
    gamesListTitle: string;
    backToShop: string;
    backToCategoryPrefix: string;
    categoryEyebrow: string;
    bookCreditsTitle: string;
    bookCreditsDescription: string;
    bookCreditsListTitle: string;
    bookCreditsEmptyTitle: string;
    bookCreditsEmptyDescription: string;
    gameCreditsTitle: string;
    gameCreditsDescription: string;
    gameCreditsListTitle: string;
    gameCreditsEmptyTitle: string;
    gameCreditsEmptyDescription: string;
    referralCreditsTitle: string;
    referralCreditsDescription: string;
    referralCreditsListTitle: string;
    referralCreditsEmptyTitle: string;
    referralCreditsEmptyDescription: string;
  };
  shopCatalog: {
    viewAllOptions: string;
    noImageLinked: string;
    productMoreInfo: string;
    assignmentPack: string;
    mostChosen: string;
    bonusLabel: string;
    startPack: string;
    basicPack: string;
    plusPack: string;
    valuePack: string;
    yearSubscriptionBadge: string;
    yearSubscriptionShortTitle: string;
    yearSubscriptionAccessLabel: string;
    yearSubscriptionTitleFallback: string;
    yearSubscriptionDescription: string;
    therapistDirectory: string;
    profileVisible: string;
    therapistSubscriptionBadge: string;
    durationLabel: string;
    fullAccessLabel: string;
    monthSingular: string;
    monthPlural: string;
    therapistSubscriptionSupportText: string;
    noAssignmentPacksTitle: string;
    noAssignmentPacksDescription: string;
  };
  ebookPurchase: {
    disabledError: string;
    loginRequiredError: string;
    notFoundError: string;
    paymentConnectionMissingDescription: string;
    paymentConnectionMissingLabel: string;
    fallbackError: string;
  };
};

const nl: PublicAppMessages = {
  nav: {
    home: "Home",
    trainingen: "Trainingen",
    shop: "Shop",
    therapeuten: "Therapeuten",
    profiel: "Profiel",
  },
  home: {
    headerSubtitle: "Rust, groei en troost",
    signedInTitle: "Welkom terug",
    signedInMotivation:
      "Mooi dat je er bent. Pak een moment voor jezelf en zet vandaag een kleine stap.",
    userFallback: "Gebruiker",
    register: "Aanmelden",
    openCategory: "Open categorie",
    categoryFallbackDescription:
      "Verken thema's en oefeningen binnen deze categorie.",
    emptyState: "Nog geen content beschikbaar.",
  },
  content: {
    seedFallbackDescription:
      "Verken de gewone categorieen binnen dit domein.",
    regularFallbackDescription:
      "Verken thema's en oefeningen binnen deze categorie.",
    chooseRegularCategory:
      "Kies een gewone categorie binnen deze seed-categorie.",
    chooseTheme: "Kies een thema binnen deze categorie.",
    back: "Terug",
    themesTitle: "Thema's",
    themesSubtitle:
      "Kies een thema om de werkvormen in vaste volgorde te openen.",
    noThemes:
      "Er staan nog geen gepubliceerde thema's klaar binnen deze categorie.",
    noLevelContent: "Er staat nog niets klaar binnen dit niveau.",
    noSeedCategories: "Er staan nog geen seed-categorieen klaar.",
  },
  themeIndex: {
    eyebrow: "Thema-overzicht",
    title: "Samengestelde routes",
    subtitle:
      "Hier ordenen we content niet alleen op categorie, maar op volgorde, nadruk en samenhang.",
    empty: "Er staan nog geen gepubliceerde themapagina's klaar.",
  },
  themeCard: {
    themeLabel: "Thema",
    childThemes: "subthema's",
    sections: "secties",
    items: "items",
  },
  themePage: {
    back: "Terug",
    subthemes: "Subthema's",
    noItemsInSection:
      "Aan deze sectie zijn nog geen gepubliceerde items gekoppeld.",
    noSections: "Dit thema heeft nog geen gepubliceerde secties.",
  },
  article: {
    back: "Terug",
    imageFallbackAlt: "Afbeelding",
    partOfTheme: "Onderdeel van thema",
    previous: "Vorige",
    next: "Volgende",
    noPrevious: "Geen vorig onderdeel",
    noNext: "Geen volgend onderdeel",
  },
  pdfViewer: {
    back: "Terug",
    openExternal: "Open in browser",
    loading: "PDF wordt geladen...",
    loadError: "PDF laden in de app is mislukt. Open het bestand in de browser.",
    fallbackPrefix: "Zie je geen PDF?",
    fallbackLink: "Open het bestand hier",
  },
  trainings: {
    title: "Pure Therapeutic ART trainingen",
    subtitle:
      "Bekijk alle aankomende trainingen en open direct het boekingsvenster.",
    loadErrorTitle: "Trainingen konden niet geladen worden",
    loadErrorBody:
      "Controleer of de Supabase function `wp-events` gedeployed is.",
    emptyTitle: "Nog geen trainingen gevonden",
    emptyBody:
      "Zodra er events in WordPress/Amelia staan, verschijnen ze hier.",
    noDate: "Nog geen datum",
    freePrice: "Gratis",
    startLabel: "Start",
    sessionSingular: "sessie",
    sessionPlural: "sessies",
    maxPrefix: "Max",
    bookNow: "Boek nu",
    noBookingLink: "Geen boekingslink",
  },
  therapists: {
    title: "Vind een therapeut",
    searchLabel: "Zoeken",
    searchPlaceholder: "Bijvoorbeeld rouw, trauma of beeldend",
    allCities: "Alle plaatsen",
    allSpecializations: "Alle beroepen",
    allTargetGroups: "Alle doelgroepen",
    allLanguages: "Alle talen",
    allMethods: "Alle methodieken",
    filter: "Filteren",
    reset: "Reset",
    resultSingular: "therapeut gevonden",
    resultPlural: "therapeuten gevonden",
    email: "E-mail",
    call: "Bel",
    website: "Website",
    showMore: "Meer info",
    showLess: "Minder info",
    yearsExperienceSuffix: "jaar ervaring",
  },
  shop: {
    assignmentCreditsTitle: "Opdrachtcredits",
    assignmentCreditsDescription:
      "Hier tonen we de actieve opdrachtpakketten en het jaarabonnement voor opdrachten. Daarmee speel je opdrachten vrij of krijg je een jaar lang volledige toegang.",
    assignmentCreditsListTitle: "Opdrachtopties",
    therapistSubscriptionTitle: "Therapeutenabonnement",
    therapistSubscriptionDescription:
      "Voor therapeuten met een gratis account die hun profiel zichtbaar willen maken in de therapeutenlijst. Zodra het abonnement actief is, kun je in je profiel kiezen om openbaar te worden.",
    therapistSubscriptionDetailDescription:
      "Met dit abonnement kun je je gratis therapeut-account uitbreiden zodat je profiel zichtbaar kan worden in de therapeutenlijst.",
    booksTitle: "Boeken",
    booksDescription:
      "Overzicht van de fysieke en visuele boeken binnen de shop. Gericht op therapie, coaching en thuisgebruik.",
    booksListTitle: "Alle boeken",
    ebooksTitle: "E-books",
    ebooksDescription:
      "Overzicht van de app-only e-books. Na aankoop verschijnen ze in je account onder EBooks en lees je ze in de beveiligde app-reader.",
    ebooksListTitle: "Alle e-books",
    gamesTitle: "Spellen",
    gamesDescription:
      "Overzicht van de spelmaterialen binnen de shop, inclusief digitale varianten die nog in ontwikkeling kunnen zijn.",
    gamesListTitle: "Alle spellen",
    backToShop: "Terug naar shop",
    backToCategoryPrefix: "Terug naar",
    categoryEyebrow: "Shop categorie",
    bookCreditsTitle: "Boekcredits",
    bookCreditsDescription:
      "Koop boekcredits om e-books direct in de app vrij te spelen en veilig te lezen in de reader.",
    bookCreditsListTitle: "Beschikbare boekcredits",
    bookCreditsEmptyTitle: "Nog geen boekcredits actief",
    bookCreditsEmptyDescription:
      "Activeer eerst een of meer boekcredit-pakketten in de administratie. Dan verschijnen ze automatisch hier.",
    gameCreditsTitle: "Spelcredits",
    gameCreditsDescription:
      "Koop spelcredits om digitale spellen of spelcontent binnen de app vrij te spelen.",
    gameCreditsListTitle: "Beschikbare spelcredits",
    gameCreditsEmptyTitle: "Nog geen spelcredits actief",
    gameCreditsEmptyDescription:
      "Activeer eerst een of meer spelcredit-pakketten in de administratie. Dan verschijnen ze automatisch hier.",
    referralCreditsTitle: "Verwijscredits",
    referralCreditsDescription:
      "Koop verwijscredits om beschermde verwijscontent binnen de app vrij te spelen.",
    referralCreditsListTitle: "Beschikbare verwijscredits",
    referralCreditsEmptyTitle: "Nog geen verwijscredits actief",
    referralCreditsEmptyDescription:
      "Activeer eerst een of meer verwijscredit-pakketten in de administratie. Dan verschijnen ze automatisch hier.",
  },
  shopCatalog: {
    viewAllOptions: "Bekijk alle opties",
    noImageLinked: "Geen afbeelding gekoppeld",
    productMoreInfo: "Meer info",
    assignmentPack: "Opdracht pakket",
    mostChosen: "Meest gekozen",
    bonusLabel: "bonus",
    startPack: "Start pakket",
    basicPack: "Basis pakket",
    plusPack: "Plus pakket",
    valuePack: "Voordeel pakket",
    yearSubscriptionBadge: "Abonnement",
    yearSubscriptionShortTitle: "12 maanden",
    yearSubscriptionAccessLabel: "Toegang tot alle opdrachten",
    yearSubscriptionTitleFallback: "Jaarabonnement",
    yearSubscriptionDescription:
      "12 maanden toegang tot alle opdrachten in de app. Tijdens een actief abonnement heb je geen losse opdrachtcredits nodig.",
    therapistDirectory: "Therapeutenlijst",
    profileVisible: "Profiel zichtbaar maken",
    therapistSubscriptionBadge: "Therapeutenabonnement",
    durationLabel: "Duur",
    fullAccessLabel: "Volledige toegang",
    monthSingular: "maand",
    monthPlural: "maanden",
    therapistSubscriptionSupportText:
      "Zodra het abonnement actief is, kun je in je account aangeven dat je profiel zichtbaar mag worden in de therapeutenlijst.",
    noAssignmentPacksTitle: "Nog geen opdrachtpakketten actief",
    noAssignmentPacksDescription:
      "Activeer eerst een of meer assignment credit packs of het jaarabonnement in de administratie. Dan verschijnen ze automatisch hier.",
  },
  ebookPurchase: {
    disabledError: "De in-app betaalkoppeling is nog niet actief.",
    loginRequiredError: "Log eerst in om een e-book te kopen.",
    notFoundError: "E-book niet gevonden.",
    paymentConnectionMissingDescription:
      "De in-app betaalstap voor e-books is nog niet gekoppeld. De aankoopregistratie en readerflow staan wel klaar.",
    paymentConnectionMissingLabel: "Betaalkoppeling ontbreekt",
    fallbackError: "Aankoop verwerken mislukt.",
  },
};

const en: PublicAppMessages = {
  nav: {
    home: "Home",
    trainingen: "Training",
    shop: "Shop",
    therapeuten: "Therapists",
    profiel: "Profile",
  },
  home: {
    headerSubtitle: "Rest, growth and comfort",
    signedInTitle: "Welcome back",
    signedInMotivation:
      "Glad you are here. Take a moment for yourself and make one small step today.",
    userFallback: "User",
    register: "Register",
    openCategory: "Open category",
    categoryFallbackDescription:
      "Explore themes and exercises within this category.",
    emptyState: "No content available yet.",
  },
  content: {
    seedFallbackDescription:
      "Explore the regular categories within this domain.",
    regularFallbackDescription:
      "Explore themes and exercises within this category.",
    chooseRegularCategory: "Choose a regular category within this seed category.",
    chooseTheme: "Choose a theme within this category.",
    back: "Back",
    themesTitle: "Themes",
    themesSubtitle:
      "Choose a theme to open the exercises in a fixed order.",
    noThemes: "No published themes are available in this category yet.",
    noLevelContent: "Nothing is available at this level yet.",
    noSeedCategories: "No seed categories are available yet.",
  },
  themeIndex: {
    eyebrow: "Theme overview",
    title: "Curated routes",
    subtitle:
      "Here we organize content not only by category, but also by order, emphasis and coherence.",
    empty: "No published theme pages are available yet.",
  },
  themeCard: {
    themeLabel: "Theme",
    childThemes: "subthemes",
    sections: "sections",
    items: "items",
  },
  themePage: {
    back: "Back",
    subthemes: "Subthemes",
    noItemsInSection: "No published items are linked to this section yet.",
    noSections: "This theme does not have any published sections yet.",
  },
  article: {
    back: "Back",
    imageFallbackAlt: "Image",
    partOfTheme: "Part of theme",
    previous: "Previous",
    next: "Next",
    noPrevious: "No previous item",
    noNext: "No next item",
  },
  pdfViewer: {
    back: "Back",
    openExternal: "Open in browser",
    loading: "Loading PDF...",
    loadError: "Loading the PDF inside the app failed. Open the file in the browser.",
    fallbackPrefix: "If the PDF does not appear,",
    fallbackLink: "open the file here",
  },
  trainings: {
    title: "Pure Therapeutic ART trainings",
    subtitle:
      "View all upcoming trainings and open the booking window right away.",
    loadErrorTitle: "Training sessions could not be loaded",
    loadErrorBody:
      "Check whether the Supabase function `wp-events` has been deployed.",
    emptyTitle: "No trainings found yet",
    emptyBody:
      "As soon as events exist in WordPress/Amelia, they will appear here.",
    noDate: "No date yet",
    freePrice: "Free",
    startLabel: "Start",
    sessionSingular: "session",
    sessionPlural: "sessions",
    maxPrefix: "Max",
    bookNow: "Book now",
    noBookingLink: "No booking link",
  },
  therapists: {
    title: "Find a therapist",
    searchLabel: "Search",
    searchPlaceholder: "For example grief, trauma or visual therapy",
    allCities: "All cities",
    allSpecializations: "All professions",
    allTargetGroups: "All target groups",
    allLanguages: "All languages",
    allMethods: "All methods",
    filter: "Filter",
    reset: "Reset",
    resultSingular: "therapist found",
    resultPlural: "therapists found",
    email: "Email",
    call: "Call",
    website: "Website",
    showMore: "More info",
    showLess: "Less info",
    yearsExperienceSuffix: "years experience",
  },
  shop: {
    assignmentCreditsTitle: "Assignment credits",
    assignmentCreditsDescription:
      "Here we show the active assignment packs and the yearly subscription for assignments. This lets you unlock assignments or get full access for one year.",
    assignmentCreditsListTitle: "Assignment options",
    therapistSubscriptionTitle: "Therapist subscription",
    therapistSubscriptionDescription:
      "For therapists with a free account who want to make their profile visible in the therapist directory. As soon as the subscription is active, you can choose in your profile to go public.",
    therapistSubscriptionDetailDescription:
      "With this subscription you can upgrade your free therapist account so your profile can become visible in the therapist directory.",
    booksTitle: "Books",
    booksDescription:
      "Overview of the physical and visual books in the shop. Intended for therapy, coaching and use at home.",
    booksListTitle: "All books",
    ebooksTitle: "E-books",
    ebooksDescription:
      "Overview of the app-only ebooks. After purchase they appear in your account under EBooks and you read them in the protected app reader.",
    ebooksListTitle: "All ebooks",
    gamesTitle: "Games",
    gamesDescription:
      "Overview of the game materials in the shop, including digital variants that may still be in development.",
    gamesListTitle: "All games",
    backToShop: "Back to shop",
    backToCategoryPrefix: "Back to",
    categoryEyebrow: "Shop category",
    bookCreditsTitle: "Book credits",
    bookCreditsDescription:
      "Buy book credits to unlock ebooks directly in the app and read them safely in the reader.",
    bookCreditsListTitle: "Available book credits",
    bookCreditsEmptyTitle: "No book credits are active yet",
    bookCreditsEmptyDescription:
      "First activate one or more book credit packs in the administration area. They will then appear here automatically.",
    gameCreditsTitle: "Game credits",
    gameCreditsDescription:
      "Buy game credits to unlock digital games or game content inside the app.",
    gameCreditsListTitle: "Available game credits",
    gameCreditsEmptyTitle: "No game credits are active yet",
    gameCreditsEmptyDescription:
      "First activate one or more game credit packs in the administration area. They will then appear here automatically.",
    referralCreditsTitle: "Referral credits",
    referralCreditsDescription:
      "Buy referral credits to unlock protected referral content inside the app.",
    referralCreditsListTitle: "Available referral credits",
    referralCreditsEmptyTitle: "No referral credits are active yet",
    referralCreditsEmptyDescription:
      "First activate one or more referral credit packs in the administration area. They will then appear here automatically.",
  },
  shopCatalog: {
    viewAllOptions: "View all options",
    noImageLinked: "No image linked",
    productMoreInfo: "More info",
    assignmentPack: "Assignment pack",
    mostChosen: "Most chosen",
    bonusLabel: "bonus",
    startPack: "Starter pack",
    basicPack: "Basic pack",
    plusPack: "Plus pack",
    valuePack: "Value pack",
    yearSubscriptionBadge: "Subscription",
    yearSubscriptionShortTitle: "12 months",
    yearSubscriptionAccessLabel: "Access to all assignments",
    yearSubscriptionTitleFallback: "Year subscription",
    yearSubscriptionDescription:
      "12 months of access to all assignments in the app. While the subscription is active, you do not need separate assignment credits.",
    therapistDirectory: "Therapist directory",
    profileVisible: "Make profile visible",
    therapistSubscriptionBadge: "Therapist subscription",
    durationLabel: "Duration",
    fullAccessLabel: "Full access",
    monthSingular: "month",
    monthPlural: "months",
    therapistSubscriptionSupportText:
      "As soon as the subscription is active, you can indicate in your account that your profile may be shown in the therapist directory.",
    noAssignmentPacksTitle: "No assignment packs are active yet",
    noAssignmentPacksDescription:
      "First activate one or more assignment credit packs or the yearly subscription in the administration area. They will then appear here automatically.",
  },
  ebookPurchase: {
    disabledError: "The in-app payment connection is not active yet.",
    loginRequiredError: "Log in first to buy an ebook.",
    notFoundError: "Ebook not found.",
    paymentConnectionMissingDescription:
      "The in-app payment step for ebooks is not connected yet. The purchase registration and reader flow are already in place.",
    paymentConnectionMissingLabel: "Payment connection missing",
    fallbackError: "Processing the purchase failed.",
  },
};

const de: PublicAppMessages = {
  nav: {
    home: "Start",
    trainingen: "Trainings",
    shop: "Shop",
    therapeuten: "Therapeuten",
    profiel: "Profil",
  },
  home: {
    headerSubtitle: "Ruhe, Wachstum und Trost",
    signedInTitle: "Willkommen zuruck",
    signedInMotivation:
      "Schon, dass du da bist. Nimm dir einen Moment fur dich und mache heute einen kleinen Schritt.",
    userFallback: "Benutzer",
    register: "Registrieren",
    openCategory: "Kategorie offnen",
    categoryFallbackDescription:
      "Entdecke Themen und Ubungen innerhalb dieser Kategorie.",
    emptyState: "Noch keine Inhalte verfugbar.",
  },
  content: {
    seedFallbackDescription:
      "Entdecke die regulare Kategorien innerhalb dieses Bereichs.",
    regularFallbackDescription:
      "Entdecke Themen und Ubungen innerhalb dieser Kategorie.",
    chooseRegularCategory:
      "Wahle eine regulare Kategorie innerhalb dieser Seed-Kategorie.",
    chooseTheme: "Wahle ein Thema innerhalb dieser Kategorie.",
    back: "Zuruck",
    themesTitle: "Themen",
    themesSubtitle:
      "Wahle ein Thema, um die Arbeitsformen in einer festen Reihenfolge zu offnen.",
    noThemes: "In dieser Kategorie sind noch keine veroffentlichten Themen verfugbar.",
    noLevelContent: "Auf dieser Ebene ist noch nichts verfugbar.",
    noSeedCategories: "Es sind noch keine Seed-Kategorien verfugbar.",
  },
  themeIndex: {
    eyebrow: "Themenubersicht",
    title: "Kuratiere Routen",
    subtitle:
      "Hier ordnen wir Inhalte nicht nur nach Kategorie, sondern auch nach Reihenfolge, Schwerpunkt und Zusammenhang.",
    empty: "Es sind noch keine veroffentlichten Themenseiten verfugbar.",
  },
  themeCard: {
    themeLabel: "Thema",
    childThemes: "Unterthemen",
    sections: "Abschnitte",
    items: "Elemente",
  },
  themePage: {
    back: "Zuruck",
    subthemes: "Unterthemen",
    noItemsInSection:
      "Diesem Abschnitt sind noch keine veroffentlichten Elemente zugeordnet.",
    noSections: "Dieses Thema hat noch keine veroffentlichten Abschnitte.",
  },
  article: {
    back: "Zuruck",
    imageFallbackAlt: "Bild",
    partOfTheme: "Teil des Themas",
    previous: "Vorherige",
    next: "Nachste",
    noPrevious: "Kein vorheriger Teil",
    noNext: "Kein nachster Teil",
  },
  pdfViewer: {
    back: "Zuruck",
    openExternal: "Im Browser offnen",
    loading: "PDF wird geladen...",
    loadError: "Die PDF konnte in der App nicht geladen werden. Offne die Datei im Browser.",
    fallbackPrefix: "Falls die PDF nicht erscheint,",
    fallbackLink: "offne die Datei hier",
  },
  trainings: {
    title: "Pure Therapeutic ART Trainings",
    subtitle:
      "Sieh dir alle kommenden Trainings an und offne direkt das Buchungsfenster.",
    loadErrorTitle: "Trainings konnten nicht geladen werden",
    loadErrorBody:
      "Prufe, ob die Supabase-Funktion `wp-events` deployed wurde.",
    emptyTitle: "Noch keine Trainings gefunden",
    emptyBody:
      "Sobald Events in WordPress/Amelia vorhanden sind, erscheinen sie hier.",
    noDate: "Noch kein Datum",
    freePrice: "Kostenlos",
    startLabel: "Start",
    sessionSingular: "Sitzung",
    sessionPlural: "Sitzungen",
    maxPrefix: "Max",
    bookNow: "Jetzt buchen",
    noBookingLink: "Kein Buchungslink",
  },
  therapists: {
    title: "Finde einen Therapeuten",
    searchLabel: "Suchen",
    searchPlaceholder: "Zum Beispiel Trauer, Trauma oder bildnerisch",
    allCities: "Alle Orte",
    allSpecializations: "Alle Spezialisierungen",
    allTargetGroups: "Alle Zielgruppen",
    allLanguages: "Alle Sprachen",
    allMethods: "Alle Methoden",
    filter: "Filtern",
    reset: "Zurucksetzen",
    resultSingular: "Therapeut gefunden",
    resultPlural: "Therapeuten gefunden",
    email: "E-Mail",
    call: "Anrufen",
    website: "Website",
    showMore: "Mehr Info",
    showLess: "Weniger Info",
    yearsExperienceSuffix: "Jahre Erfahrung",
  },
  shop: {
    assignmentCreditsTitle: "Aufgaben-Credits",
    assignmentCreditsDescription:
      "Hier zeigen wir die aktiven Aufgabenpakete und das Jahresabo fur Aufgaben. Damit schaltest du Aufgaben frei oder erhaltst ein Jahr lang vollen Zugriff.",
    assignmentCreditsListTitle: "Aufgabenoptionen",
    therapistSubscriptionTitle: "Therapeuten-Abo",
    therapistSubscriptionDescription:
      "Fur Therapeuten mit einem kostenlosen Konto, die ihr Profil im Therapeutenverzeichnis sichtbar machen mochten. Sobald das Abo aktiv ist, kannst du in deinem Profil die offentliche Sichtbarkeit aktivieren.",
    therapistSubscriptionDetailDescription:
      "Mit diesem Abo kannst du dein kostenloses Therapeuten-Konto erweitern, damit dein Profil im Therapeutenverzeichnis sichtbar werden kann.",
    booksTitle: "Bucher",
    booksDescription:
      "Ubersicht der physischen und visuellen Bucher im Shop. Geeignet fur Therapie, Coaching und den Einsatz zuhause.",
    booksListTitle: "Alle Bucher",
    ebooksTitle: "E-Books",
    ebooksDescription:
      "Ubersicht der app-exklusiven E-Books. Nach dem Kauf erscheinen sie in deinem Konto unter EBooks und du liest sie im geschutzten App-Reader.",
    ebooksListTitle: "Alle E-Books",
    gamesTitle: "Spiele",
    gamesDescription:
      "Ubersicht der Spielmaterialien im Shop, einschliesslich digitaler Varianten, die sich noch in Entwicklung befinden konnen.",
    gamesListTitle: "Alle Spiele",
    backToShop: "Zuruck zum Shop",
    backToCategoryPrefix: "Zuruck zu",
    categoryEyebrow: "Shop-Kategorie",
    bookCreditsTitle: "Buch-Credits",
    bookCreditsDescription:
      "Kaufe Buch-Credits, um E-Books direkt in der App freizuschalten und sicher im Reader zu lesen.",
    bookCreditsListTitle: "Verfugbare Buch-Credits",
    bookCreditsEmptyTitle: "Noch keine Buch-Credits aktiv",
    bookCreditsEmptyDescription:
      "Aktiviere zuerst ein oder mehrere Buch-Credit-Pakete in der Administration. Danach erscheinen sie hier automatisch.",
    gameCreditsTitle: "Spiel-Credits",
    gameCreditsDescription:
      "Kaufe Spiel-Credits, um digitale Spiele oder Spielinhalte in der App freizuschalten.",
    gameCreditsListTitle: "Verfugbare Spiel-Credits",
    gameCreditsEmptyTitle: "Noch keine Spiel-Credits aktiv",
    gameCreditsEmptyDescription:
      "Aktiviere zuerst ein oder mehrere Spiel-Credit-Pakete in der Administration. Danach erscheinen sie hier automatisch.",
    referralCreditsTitle: "Verweis-Credits",
    referralCreditsDescription:
      "Kaufe Verweis-Credits, um geschutzte Verweisinhalte in der App freizuschalten.",
    referralCreditsListTitle: "Verfugbare Verweis-Credits",
    referralCreditsEmptyTitle: "Noch keine Verweis-Credits aktiv",
    referralCreditsEmptyDescription:
      "Aktiviere zuerst ein oder mehrere Verweis-Credit-Pakete in der Administration. Danach erscheinen sie hier automatisch.",
  },
  shopCatalog: {
    viewAllOptions: "Alle Optionen ansehen",
    noImageLinked: "Kein Bild verknupft",
    productMoreInfo: "Mehr Info",
    assignmentPack: "Aufgabenpaket",
    mostChosen: "Am beliebtesten",
    bonusLabel: "Bonus",
    startPack: "Startpaket",
    basicPack: "Basispaket",
    plusPack: "Plus-Paket",
    valuePack: "Vorteilspaket",
    yearSubscriptionBadge: "Abo",
    yearSubscriptionShortTitle: "12 Monate",
    yearSubscriptionAccessLabel: "Zugang zu allen Aufgaben",
    yearSubscriptionTitleFallback: "Jahresabo",
    yearSubscriptionDescription:
      "12 Monate Zugang zu allen Aufgaben in der App. Wahrend eines aktiven Abos brauchst du keine einzelnen Aufgaben-Credits.",
    therapistDirectory: "Therapeutenverzeichnis",
    profileVisible: "Profil sichtbar machen",
    therapistSubscriptionBadge: "Therapeuten-Abo",
    durationLabel: "Dauer",
    fullAccessLabel: "Voller Zugriff",
    monthSingular: "Monat",
    monthPlural: "Monate",
    therapistSubscriptionSupportText:
      "Sobald das Abo aktiv ist, kannst du in deinem Konto angeben, dass dein Profil im Therapeutenverzeichnis sichtbar sein darf.",
    noAssignmentPacksTitle: "Noch keine Aufgabenpakete aktiv",
    noAssignmentPacksDescription:
      "Aktiviere zuerst ein oder mehrere Assignment-Credit-Packs oder das Jahresabo in der Administration. Danach erscheinen sie hier automatisch.",
  },
  ebookPurchase: {
    disabledError: "Die In-App-Bezahlverbindung ist noch nicht aktiv.",
    loginRequiredError: "Melde dich zuerst an, um ein E-Book zu kaufen.",
    notFoundError: "E-Book nicht gefunden.",
    paymentConnectionMissingDescription:
      "Der In-App-Bezahlschritt fur E-Books ist noch nicht verbunden. Die Kaufregistrierung und der Reader-Ablauf stehen aber bereits bereit.",
    paymentConnectionMissingLabel: "Bezahlverbindung fehlt",
    fallbackError: "Die Kaufverarbeitung ist fehlgeschlagen.",
  },
};

export function getPublicAppMessages(language: UiLanguage): PublicAppMessages {
  const baseLanguage = resolveBaseUiLanguage(language);
  if (baseLanguage === "en") return en;
  if (baseLanguage === "de") return de;
  return nl;
}
