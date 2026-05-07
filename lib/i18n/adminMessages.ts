import type { UiLanguage } from "@/lib/i18n/runtime";

type AdminMessages = {
  adminLabel: string;
  nav: {
    dashboard: string;
    general: string;
    users: string;
    usersList: string;
    newUser: string;
    administration: string;
    overview: string;
    credits: string;
    wallets: string;
    transactions: string;
    content: string;
    items: string;
    newItem: string;
    themes: string;
    categories: string;
    tags: string;
    media: string;
    insights: string;
    settings: string;
    security: string;
    app: string;
    shop: string;
    email: string;
    system: string;
  };
  settingsLayout: {
    title: string;
    subtitle: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    users: string;
    usersDesc: string;
    administration: string;
    administrationDesc: string;
    content: string;
    contentDesc: string;
  };
  insights: {
    title: string;
    subtitle: string;
    revenue: string;
    rev1: string;
    rev2: string;
    rev3: string;
    behavior: string;
    beh1: string;
    beh2: string;
    beh3: string;
    funnel: string;
    fun1: string;
    fun2: string;
    fun3: string;
  };
  contentPage: {
    title: string;
    newPage: string;
    loadError: string;
  };
  settingsGeneral: {
    title: string;
    desc: string;
  };
  settingsSecurity: {
    title: string;
    subtitle: string;
  };
  settingsApp: {
    title: string;
    items: string[];
  };
  settingsEmail: {
    title: string;
    items: string[];
  };
  settingsSystem: {
    title: string;
    items: string[];
  };
  administrationPage: {
    title: string;
    subtitle: string;
    overviewCreditsTitle: string;
    overviewCreditsDesc: string;
    overviewCreditsLink: string;
    overviewWalletsTitle: string;
    overviewWalletsDesc: string;
    overviewWalletsLink: string;
    overviewTransactionsTitle: string;
    overviewTransactionsDesc: string;
    overviewTransactionsLink: string;
    walletsAssignmentsTitle: string;
    walletsScopedTitle: string;
    user: string;
    type: string;
    available: string;
    totalPurchased: string;
    updated: string;
    date: string;
    creditType: string;
    delta: string;
    reason: string;
    purchaseAmount: string;
    transactionOverviewTitle: string;
    assignmentPack: string;
    scopedPack: string;
    yearSubscription: string;
    noAmount: string;
    statusEnded: string;
    statusPlanned: string;
    statusExpired: string;
    statusActive: string;
    scopeAssignment: string;
    scopeBook: string;
    scopeGame: string;
    scopeReferral: string;
    scopeTherapist: string;
  };
  creditPacksManager: {
    updated: string;
    created: string;
    saveFailed: string;
    activated: string;
    deactivated: string;
    toggleFailed: string;
    purchaseProcessed: string;
    purchaseFailed: string;
    entitlementGranted: string;
    entitlementFailed: string;
    therapistEntitlementGranted: string;
    therapistEntitlementFailed: string;
    packsTitle: string;
    name: string;
    slug: string;
    type: string;
    credits: string;
    price: string;
    status: string;
    actions: string;
    active: string;
    inactive: string;
    edit: string;
    disable: string;
    enable: string;
    delete: string;
    deleted: string;
    deleteFailed: string;
    deleteConfirm: string;
    noPacksFound: string;
    actionsLegend: string;
    editPackTitle: string;
    newPackTitle: string;
    scopeLabel: string;
    baseCredits: string;
    bonusCredits: string;
    priceCents: string;
    invalidEuroPrice: string;
    currency: string;
    sortOrder: string;
    activeToggle: string;
    save: string;
    updatePack: string;
    createPack: string;
    cancel: string;
    grantPackToUserTitle: string;
    user: string;
    selectUser: string;
    pack: string;
    selectPack: string;
    quantity: string;
    note: string;
    optional: string;
    processing: string;
    processPurchase: string;
    grantYearTitle: string;
    durationMonths: string;
    grantYear: string;
    grantTherapistTitle: string;
    therapistPlan: string;
    monthlyPlan: string;
    yearlyPlan: string;
    grantTherapist: string;
    scopeAssignment: string;
    scopeBook: string;
    scopeGame: string;
    scopeReferral: string;
  };
  usersPage: {
    unauthorized: string;
    loadFailed: string;
    title: string;
    description: string;
  };
  usersTable: {
    bulkActions: string;
    makeAdmin: string;
    makeUser: string;
    delete: string;
    apply: string;
    busy: string;
    searchPlaceholder: string;
    allRoles: string;
    admins: string;
    admin: string;
    users: string;
    name: string;
    email: string;
    role: string;
    subscriptions: string;
    noActiveSubscriptions: string;
    yearSubscription: string;
    therapistSubscription: string;
    indefinite: string;
    credits: string;
    you: string;
    user: string;
    noUsersFound: string;
    deleteConfirm: string;
  };
  createUserPage: {
    title: string;
  };
  createUserForm: {
    unknownError: string;
    email: string;
    emailPlaceholder: string;
    displayName: string;
    displayNamePlaceholder: string;
    role: string;
    user: string;
    admin: string;
    initialCredits: string;
    activation: string;
    invite: string;
    directPassword: string;
    password: string;
    passwordPlaceholder: string;
    adding: string;
    addUser: string;
  };
  contentTable: {
    all: string;
    draft: string;
    published: string;
    trash: string;
    bulkActions: string;
    quickEdit: string;
    restore: string;
    deletePermanent: string;
    moveToTrash: string;
    apply: string;
    selectAllFiltered: string;
    clearSelection: string;
    selectedCount: string;
    searchPlaceholder: string;
    title: string;
    status: string;
    language: string;
    languageLabel: string;
    categories: string;
    tags: string;
    date: string;
    allLanguages: string;
    allCategories: string;
    creditsLabel: string;
    allCredits: string;
    freeOnly: string;
    creditRangeHighLow: string;
    creditRangeLowHigh: string;
    sortLabel: string;
    sortUpdatedDesc: string;
    sortUpdatedAsc: string;
    sortPublishedDesc: string;
    sortPublishedAsc: string;
    sortTitleAsc: string;
    sortTitleDesc: string;
    previous: string;
    next: string;
    creditsSuffix: string;
    noContentFound: string;
  };
  contentRowActions: {
    deleteConfirm: string;
    edit: string;
    quickEdit: string;
    trash: string;
    view: string;
    restore: string;
    deletePermanent: string;
  };
  quickEditForm: {
    title: string;
    bulkEditTitle: string;
    bulkEditHint: string;
    creditCost: string;
    date: string;
    keepCurrent: string;
    clearDate: string;
    status: string;
    draft: string;
    published: string;
    categories: string;
    replaceCategories: string;
    update: string;
    cancel: string;
  };
  bulkDeleteModal: {
    title: string;
    message: string;
    irreversible: string;
    cancel: string;
    delete: string;
    busy: string;
  };
};

