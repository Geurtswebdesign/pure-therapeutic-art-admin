import type { UiLanguage } from "@/lib/i18n/runtime";

type AppMessages = {
  home: {
    title: string;
    subtitle: string;
    viewContent: string;
    login: string;
  };
  login: {
    title: string;
    email: string;
    password: string;
    submit: string;
    mfaTitle: string;
    mfaPrompt: string;
    mfaCode: string;
    mfaSubmit: string;
    mfaInvalid: string;
    mfaSetupPrompt: string;
    mfaSetupContinue: string;
  };
  accountPage: {
    title: string;
    subtitle: string;
  };
  accountTabs: {
    overview: string;
    profile: string;
    credits: string;
    unlocked: string;
    clients: string;
    welcome: string;
    accountType: string;
    availableCredits: string;
    unlockedItems: string;
    unlockedTitle: string;
    noUnlocked: string;
    unknownContent: string;
    titleCol: string;
    categoryCol: string;
    creditsCol: string;
    dateCol: string;
    therapistTitle: string;
    therapistDesc: string;
    roleTherapist: string;
    roleAdmin: string;
    roleClient: string;
    roleUser: string;
  };
  accountProfile: {
    saved: string;
    saveFailed: string;
    title: string;
    email: string;
    displayName: string;
    bio: string;
    save: string;
    saving: string;
  };
  userHeader: {
    createdAt: string;
  };
  userTabs: {
    general: string;
    credits: string;
    unlocked: string;
  };
  userGeneral: {
    name: string;
    firstName: string;
    lastName: string;
    nickname: string;
    displayName: string;
    contactInfo: string;
    website: string;
    aboutYou: string;
    saveChanges: string;
    saving: string;
    accountSecurity: string;
  };
  roleEditor: {
    unknownError: string;
    title: string;
    updated: string;
    adminWarning: string;
    save: string;
    saving: string;
    user: string;
    admin: string;
  };
  resetPassword: {
    unknownError: string;
    title: string;
    updated: string;
    placeholder: string;
    reset: string;
    busy: string;
  };
  userCredits: {
    adjustCredits: string;
    selfGuard: string;
    add: string;
    subtract: string;
    yearSubTitle: string;
    noYearSub: string;
    start: string;
    endLabel: string;
    indefinite: string;
    status: string;
    active: string;
    ended: string;
    ending: string;
    endAction: string;
    adjustFailed: string;
    endFailed: string;
  };
  creditOverview: {
    available: string;
  };
  creditTransactions: {
    title: string;
    noTransactions: string;
    date: string;
    credits: string;
    reason: string;
  };
  unlockedTable: {
    noUnlocked: string;
    title: string;
    category: string;
    paid: string;
    date: string;
    unknownContent: string;
    creditsSuffix: string;
  };
  lockedView: {
    scopeAssignment: string;
    scopeBook: string;
    scopeGame: string;
    scopeReferral: string;
    askAccess: string;
    useCredits: string;
    costBalance: string;
    buyCredits: string;
    unlockNow: string;
    loginToUnlock: string;
    unlocking: string;
    insufficient: string;
    unlockFailed: string;
  };
  metadata: {
    unsavedDeleteConfirm: string;
    deleteConfirm: string;
    publish: string;
    saving: string;
    saveDraft: string;
    viewLive: string;
    editStatus: string;
    ok: string;
    cancel: string;
    publishDate: string;
    creditCost: string;
    update: string;
    publishAction: string;
    moveToTrash: string;
    permalink: string;
    noSlug: string;
    featuredImage: string;
    featuredImageAlt: string;
    altText: string;
    noFeatured: string;
    change: string;
    choose: string;
    delete: string;
    close: string;
    categories: string;
    noCategories: string;
    tags: string;
    noTags: string;
    excerpt: string;
    excerptPlaceholder: string;
    settings: string;
    language: string;
    visibilityPublic: string;
    unknownSaveError: string;
  };
  mediaLibrary: {
    libraryTab: string;
    uploadTab: string;
    uploadTitle: string;
    chooseFiles: string;
    dropHint: string;
    multiHint: string;
    libraryTitle: string;
    searchPlaceholder: string;
    loading: string;
    noneFound: string;
    attachmentDetails: string;
    selectToEdit: string;
    file: string;
    uploaded: string;
    altText: string;
    save: string;
    copyUrl: string;
    delete: string;
    saveAltFailed: string;
    deleteConfirm: string;
    uploadPartialFailed: string;
  };
  categoryRow: {
    quickEdit: string;
    delete: string;
    save: string;
    saved: string;
    cancel: string;
    deleteConfirm: string;
  };
};