const nl: AdminMessages = {
  adminLabel: "Admin",
  nav: {
    dashboard: "Dashboard",
    general: "Algemeen",
    users: "Gebruikers",
    usersList: "Gebruikerslijst",
    newUser: "Nieuwe gebruiker",
    administration: "Administratie",
    overview: "Overzicht",
    credits: "Credits",
    wallets: "Wallets",
    transactions: "Transacties",
    content: "Content",
    items: "Items",
    newItem: "Nieuw item",
    themes: "Themes",
    categories: "Categorieen",
    tags: "Tags",
    media: "Media",
    insights: "Inzichten",
    settings: "Instellingen",
    security: "Beveiliging",
    app: "Customizer",
    shop: "Shop",
    email: "Email",
    system: "Systeem",
  },
  settingsLayout: {
    title: "Instellingen",
    subtitle: "Platform-, beveiligings- en infrastructuurinstellingen.",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Centrale ingang voor operations, content en platformbeheer.",
    users: "Gebruikers",
    usersDesc: "Identiteit, rollen en accountbeheer.",
    administration: "Administratie",
    administrationDesc: "Credits, wallets en transacties.",
    content: "Content",
    contentDesc: "Content-items, taxonomieen en media.",
  },
  insights: {
    title: "Inzichten",
    subtitle: "Business intelligence voor omzet, unlock-gedrag en funnelstatistieken.",
    revenue: "Omzet",
    rev1: "Omzet per dag, week en maand",
    rev2: "Gemiddelde unlock-prijs",
    rev3: "Conversieratio",
    behavior: "Gebruikersgedrag",
    beh1: "Voltooiingsratio",
    beh2: "Uitval per contenttype",
    beh3: "Meest ontgrendelde content",
    funnel: "Trechter",
    fun1: "Credits gekocht",
    fun2: "Credits besteed",
    fun3: "Ontgrendelratio",
  },
  contentPage: {
    title: "Content",
    newPage: "Nieuwe pagina",
    loadError: "Content laden mislukt",
  },
  settingsGeneral: {
    title: "Algemene instellingen",
    desc: "Platform-branding, basisconfiguratie en taalinstellingen.",
  },
  settingsSecurity: {
    title: "Beveiliging",
    subtitle: "Beheer loginlimieten, sessies en 2FA-beleid voor admins.",
  },
  settingsApp: {
    title: "Customizer",
    items: [
      "Minimale appversie",
      "Force-update schakelaar",
      "App Store-product-ID's",
      "IAP-validatie schakelaar",
      "Onderhoudsmodus",
    ],
  },
  settingsEmail: {
    title: "Email",
    items: [
      "SMTP-configuratie",
      "Transactionele templates",
      "Ontgrendel e-mailtemplate",
      "Herinnering e-mailtemplate",
      "Branding-variabelen",
    ],
  },
  settingsSystem: {
    title: "Systeem",
    items: [
      "Feature flags",
      "Cache legen",
      "Zoekindex opnieuw opbouwen",
      "Queue-monitor",
      "Logviewer en database-health check",
    ],
  },
  administrationPage: {
    title: "Administratie",
    subtitle: "Credits, wallets en transacties voor je ontgrendel-businessmodel.",
    overviewCreditsTitle: "Credits",
    overviewCreditsDesc: "Creditpacks, prijzen en toekenningen.",
    overviewCreditsLink: "Ga naar credits",
    overviewWalletsTitle: "Wallets",
    overviewWalletsDesc: "Wallet-overzicht per credit-scope.",
    overviewWalletsLink: "Ga naar wallets",
    overviewTransactionsTitle: "Transacties",
    overviewTransactionsDesc: "Mutaties, aankopen en jaarabonnementen.",
    overviewTransactionsLink: "Ga naar transacties",
    walletsAssignmentsTitle: "Wallets (opdrachten)",
    walletsScopedTitle: "Wallets (boek/spel/verwijs)",
    user: "Gebruiker",
    type: "Type",
    available: "Beschikbaar",
    totalPurchased: "Totaal gekocht",
    updated: "Bijgewerkt",
    date: "Datum",
    creditType: "Type credits",
    delta: "Delta",
    reason: "Reden",
    purchaseAmount: "Aankoopkosten",
    transactionOverviewTitle: "Transactieoverzicht (alle aankopen)",
    assignmentPack: "creditpack",
    scopedPack: "creditpack (specifiek)",
    yearSubscription: "jaarabonnement",
    noAmount: "—",
    statusEnded: "beëindigd",
    statusPlanned: "gepland",
    statusExpired: "verlopen",
    statusActive: "actief",
    scopeAssignment: "opdrachten",
    scopeBook: "boeken",
    scopeGame: "spellen",
    scopeReferral: "verwijsbestanden",
    scopeTherapist: "therapeutenlijst",
  },
  creditPacksManager: {
    updated: "Creditpack bijgewerkt.",
    created: "Creditpack aangemaakt.",
    saveFailed: "Opslaan mislukt.",
    activated: "Pack geactiveerd.",
    deactivated: "Pack gedeactiveerd.",
    toggleFailed: "Status wijzigen mislukt.",
    purchaseProcessed: "Pack-aankoop verwerkt.",
    purchaseFailed: "Aankoop mislukt.",
    entitlementGranted: "Jaarabonnement (opdrachten) toegekend.",
    entitlementFailed: "Toekennen mislukt.",
    therapistEntitlementGranted: "Therapeut-abonnement toegekend.",
    therapistEntitlementFailed: "Therapeut-abonnement toekennen mislukt.",
    packsTitle: "Pakketten",
    name: "Naam",
    slug: "Slug",
    type: "Type",
    credits: "Credits",
    price: "Prijs",
    status: "Status",
    actions: "Acties",
    active: "Actief",
    inactive: "Inactief",
    edit: "Bewerken",
    disable: "Uitschakelen",
    enable: "Inschakelen",
    delete: "Verwijderen",
    deleted: "Creditpack verwijderd.",
    deleteFailed: "Verwijderen mislukt.",
    deleteConfirm: "Weet je zeker dat je '{name}' definitief wilt verwijderen?",
    noPacksFound: "Geen packs gevonden.",
    actionsLegend: "Legenda acties:",
    editPackTitle: "Creditpack bewerken",
    newPackTitle: "Nieuw creditpack",
    scopeLabel: "Type credits",
    baseCredits: "Basiscredits",
    bonusCredits: "Bonuscredits",
    priceCents: "Prijs (EUR)",
    invalidEuroPrice: "Voer een geldige prijs in euro's in, bijvoorbeeld 9,99.",
    currency: "Valuta",
    sortOrder: "Sorteervolgorde",
    activeToggle: "Actief",
    save: "Opslaan...",
    updatePack: "Pack bijwerken",
    createPack: "Pack aanmaken",
    cancel: "Annuleren",
    grantPackToUserTitle: "Pack toekennen aan gebruiker",
    user: "Gebruiker",
    selectUser: "Selecteer gebruiker",
    pack: "Pack",
    selectPack: "Selecteer pack",
    quantity: "Aantal",
    note: "Notitie",
    optional: "optioneel",
    processing: "Verwerken...",
    processPurchase: "Verwerk aankoop",
    grantYearTitle: "Jaarabonnement toekennen (alleen opdrachten)",
    durationMonths: "Duur (maanden)",
    grantYear: "Jaarabonnement toekennen",
    grantTherapistTitle: "Therapeut-abonnement toekennen",
    therapistPlan: "Abonnement",
    monthlyPlan: "Maandelijks",
    yearlyPlan: "Jaarlijks",
    grantTherapist: "Therapeut-abonnement toekennen",
    scopeAssignment: "Opdrachten",
    scopeBook: "Boeken",
    scopeGame: "Spellen",
    scopeReferral: "Verwijsbestanden",
  },
  usersPage: {
    unauthorized: "Niet geautoriseerd",
    loadFailed: "Gebruikers konden niet geladen worden",
    title: "Gebruikers",
    description: "Beheer gebruikers, rollen en credits",
  },
  usersTable: {
    bulkActions: "Bulk acties",
    makeAdmin: "Rol -> Admin",
    makeUser: "Rol -> Gebruiker",
    delete: "Verwijderen",
    apply: "Toepassen",
    busy: "Bezig...",
    searchPlaceholder: "Zoek gebruikers...",
    allRoles: "Alle rollen",
    admins: "Admins",
    admin: "Admin",
    users: "Gebruikers",
    name: "Naam",
    email: "E-mail",
    role: "Rol",
    subscriptions: "Abonnementen",
    noActiveSubscriptions: "Geen actief abonnement",
    yearSubscription: "Jaar",
    therapistSubscription: "Therapeut",
    indefinite: "onbepaalde tijd",
    credits: "Credits",
    you: "Jij",
    user: "Gebruiker",
    noUsersFound: "Geen gebruikers gevonden.",
    deleteConfirm: "Weet je zeker dat je {count} gebruiker(s) definitief wilt verwijderen?",
  },
  createUserPage: {
    title: "Gebruiker toevoegen",
  },
  createUserForm: {
    unknownError: "Onbekende fout.",
    email: "E-mail",
    emailPlaceholder: "naam@domein.nl",
    displayName: "Weergavenaam",
    displayNamePlaceholder: "Danny Geurts",
    role: "Rol",
    user: "Gebruiker",
    admin: "Admin",
    initialCredits: "Start credits",
    activation: "Account activatie",
    invite: "Uitnodiging per e-mail",
    directPassword: "Direct wachtwoord",
    password: "Wachtwoord",
    passwordPlaceholder: "minimaal 8 tekens",
    adding: "Toevoegen...",
    addUser: "Gebruiker toevoegen",
  },
  contentTable: {
    all: "Alle",
    draft: "Concept",
    published: "Gepubliceerd",
    trash: "Prullenbak",
    bulkActions: "Bulkacties",
    quickEdit: "Snel bewerken",
    restore: "Herstellen",
    deletePermanent: "Permanent verwijderen",
    moveToTrash: "Verplaatsen naar prullenbak",
    apply: "Toepassen",
    selectAllFiltered: "Alles selecteren",
    clearSelection: "Selectie wissen",
    selectedCount: "{count} geselecteerd",
    searchPlaceholder: "Berichten zoeken",
    title: "Titel",
    status: "Status",
    language: "Taal",
    languageLabel: "Taalfilter",
    categories: "Categorieen",
    tags: "Tags",
    date: "Datum",
    allLanguages: "Alle talen",
    allCategories: "Alle categorieen",
    creditsLabel: "Credits filter",
    allCredits: "Alle credits",
    freeOnly: "Gratis",
    creditRangeHighLow: "Credits hoog-laag",
    creditRangeLowHigh: "Credits laag-hoog",
    sortLabel: "Sorteren op",
    sortUpdatedDesc: "Laatst bijgewerkt",
    sortUpdatedAsc: "Eerst oudste wijziging",
    sortPublishedDesc: "Publicatiedatum nieuw-oud",
    sortPublishedAsc: "Publicatiedatum oud-nieuw",
    sortTitleAsc: "Titel A-Z",
    sortTitleDesc: "Titel Z-A",
    previous: "Vorige",
    next: "Volgende",
    creditsSuffix: "credits",
    noContentFound: "Geen content gevonden.",
  },
  contentRowActions: {
    deleteConfirm: "Weet je zeker dat je dit item permanent wilt verwijderen?",
    edit: "Bewerken",
    quickEdit: "Snel bewerken",
    trash: "Prullenbak",
    view: "Bekijken",
    restore: "Herstellen",
    deletePermanent: "Permanent verwijderen",
  },
  quickEditForm: {
    title: "Titel",
    bulkEditTitle: "Snel bewerken",
    bulkEditHint: "Lege velden blijven ongewijzigd voor de geselecteerde items.",
    creditCost: "Credit kosten",
    date: "Datum",
    keepCurrent: "Niet wijzigen",
    clearDate: "Datum leegmaken",
    status: "Status",
    draft: "Concept",
    published: "Gepubliceerd",
    categories: "Categorieen",
    replaceCategories: "Categorieen vervangen",
    update: "Bijwerken",
    cancel: "Annuleren",
  },
  bulkDeleteModal: {
    title: "Items verwijderen",
    message: "Weet je zeker dat je {count} item(s) wilt verwijderen?",
    irreversible: "Deze actie kan niet ongedaan worden gemaakt.",
    cancel: "Annuleren",
    delete: "Verwijderen",
    busy: "Bezig...",
  },
};

const en: AdminMessages = {
  ...nl,
  nav: {
    ...nl.nav,
    general: "General",
    users: "Users",
    usersList: "Users list",
    newUser: "New user",
    administration: "Administration",
    overview: "Overview",
    transactions: "Transactions",
    newItem: "New item",
    themes: "Themes",
    categories: "Categories",
    insights: "Insights",
    settings: "Settings",
    security: "Security",
    shop: "Shop",
    system: "System",
  },
  settingsLayout: {
    title: "Settings",
    subtitle: "Platform, security and infrastructure settings.",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Central entry point for operations, content and platform management.",
    users: "Users",
    usersDesc: "Identity, roles and account management.",
    administration: "Administration",
    administrationDesc: "Credits, wallets and transactions.",
    content: "Content",
    contentDesc: "Content items, taxonomies and media.",
  },
  insights: {
    title: "Insights",
    subtitle: "Business intelligence for revenue, unlock behavior and funnel metrics.",
    revenue: "Revenue",
    rev1: "Revenue by day, week and month",
    rev2: "Average unlock price",
    rev3: "Conversion rate",
    behavior: "User behavior",
    beh1: "Completion ratio",
    beh2: "Drop-off per content type",
    beh3: "Most unlocked content",
    funnel: "Funnel",
    fun1: "Credits purchased",
    fun2: "Credits spent",
    fun3: "Unlock ratio",
  },
  contentPage: {
    title: "Content",
    newPage: "New page",
    loadError: "Loading content failed",
  },
  settingsGeneral: {
    title: "General settings",
    desc: "Platform branding, base configuration and language settings.",
  },
  settingsSecurity: {
    title: "Security",
    subtitle: "Manage login limits, sessions, and 2FA policies for admins.",
  },
  settingsApp: {
    title: "Customizer",
    items: [
      "Minimum app version",
      "Force-update toggle",
      "App Store product IDs",
      "IAP validation toggle",
      "Maintenance mode",
    ],
  },
  settingsEmail: {
    title: "Email",
    items: [
      "SMTP configuration",
      "Transactional templates",
      "Unlock email template",
      "Reminder email template",
      "Branding variables",
    ],
  },
  settingsSystem: {
    title: "System",
    items: [
      "Feature flags",
      "Clear cache",
      "Rebuild search index",
      "Queue monitor",
      "Logs viewer and DB health check",
    ],
  },
  administrationPage: {
    ...nl.administrationPage,
    title: "Administration",
    subtitle: "Credits, wallets and transactions for your unlock business model.",
    overviewCreditsLink: "Go to credits",
    overviewWalletsLink: "Go to wallets",
    overviewTransactionsLink: "Go to transactions",
    walletsAssignmentsTitle: "Wallets (assignments)",
    walletsScopedTitle: "Wallets (book/game/referral)",
    user: "User",
    available: "Available",
    totalPurchased: "Total purchased",
    updated: "Updated",
    date: "Date",
    creditType: "Credit type",
    reason: "Reason",
    purchaseAmount: "Purchase amount",
    transactionOverviewTitle: "Transaction overview (all purchases)",
    assignmentPack: "credit pack",
    scopedPack: "credit pack (scoped)",
    yearSubscription: "year subscription",
    statusEnded: "ended",
    statusPlanned: "planned",
    statusExpired: "expired",
    statusActive: "active",
    scopeAssignment: "assignments",
    scopeBook: "books",
    scopeGame: "games",
    scopeReferral: "referrals",
    scopeTherapist: "therapist directory",
  },
  creditPacksManager: {
    ...nl.creditPacksManager,
    updated: "Credit pack updated.",
    created: "Credit pack created.",
    saveFailed: "Saving failed.",
    activated: "Pack activated.",
    deactivated: "Pack deactivated.",
    toggleFailed: "Failed to update status.",
    purchaseProcessed: "Pack purchase processed.",
    purchaseFailed: "Purchase failed.",
    entitlementGranted: "Year subscription (assignments) granted.",
    entitlementFailed: "Grant failed.",
    therapistEntitlementGranted: "Therapist subscription granted.",
    therapistEntitlementFailed: "Granting therapist subscription failed.",
    packsTitle: "Packs",
    type: "Type",
    price: "Price",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    disable: "Disable",
    enable: "Enable",
    delete: "Delete",
    deleted: "Credit pack deleted.",
    deleteFailed: "Deleting failed.",
    deleteConfirm: "Are you sure you want to permanently delete '{name}'?",
    noPacksFound: "No packs found.",
    actionsLegend: "Actions legend:",
    editPackTitle: "Edit credit pack",
    newPackTitle: "New credit pack",
    scopeLabel: "Credit type",
    baseCredits: "Base credits",
    bonusCredits: "Bonus credits",
    priceCents: "Price (EUR)",
    invalidEuroPrice: "Enter a valid euro price, for example 9.99.",
    currency: "Currency",
    sortOrder: "Sort order",
    activeToggle: "Active",
    save: "Saving...",
    updatePack: "Update pack",
    createPack: "Create pack",
    cancel: "Cancel",
    grantPackToUserTitle: "Grant pack to user",
    user: "User",
    selectUser: "Select user",
    pack: "Pack",
    selectPack: "Select pack",
    quantity: "Quantity",
    note: "Note",
    optional: "optional",
    processing: "Processing...",
    processPurchase: "Process purchase",
    grantYearTitle: "Grant year subscription (assignments only)",
    durationMonths: "Duration (months)",
    grantYear: "Grant year subscription",
    grantTherapistTitle: "Grant therapist subscription",
    therapistPlan: "Subscription",
    monthlyPlan: "Monthly",
    yearlyPlan: "Yearly",
    grantTherapist: "Grant therapist subscription",
    scopeAssignment: "Assignments",
    scopeBook: "Books",
    scopeGame: "Games",
    scopeReferral: "Referrals",
  },
  usersPage: {
    unauthorized: "Not authorized",
    loadFailed: "Failed to load users",
    title: "Users",
    description: "Manage users, roles and credits",
  },
  usersTable: {
    ...nl.usersTable,
    bulkActions: "Bulk actions",
    makeAdmin: "Role -> Admin",
    makeUser: "Role -> User",
    delete: "Delete",
    apply: "Apply",
    busy: "Working...",
    searchPlaceholder: "Search users...",
    allRoles: "All roles",
    admins: "Admins",
    admin: "Admin",
    users: "Users",
    name: "Name",
    role: "Role",
    subscriptions: "Subscriptions",
    noActiveSubscriptions: "No active subscription",
    yearSubscription: "Year",
    therapistSubscription: "Therapist",
    indefinite: "indefinite",
    you: "You",
    user: "User",
    noUsersFound: "No users found.",
    deleteConfirm: "Are you sure you want to permanently delete {count} user(s)?",
  },
  createUserPage: {
    title: "Add user",
  },
  createUserForm: {
    ...nl.createUserForm,
    unknownError: "Unknown error.",
    displayName: "Display name",
    role: "Role",
    user: "User",
    initialCredits: "Initial credits",
    activation: "Account activation",
    invite: "Email invitation",
    directPassword: "Direct password",
    password: "Password",
    passwordPlaceholder: "minimum 8 characters",
    adding: "Adding...",
    addUser: "Add user",
  },
  contentTable: {
    ...nl.contentTable,
    all: "All",
    draft: "Draft",
    published: "Published",
    trash: "Trash",
    bulkActions: "Bulk actions",
    quickEdit: "Quick edit",
    restore: "Restore",
    deletePermanent: "Delete permanently",
    moveToTrash: "Move to trash",
    apply: "Apply",
    selectAllFiltered: "Select all",
    clearSelection: "Clear selection",
    selectedCount: "{count} selected",
    searchPlaceholder: "Search posts",
    title: "Title",
    status: "Status",
    language: "Language",
    languageLabel: "Language filter",
    categories: "Categories",
    allLanguages: "All languages",
    allCategories: "All categories",
    creditsLabel: "Credits filter",
    allCredits: "All credits",
    freeOnly: "Free",
    creditRangeHighLow: "Credits high to low",
    creditRangeLowHigh: "Credits low to high",
    sortLabel: "Sort by",
    sortUpdatedDesc: "Recently updated",
    sortUpdatedAsc: "Oldest updated first",
    sortPublishedDesc: "Published date newest first",
    sortPublishedAsc: "Published date oldest first",
    sortTitleAsc: "Title A-Z",
    sortTitleDesc: "Title Z-A",
    previous: "Previous",
    next: "Next",
    date: "Date",
    creditsSuffix: "credits",
    noContentFound: "No content found.",
  },
  contentRowActions: {
    ...nl.contentRowActions,
    deleteConfirm: "Are you sure you want to permanently delete this item?",
    edit: "Edit",
    quickEdit: "Quick edit",
    trash: "Trash",
    view: "View",
    restore: "Restore",
    deletePermanent: "Delete permanently",
  },
  quickEditForm: {
    ...nl.quickEditForm,
    title: "Title",
    bulkEditTitle: "Quick edit",
    bulkEditHint: "Empty fields stay unchanged for the selected items.",
    creditCost: "Credit cost",
    date: "Date",
    keepCurrent: "Keep current",
    clearDate: "Clear date",
    status: "Status",
    draft: "Draft",
    published: "Published",
    categories: "Categories",
    replaceCategories: "Replace categories",
    update: "Update",
    cancel: "Cancel",
  },
  bulkDeleteModal: {
    ...nl.bulkDeleteModal,
    title: "Delete items",
    message: "Are you sure you want to delete {count} item(s)?",
    irreversible: "This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    busy: "Working...",
  },
};