const nl: AppMessages = {
  home: {
    title: "Welkom bij Pure Therapeutic ART",
    subtitle: "Ontdek opdrachten en content die je stap voor stap ondersteunen.",
    viewContent: "Bekijk content",
    login: "Inloggen",
  },
  login: {
    title: "Inloggen",
    email: "E-mail",
    password: "Wachtwoord",
    submit: "Inloggen",
    mfaTitle: "Bevestig 2FA",
    mfaPrompt: "Vul de code uit je authenticator app in.",
    mfaCode: "2FA-code",
    mfaSubmit: "Verifiëren",
    mfaInvalid: "Ongeldige code. Probeer opnieuw.",
    mfaSetupPrompt:
      "2FA is verplicht voor admins. Stel dit nu in om verder te gaan.",
    mfaSetupContinue: "Ga door naar admin",
  },
  accountPage: {
    title: "Mijn account",
    subtitle: "Beheer je profiel, credits en ontgrendelde content.",
  },
  accountTabs: {
    overview: "Overzicht",
    profile: "Profiel",
    credits: "Credits",
    unlocked: "Ontgrendelde content",
    clients: "Clienten",
    welcome: "Welkom",
    accountType: "Accounttype",
    availableCredits: "Beschikbare credits",
    unlockedItems: "Ontgrendelde items",
    unlockedTitle: "Ontgrendelde content",
    noUnlocked: "Nog geen ontgrendelde content.",
    unknownContent: "Onbekende content",
    titleCol: "Titel",
    categoryCol: "Categorie",
    creditsCol: "Credits",
    dateCol: "Datum",
    therapistTitle: "Clienten",
    therapistDesc: "Dit is de basis voor het therapeut-account. Koppeling van clienten en voortgang kunnen we hierna toevoegen.",
    roleTherapist: "Therapeut",
    roleAdmin: "Beheerder",
    roleClient: "Client",
    roleUser: "Gebruiker",
  },
  accountProfile: {
    saved: "Profiel opgeslagen.",
    saveFailed: "Opslaan mislukt.",
    title: "Profiel",
    email: "E-mail",
    displayName: "Weergavenaam",
    bio: "Biografie",
    save: "Opslaan",
    saving: "Opslaan...",
  },
  userHeader: {
    createdAt: "Aangemaakt",
  },
  userTabs: {
    general: "Algemeen",
    credits: "Credits",
    unlocked: "Ontgrendelde content",
  },
  userGeneral: {
    name: "Naam",
    firstName: "Voornaam",
    lastName: "Achternaam",
    nickname: "Bijnaam",
    displayName: "Weergavenaam",
    contactInfo: "Contactinformatie",
    website: "Website",
    aboutYou: "Over jezelf",
    saveChanges: "Wijzigingen opslaan",
    saving: "Opslaan...",
    accountSecurity: "Account & beveiliging",
  },
  roleEditor: {
    unknownError: "Onbekende fout",
    title: "Gebruikersrol",
    updated: "Rol succesvol bijgewerkt",
    adminWarning: "Admins hebben volledige toegang tot het systeem",
    save: "Rol opslaan",
    saving: "Opslaan...",
    user: "Gebruiker",
    admin: "Admin",
  },
  resetPassword: {
    unknownError: "Onbekende fout",
    title: "Reset wachtwoord",
    updated: "Wachtwoord succesvol aangepast",
    placeholder: "Nieuw wachtwoord (min. 8 tekens)",
    reset: "Reset wachtwoord",
    busy: "Bezig...",
  },
  userCredits: {
    adjustCredits: "Credits aanpassen",
    selfGuard: "Je kunt je eigen credits niet aanpassen.",
    add: "Toevoegen",
    subtract: "Aftrekken",
    yearSubTitle: "Jaarabonnement opdrachten",
    noYearSub: "Geen jaarabonnementen gevonden.",
    start: "Start",
    endLabel: "Einde",
    indefinite: "onbepaald",
    status: "Status",
    active: "actief",
    ended: "beeindigd",
    ending: "Beeindigen...",
    endAction: "Beeindigen",
    adjustFailed: "Credits aanpassen mislukt",
    endFailed: "Abonnement beeindigen mislukt",
  },
  creditOverview: {
    available: "Beschikbare credits",
  },
  creditTransactions: {
    title: "Transacties",
    noTransactions: "Geen transacties gevonden.",
    date: "Datum",
    credits: "Credits",
    reason: "Reden",
  },
  unlockedTable: {
    noUnlocked: "Geen unlocked content.",
    title: "Titel",
    category: "Categorie",
    paid: "Betaald",
    date: "Datum",
    unknownContent: "Onbekende content",
    creditsSuffix: "credits",
  },
  lockedView: {
    scopeAssignment: "opdracht",
    scopeBook: "boek",
    scopeGame: "spel",
    scopeReferral: "verwijsbestand",
    askAccess: "Wil je toegang tot deze {scope}?",
    useCredits: "Je gebruikt hiervoor {scope}-credits.",
    costBalance: "Kosten: {cost} {scope}-credits • Saldo: {balance} {scope}-credits",
    buyCredits: "Credits kopen",
    unlockNow: "Direct ontgrendelen",
    loginToUnlock: "Inloggen om te ontgrendelen",
    unlocking: "Bezig met ontgrendelen...",
    insufficient: "Onvoldoende {scope}-credits. Je saldo is {balance} en je hebt {cost} nodig.",
    unlockFailed: "Er ging iets mis bij het ontgrendelen.",
  },
  metadata: {
    unsavedDeleteConfirm: "Er zijn niet-opgeslagen wijzigingen. Weet je zeker dat je deze content wilt verwijderen?",
    deleteConfirm: "Weet je zeker dat je deze content definitief wilt verwijderen?",
    publish: "Publiceren",
    saving: "Opslaan...",
    saveDraft: "Concept opslaan",
    viewLive: "Bekijk live",
    editStatus: "bewerken",
    ok: "OK",
    cancel: "Annuleren",
    publishDate: "Publicatiedatum",
    creditCost: "Credit kosten",
    update: "Bijwerken",
    publishAction: "Publiceren",
    moveToTrash: "Naar prullenbak",
    permalink: "Permalink",
    noSlug: "(geen-slug)",
    featuredImage: "Uitgelichte afbeelding",
    featuredImageAlt: "Uitgelichte afbeelding",
    altText: "Alt tekst",
    noFeatured: "Nog geen uitgelichte afbeelding gekozen.",
    change: "Wijzigen",
    choose: "Kiezen",
    delete: "Verwijderen",
    close: "Sluiten",
    categories: "Categorieen",
    noCategories: "Geen categorieen gevonden.",
    tags: "Tags",
    noTags: "Geen tags gevonden.",
    excerpt: "Samenvatting",
    excerptPlaceholder: "Korte samenvatting zoals in WordPress excerpt",
    settings: "Instellingen",
    language: "Taal",
    visibilityPublic: "Zichtbaarheid: Openbaar",
    unknownSaveError: "Onbekende fout bij opslaan.",
  },
  mediaLibrary: {
    libraryTab: "Bibliotheek",
    uploadTab: "Nieuw bestand",
    uploadTitle: "Bestanden uploaden",
    chooseFiles: "Kies bestanden",
    dropHint: "Sleep bestanden hierheen of klik op Kies bestanden.",
    multiHint: "Je kunt meerdere afbeeldingen tegelijk uploaden.",
    libraryTitle: "Mediabibliotheek",
    searchPlaceholder: "Zoek op bestandsnaam of alt-tekst",
    loading: "Laden...",
    noneFound: "Geen media gevonden.",
    attachmentDetails: "Bijlagegegevens",
    selectToEdit: "Selecteer een bestand om metadata te bewerken.",
    file: "Bestand",
    uploaded: "Geupload",
    altText: "Alt-tekst",
    save: "Opslaan",
    copyUrl: "URL kopieren",
    delete: "Verwijderen",
    saveAltFailed: "Alt-tekst opslaan mislukt.",
    deleteConfirm: "Weet je zeker dat je dit mediabestand wilt verwijderen?",
    uploadPartialFailed: "{count} bestand(en) zijn geupload naar storage, maar niet aan media_assets toegevoegd.",
  },
  categoryRow: {
    quickEdit: "Snel bewerken",
    delete: "Verwijderen",
    save: "Opslaan...",
    saved: "Opgeslagen",
    cancel: "Annuleren",
    deleteConfirm: "Weet je zeker dat je deze categorie wilt verwijderen?",
  },
};