const de: AdminMessages = {
  ...nl,
  nav: {
    ...nl.nav,
    general: "Allgemein",
    users: "Benutzer",
    usersList: "Benutzerliste",
    newUser: "Neuer Benutzer",
    administration: "Verwaltung",
    overview: "Ubersicht",
    transactions: "Transaktionen",
    content: "Inhalt",
    items: "Elemente",
    newItem: "Neues Element",
    themes: "Themen",
    categories: "Kategorien",
    insights: "Einblicke",
    settings: "Einstellungen",
    security: "Sicherheit",
    shop: "Shop",
    email: "E-Mail",
    system: "System",
  },
  settingsLayout: {
    title: "Einstellungen",
    subtitle: "Plattform-, Sicherheits- und Infrastruktur-Einstellungen.",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Zentraler Einstieg fur Betrieb, Inhalte und Plattformverwaltung.",
    users: "Benutzer",
    usersDesc: "Identitat, Rollen und Kontoverwaltung.",
    administration: "Verwaltung",
    administrationDesc: "Credits, Wallets und Transaktionen.",
    content: "Inhalt",
    contentDesc: "Inhalte, Taxonomien und Medien.",
  },
  insights: {
    title: "Einblicke",
    subtitle: "Business Intelligence fur Umsatz, Entsperrverhalten und Funnel-Metriken.",
    revenue: "Umsatz",
    rev1: "Umsatz pro Tag, Woche und Monat",
    rev2: "Durchschnittlicher Entsperrpreis",
    rev3: "Konversionsrate",
    behavior: "Nutzerverhalten",
    beh1: "Abschlussquote",
    beh2: "Drop-off nach Inhaltstyp",
    beh3: "Am haufigsten entsperrte Inhalte",
    funnel: "Funnel",
    fun1: "Credits gekauft",
    fun2: "Credits ausgegeben",
    fun3: "Entsperrquote",
  },
  contentPage: {
    title: "Inhalt",
    newPage: "Neue Seite",
    loadError: "Inhalte konnten nicht geladen werden",
  },
  settingsGeneral: {
    title: "Allgemeine Einstellungen",
    desc: "Plattform-Branding, Grundkonfiguration und Spracheinstellungen.",
  },
  settingsSecurity: {
    title: "Sicherheit",
    subtitle: "Verwalte Login-Grenzen, Sitzungen und 2FA-Richtlinien.",
  },
  settingsApp: {
    title: "Customizer",
    items: [
      "Minimale App-Version",
      "Force-Update Schalter",
      "App Store Produkt-IDs",
      "IAP-Validierung Schalter",
      "Wartungsmodus",
    ],
  },
  settingsEmail: {
    title: "E-Mail",
    items: [
      "SMTP-Konfiguration",
      "Transaktionale Vorlagen",
      "Entsperr-E-Mail Vorlage",
      "Erinnerungs-E-Mail Vorlage",
      "Branding-Variablen",
    ],
  },
  settingsSystem: {
    title: "System",
    items: [
      "Feature Flags",
      "Cache leeren",
      "Suchindex neu aufbauen",
      "Queue-Monitor",
      "Logviewer und Datenbank-Health-Check",
    ],
  },
  administrationPage: {
    ...nl.administrationPage,
    title: "Verwaltung",
    subtitle: "Credits, Wallets und Transaktionen fur dein Entsperr-Geschaftsmodell.",
    overviewCreditsLink: "Zu Credits",
    overviewWalletsLink: "Zu Wallets",
    overviewTransactionsLink: "Zu Transaktionen",
    walletsAssignmentsTitle: "Wallets (Aufgaben)",
    walletsScopedTitle: "Wallets (Buch/Spiel/Verweis)",
    user: "Benutzer",
    available: "Verfugbar",
    totalPurchased: "Insgesamt gekauft",
    updated: "Aktualisiert",
    date: "Datum",
    creditType: "Credit-Typ",
    purchaseAmount: "Kaufbetrag",
    transactionOverviewTitle: "Transaktionsubersicht (alle Kaufe)",
    assignmentPack: "Creditpaket",
    scopedPack: "Creditpaket (spezifisch)",
    yearSubscription: "Jahresabonnement",
    statusEnded: "beendet",
    statusPlanned: "geplant",
    statusExpired: "abgelaufen",
    statusActive: "aktiv",
    scopeAssignment: "aufgaben",
    scopeBook: "bucher",
    scopeGame: "spiele",
    scopeReferral: "verweisdateien",
    scopeTherapist: "therapeutenverzeichnis",
  },
  creditPacksManager: {
    ...nl.creditPacksManager,
    updated: "Creditpaket aktualisiert.",
    created: "Creditpaket erstellt.",
    saveFailed: "Speichern fehlgeschlagen.",
    activated: "Paket aktiviert.",
    deactivated: "Paket deaktiviert.",
    toggleFailed: "Status konnte nicht geandert werden.",
    purchaseProcessed: "Paketkauf verarbeitet.",
    purchaseFailed: "Kauf fehlgeschlagen.",
    entitlementGranted: "Jahresabonnement (Aufgaben) zugewiesen.",
    entitlementFailed: "Zuweisung fehlgeschlagen.",
    therapistEntitlementGranted: "Therapeuten-Abo zugewiesen.",
    therapistEntitlementFailed: "Therapeuten-Abo konnte nicht zugewiesen werden.",
    packsTitle: "Pakete",
    actions: "Aktionen",
    active: "Aktiv",
    inactive: "Inaktiv",
    edit: "Bearbeiten",
    disable: "Deaktivieren",
    enable: "Aktivieren",
    delete: "Loschen",
    deleted: "Creditpaket entfernt.",
    deleteFailed: "Loschen fehlgeschlagen.",
    deleteConfirm: "Mochtest du '{name}' wirklich dauerhaft loschen?",
    noPacksFound: "Keine Pakete gefunden.",
    actionsLegend: "Legende Aktionen:",
    editPackTitle: "Creditpaket bearbeiten",
    newPackTitle: "Neues Creditpaket",
    scopeLabel: "Credit-Typ",
    baseCredits: "Basis-Credits",
    bonusCredits: "Bonus-Credits",
    currency: "Wahrung",
    sortOrder: "Sortierung",
    activeToggle: "Aktiv",
    save: "Speichern...",
    updatePack: "Paket aktualisieren",
    createPack: "Paket erstellen",
    cancel: "Abbrechen",
    grantPackToUserTitle: "Paket an Benutzer zuweisen",
    user: "Benutzer",
    selectUser: "Benutzer auswahlen",
    pack: "Paket",
    selectPack: "Paket auswahlen",
    quantity: "Anzahl",
    note: "Notiz",
    optional: "optional",
    processing: "Verarbeiten...",
    processPurchase: "Kauf verarbeiten",
    grantYearTitle: "Jahresabonnement zuweisen (nur Aufgaben)",
    durationMonths: "Dauer (Monate)",
    grantYear: "Jahresabonnement zuweisen",
    grantTherapistTitle: "Therapeuten-Abo zuweisen",
    therapistPlan: "Abonnement",
    monthlyPlan: "Monatlich",
    yearlyPlan: "Jahrlich",
    grantTherapist: "Therapeuten-Abo zuweisen",
    scopeAssignment: "Aufgaben",
    scopeBook: "Bucher",
    scopeGame: "Spiele",
    scopeReferral: "Verweisdateien",
    priceCents: "Preis (EUR)",
    invalidEuroPrice: "Gib einen gultigen Euro-Betrag ein, zum Beispiel 9,99.",
  },
  usersPage: {
    unauthorized: "Nicht autorisiert",
    loadFailed: "Benutzer konnten nicht geladen werden",
    title: "Benutzer",
    description: "Benutzer, Rollen und Credits verwalten",
  },
  usersTable: {
    ...nl.usersTable,
    bulkActions: "Sammelaktionen",
    makeAdmin: "Rolle -> Admin",
    makeUser: "Rolle -> Benutzer",
    delete: "Loschen",
    apply: "Anwenden",
    busy: "In Bearbeitung...",
    searchPlaceholder: "Benutzer suchen...",
    allRoles: "Alle Rollen",
    admins: "Admins",
    admin: "Admin",
    users: "Benutzer",
    name: "Name",
    role: "Rolle",
    subscriptions: "Abonnements",
    noActiveSubscriptions: "Kein aktives Abonnement",
    yearSubscription: "Jahr",
    therapistSubscription: "Therapeut",
    indefinite: "unbegrenzt",
    you: "Du",
    user: "Benutzer",
    noUsersFound: "Keine Benutzer gefunden.",
    deleteConfirm: "Mochtest du wirklich {count} Benutzer dauerhaft loschen?",
  },
  createUserPage: {
    title: "Benutzer hinzufugen",
  },
  createUserForm: {
    ...nl.createUserForm,
    unknownError: "Unbekannter Fehler.",
    displayName: "Anzeigename",
    role: "Rolle",
    user: "Benutzer",
    initialCredits: "Start-Credits",
    activation: "Kontoaktivierung",
    invite: "Einladung per E-Mail",
    directPassword: "Direktes Passwort",
    password: "Passwort",
    passwordPlaceholder: "mindestens 8 Zeichen",
    adding: "Hinzufugen...",
    addUser: "Benutzer hinzufugen",
  },
  contentTable: {
    ...nl.contentTable,
    all: "Alle",
    draft: "Entwurf",
    published: "Veroffentlicht",
    trash: "Papierkorb",
    bulkActions: "Sammelaktionen",
    quickEdit: "Schnell bearbeiten",
    restore: "Wiederherstellen",
    deletePermanent: "Endgultig loschen",
    moveToTrash: "In Papierkorb verschieben",
    apply: "Anwenden",
    selectAllFiltered: "Alle auswahlen",
    clearSelection: "Auswahl aufheben",
    selectedCount: "{count} ausgewahlt",
    searchPlaceholder: "Inhalte suchen",
    title: "Titel",
    status: "Status",
    language: "Sprache",
    languageLabel: "Sprachfilter",
    categories: "Kategorien",
    allLanguages: "Alle Sprachen",
    allCategories: "Alle Kategorien",
    creditsLabel: "Credits-Filter",
    allCredits: "Alle Credits",
    freeOnly: "Kostenlos",
    creditRangeHighLow: "Credits hoch-niedrig",
    creditRangeLowHigh: "Credits niedrig-hoch",
    sortLabel: "Sortieren nach",
    sortUpdatedDesc: "Zuletzt aktualisiert",
    sortUpdatedAsc: "Alteste Anderung zuerst",
    sortPublishedDesc: "Neueste zuerst veroffentlicht",
    sortPublishedAsc: "Alteste zuerst veroffentlicht",
    sortTitleAsc: "Titel A-Z",
    sortTitleDesc: "Titel Z-A",
    previous: "Zuruck",
    next: "Weiter",
    date: "Datum",
    creditsSuffix: "credits",
    noContentFound: "Kein Inhalt gefunden.",
  },
  contentRowActions: {
    ...nl.contentRowActions,
    deleteConfirm: "Mochtest du dieses Element wirklich dauerhaft loschen?",
    edit: "Bearbeiten",
    quickEdit: "Schnell bearbeiten",
    trash: "Papierkorb",
    view: "Ansehen",
    restore: "Wiederherstellen",
    deletePermanent: "Endgultig loschen",
  },
  quickEditForm: {
    ...nl.quickEditForm,
    title: "Titel",
    bulkEditTitle: "Schnell bearbeiten",
    bulkEditHint: "Leere Felder bleiben fur die ausgewahlten Elemente unverandert.",
    creditCost: "Credit-Kosten",
    date: "Datum",
    keepCurrent: "Nicht andern",
    clearDate: "Datum leeren",
    status: "Status",
    draft: "Entwurf",
    published: "Veroffentlicht",
    categories: "Kategorien",
    replaceCategories: "Kategorien ersetzen",
    update: "Aktualisieren",
    cancel: "Abbrechen",
  },
  bulkDeleteModal: {
    ...nl.bulkDeleteModal,
    title: "Elemente loschen",
    message: "Mochtest du wirklich {count} Element(e) loschen?",
    irreversible: "Diese Aktion kann nicht ruckgangig gemacht werden.",
    cancel: "Abbrechen",
    delete: "Loschen",
    busy: "In Bearbeitung...",
  },
};

export function getAdminMessages(language: UiLanguage): AdminMessages {
  if (language === "en") return en;
  if (language === "de") return de;
  return nl;
}