const en: AppMessages = {
  ...nl,
  home: { title: "Welcome to Pure Therapeutic ART", subtitle: "Discover assignments and content that support you step by step.", viewContent: "View content", login: "Log in" },
  login: {
    title: "Log in",
    email: "Email",
    password: "Password",
    submit: "Log in",
    mfaTitle: "Confirm 2FA",
    mfaPrompt: "Enter the code from your authenticator app.",
    mfaCode: "2FA code",
    mfaSubmit: "Verify",
    mfaInvalid: "Invalid code. Try again.",
    mfaSetupPrompt:
      "2FA is required for admins. Set it up now to continue.",
    mfaSetupContinue: "Continue to admin",
  },
  accountPage: { title: "My account", subtitle: "Manage your profile, credits and unlocked content." },
  accountTabs: { ...nl.accountTabs, overview: "Overview", profile: "Profile", unlocked: "Unlocked content", clients: "Clients", welcome: "Welcome", accountType: "Account type", availableCredits: "Available credits", unlockedItems: "Unlocked items", unlockedTitle: "Unlocked content", noUnlocked: "No unlocked content yet.", unknownContent: "Unknown content", titleCol: "Title", categoryCol: "Category", dateCol: "Date", therapistDesc: "This is the base for the therapist account. We can add client linking and progress next.", roleTherapist: "Therapist", roleAdmin: "Administrator", roleClient: "Client", roleUser: "User" },
  accountProfile: { ...nl.accountProfile, saved: "Profile saved.", saveFailed: "Saving failed.", title: "Profile", displayName: "Display name", bio: "Biography", save: "Save", saving: "Saving..." },
  userHeader: { createdAt: "Created" },
  userTabs: { general: "General", credits: "Credits", unlocked: "Unlocked content" },
  userGeneral: { ...nl.userGeneral, name: "Name", firstName: "First name", lastName: "Last name", nickname: "Nickname", displayName: "Display name", contactInfo: "Contact info", aboutYou: "About you", saveChanges: "Save changes", saving: "Saving...", accountSecurity: "Account & security" },
  roleEditor: { ...nl.roleEditor, unknownError: "Unknown error", title: "User role", updated: "Role updated successfully", adminWarning: "Admins have full access to the system", save: "Save role", saving: "Saving...", user: "User", admin: "Admin" },
  resetPassword: { ...nl.resetPassword, unknownError: "Unknown error", title: "Reset password", updated: "Password updated successfully", placeholder: "New password (min. 8 chars)", reset: "Reset password", busy: "Working..." },
  userCredits: { ...nl.userCredits, adjustCredits: "Adjust credits", selfGuard: "You cannot adjust your own credits.", add: "Add", subtract: "Subtract", yearSubTitle: "Year subscription assignments", noYearSub: "No year subscriptions found.", start: "Start", endLabel: "End", indefinite: "indefinite", status: "Status", active: "active", ended: "ended", ending: "Ending...", endAction: "End", adjustFailed: "Adjusting credits failed", endFailed: "Ending subscription failed" },
  creditOverview: { available: "Available credits" },
  creditTransactions: { title: "Transactions", noTransactions: "No transactions found.", date: "Date", credits: "Credits", reason: "Reason" },
  unlockedTable: { ...nl.unlockedTable, noUnlocked: "No unlocked content.", title: "Title", category: "Category", paid: "Paid", date: "Date", unknownContent: "Unknown content", creditsSuffix: "credits" },
  lockedView: { ...nl.lockedView, scopeAssignment: "assignment", scopeBook: "book", scopeGame: "game", scopeReferral: "referral", askAccess: "Do you want access to this {scope}?", useCredits: "You will use {scope}-credits for this.", costBalance: "Cost: {cost} {scope}-credits • Balance: {balance} {scope}-credits", buyCredits: "Buy credits", unlockNow: "Unlock now", loginToUnlock: "Log in to unlock", unlocking: "Unlocking...", insufficient: "Insufficient {scope}-credits. Your balance is {balance} and you need {cost}.", unlockFailed: "Something went wrong while unlocking." },
  metadata: { ...nl.metadata, unsavedDeleteConfirm: "There are unsaved changes. Are you sure you want to delete this content?", deleteConfirm: "Are you sure you want to permanently delete this content?", publish: "Publish", saving: "Saving...", saveDraft: "Save draft", viewLive: "View live", editStatus: "edit", cancel: "Cancel", publishDate: "Publish date", creditCost: "Credit cost", update: "Update", publishAction: "Publish", moveToTrash: "Move to trash", permalink: "Permalink", noSlug: "(no-slug)", featuredImage: "Featured image", featuredImageAlt: "Featured image", altText: "Alt text", noFeatured: "No featured image selected yet.", change: "Change", choose: "Choose", delete: "Delete", close: "Close", categories: "Categories", noCategories: "No categories found.", noTags: "No tags found.", excerpt: "Excerpt", excerptPlaceholder: "Short summary like WordPress excerpt", settings: "Settings", language: "Language", visibilityPublic: "Visibility: Public", unknownSaveError: "Unknown save error." },
  mediaLibrary: { ...nl.mediaLibrary, libraryTab: "Library", uploadTab: "New file", uploadTitle: "Upload files", chooseFiles: "Choose files", dropHint: "Drop files here or click Choose files.", multiHint: "You can upload multiple images at once.", libraryTitle: "Media library", searchPlaceholder: "Search by filename or alt text", loading: "Loading...", noneFound: "No media found.", attachmentDetails: "Attachment details", selectToEdit: "Select a file to edit metadata.", file: "File", uploaded: "Uploaded", altText: "Alt text", save: "Save", copyUrl: "Copy URL", delete: "Delete", saveAltFailed: "Saving alt text failed.", deleteConfirm: "Are you sure you want to delete this media file?", uploadPartialFailed: "{count} file(s) were uploaded to storage but not inserted into media_assets." },
  categoryRow: { ...nl.categoryRow, quickEdit: "Quick edit", delete: "Delete", save: "Saving...", saved: "Saved", cancel: "Cancel", deleteConfirm: "Are you sure you want to delete this category?" },
};

const de: AppMessages = {
  ...nl,
  home: { title: "Willkommen bei Pure Therapeutic ART", subtitle: "Entdecke Aufgaben und Inhalte, die dich Schritt fur Schritt unterstutzen.", viewContent: "Inhalte ansehen", login: "Anmelden" },
  login: {
    title: "Anmelden",
    email: "E-Mail",
    password: "Passwort",
    submit: "Anmelden",
    mfaTitle: "2FA bestaetigen",
    mfaPrompt: "Code aus der Authenticator-App eingeben.",
    mfaCode: "2FA-Code",
    mfaSubmit: "Bestaetigen",
    mfaInvalid: "Ungueltiger Code. Bitte erneut versuchen.",
    mfaSetupPrompt:
      "2FA ist fuer Admins verpflichtend. Jetzt einrichten, um fortzufahren.",
    mfaSetupContinue: "Weiter zum Admin",
  },
  accountPage: { title: "Mein Konto", subtitle: "Verwalte dein Profil, Credits und freigeschaltete Inhalte." },
  accountTabs: { ...nl.accountTabs, overview: "Ubersicht", profile: "Profil", unlocked: "Freigeschaltete Inhalte", clients: "Klienten", welcome: "Willkommen", accountType: "Kontotyp", availableCredits: "Verfugbare Credits", unlockedItems: "Freigeschaltete Elemente", unlockedTitle: "Freigeschaltete Inhalte", noUnlocked: "Noch keine freigeschalteten Inhalte.", unknownContent: "Unbekannter Inhalt", titleCol: "Titel", categoryCol: "Kategorie", dateCol: "Datum", therapistDesc: "Dies ist die Basis fur das Therapeutenkonto. Verknupfung von Klienten und Fortschritt folgt als nachstes.", roleTherapist: "Therapeut", roleAdmin: "Administrator", roleClient: "Klient", roleUser: "Benutzer" },
  accountProfile: { ...nl.accountProfile, saved: "Profil gespeichert.", saveFailed: "Speichern fehlgeschlagen.", title: "Profil", displayName: "Anzeigename", bio: "Biografie", save: "Speichern", saving: "Speichern..." },
  userHeader: { createdAt: "Erstellt" },
  userTabs: { general: "Allgemein", credits: "Credits", unlocked: "Freigeschaltete Inhalte" },
  userGeneral: { ...nl.userGeneral, name: "Name", firstName: "Vorname", lastName: "Nachname", nickname: "Spitzname", displayName: "Anzeigename", contactInfo: "Kontaktinformationen", aboutYou: "Uber dich", saveChanges: "Anderungen speichern", saving: "Speichern...", accountSecurity: "Konto & Sicherheit" },
  roleEditor: { ...nl.roleEditor, unknownError: "Unbekannter Fehler", title: "Benutzerrolle", updated: "Rolle erfolgreich aktualisiert", adminWarning: "Admins haben vollen Zugriff auf das System", save: "Rolle speichern", saving: "Speichern...", user: "Benutzer", admin: "Admin" },
  resetPassword: { ...nl.resetPassword, unknownError: "Unbekannter Fehler", title: "Passwort zurucksetzen", updated: "Passwort erfolgreich geandert", placeholder: "Neues Passwort (min. 8 Zeichen)", reset: "Passwort zurucksetzen", busy: "In Bearbeitung..." },
  userCredits: { ...nl.userCredits, adjustCredits: "Credits anpassen", selfGuard: "Du kannst deine eigenen Credits nicht anpassen.", add: "Hinzufugen", subtract: "Abziehen", yearSubTitle: "Jahresabo Aufgaben", noYearSub: "Keine Jahresabos gefunden.", start: "Start", endLabel: "Ende", indefinite: "unbegrenzt", status: "Status", active: "aktiv", ended: "beendet", ending: "Beenden...", endAction: "Beenden", adjustFailed: "Credits anpassen fehlgeschlagen", endFailed: "Abo beenden fehlgeschlagen" },
  creditOverview: { available: "Verfugbare Credits" },
  creditTransactions: { title: "Transaktionen", noTransactions: "Keine Transaktionen gefunden.", date: "Datum", credits: "Credits", reason: "Grund" },
  unlockedTable: { ...nl.unlockedTable, noUnlocked: "Keine freigeschalteten Inhalte.", title: "Titel", category: "Kategorie", paid: "Bezahlt", date: "Datum", unknownContent: "Unbekannter Inhalt", creditsSuffix: "credits" },
  lockedView: { ...nl.lockedView, scopeAssignment: "aufgabe", scopeBook: "buch", scopeGame: "spiel", scopeReferral: "verweisdatei", askAccess: "Mochtest du Zugriff auf dieses {scope}?", useCredits: "Dafur verwendest du {scope}-credits.", costBalance: "Kosten: {cost} {scope}-credits • Guthaben: {balance} {scope}-credits", buyCredits: "Credits kaufen", unlockNow: "Direkt freischalten", loginToUnlock: "Zum Freischalten anmelden", unlocking: "Wird freigeschaltet...", insufficient: "Nicht genug {scope}-credits. Dein Guthaben ist {balance}, benotigt: {cost}.", unlockFailed: "Beim Freischalten ist ein Fehler aufgetreten." },
  metadata: { ...nl.metadata, unsavedDeleteConfirm: "Es gibt ungespeicherte Anderungen. Inhalt wirklich loschen?", deleteConfirm: "Diesen Inhalt wirklich dauerhaft loschen?", publish: "Veroffentlichen", saveDraft: "Entwurf speichern", viewLive: "Live ansehen", editStatus: "bearbeiten", cancel: "Abbrechen", publishDate: "Veroffentlichungsdatum", creditCost: "Credit-Kosten", update: "Aktualisieren", publishAction: "Veroffentlichen", moveToTrash: "In Papierkorb", noSlug: "(kein-slug)", featuredImage: "Beitragsbild", featuredImageAlt: "Beitragsbild", altText: "Alt-Text", noFeatured: "Noch kein Beitragsbild ausgewahlt.", change: "Andern", choose: "Wahlen", delete: "Loschen", close: "Schliessen", categories: "Kategorien", noCategories: "Keine Kategorien gefunden.", noTags: "Keine Tags gefunden.", excerpt: "Zusammenfassung", excerptPlaceholder: "Kurze Zusammenfassung wie WordPress Excerpt", settings: "Einstellungen", language: "Sprache", visibilityPublic: "Sichtbarkeit: Offentlich", unknownSaveError: "Unbekannter Fehler beim Speichern." },
  mediaLibrary: { ...nl.mediaLibrary, libraryTab: "Bibliothek", uploadTab: "Neue Datei", uploadTitle: "Dateien hochladen", chooseFiles: "Dateien auswahlen", dropHint: "Dateien hierher ziehen oder auf Dateien auswahlen klicken.", multiHint: "Du kannst mehrere Bilder gleichzeitig hochladen.", libraryTitle: "Mediathek", searchPlaceholder: "Nach Dateiname oder Alt-Text suchen", loading: "Laden...", noneFound: "Keine Medien gefunden.", attachmentDetails: "Anhangdetails", selectToEdit: "Wahle eine Datei, um Metadaten zu bearbeiten.", file: "Datei", uploaded: "Hochgeladen", altText: "Alt-Text", save: "Speichern", copyUrl: "URL kopieren", delete: "Loschen", saveAltFailed: "Alt-Text speichern fehlgeschlagen.", deleteConfirm: "Mochtest du diese Mediendatei wirklich loschen?", uploadPartialFailed: "{count} Datei(en) wurden in Storage hochgeladen, aber nicht in media_assets gespeichert." },
  categoryRow: { ...nl.categoryRow, quickEdit: "Schnell bearbeiten", delete: "Loschen", save: "Speichern...", saved: "Gespeichert", cancel: "Abbrechen", deleteConfirm: "Mochtest du diese Kategorie wirklich loschen?" },
};

export function getAppMessages(language: UiLanguage): AppMessages {
  if (language === "en") return en;
  if (language === "de") return de;
  return nl;
}
