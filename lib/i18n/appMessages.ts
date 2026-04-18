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
    modeLogin: string;
    modeRegister: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    accountType: string;
    accountTypeClient: string;
    accountTypeTherapist: string;
    submit: string;
    forgotPassword: string;
    forgotTitle: string;
    forgotIntro: string;
    forgotSubmit: string;
    forgotSent: string;
    forgotFailed: string;
    backToLogin: string;
    registerTitle: string;
    registerSubmit: string;
    registerSuccess: string;
    registerFailed: string;
    mfaTitle: string;
    mfaPrompt: string;
    mfaCode: string;
    mfaSubmit: string;
    mfaInvalid: string;
    mfaSetupPrompt: string;
    mfaSetupContinue: string;
    resetTitle: string;
    resetIntro: string;
    resetLoading: string;
    resetInvalid: string;
    resetMismatch: string;
    resetSubmit: string;
    resetSubmitBusy: string;
    resetSuccess: string;
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
    avatar: string;
    avatarUpload: string;
    avatarUploading: string;
    avatarRemove: string;
    avatarUploaded: string;
    avatarUploadFailed: string;
    avatarHint: string;
    avatarEmpty: string;
    displayName: string;
    bio: string;
    save: string;
    saving: string;
    cancel: string;
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
    accountType: string;
    accountTypeUser: string;
    accountTypeClient: string;
    accountTypeTherapist: string;
    contactInfo: string;
    website: string;
    aboutYou: string;
    therapistDetails: string;
    publicDirectory: string;
    publicDirectoryHint: string;
    professionalTitle: string;
    shortIntro: string;
    practiceName: string;
    registrationNumber: string;
    publicEmail: string;
    phone: string;
    city: string;
    region: string;
    location: string;
    onlineAvailable: string;
    inPersonAvailable: string;
    acceptingNewClients: string;
    specializations: string;
    targetGroups: string;
    languages: string;
    methods: string;
    yearsExperience: string;
    intakeNote: string;
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
    therapistSubTitle: string;
    noTherapistSub: string;
    start: string;
    endLabel: string;
    activeUntil: string;
    renewedUntil: string;
    indefinite: string;
    notScheduled: string;
    status: string;
    active: string;
    planned: string;
    ended: string;
    directoryVisibility: string;
    visibleInDirectory: string;
    hiddenInDirectory: string;
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
    accordionContent: string;
    accordionDescription: string;
    addAccordionItem: string;
    accordionItemTitle: string;
    accordionItemTitlePlaceholder: string;
    accordionEmpty: string;
    removeAccordionItem: string;
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
    uploadFailed: string;
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
    modeLogin: "Inloggen",
    modeRegister: "Aanmelden",
    email: "E-mail",
    password: "Wachtwoord",
    confirmPassword: "Bevestig wachtwoord",
    firstName: "Voornaam",
    lastName: "Achternaam",
    accountType: "Ik meld me aan als",
    accountTypeClient: "Gebruiker (client)",
    accountTypeTherapist: "Therapeut",
    submit: "Inloggen",
    forgotPassword: "Wachtwoord vergeten?",
    forgotTitle: "Wachtwoord herstellen",
    forgotIntro:
      "Vul je e-mailadres in. Als er een account bestaat, sturen we je direct een herstelmail.",
    forgotSubmit: "Stuur herstelmail",
    forgotSent:
      "Als er een account bestaat voor dit e-mailadres, staat er nu een herstelmail voor je klaar.",
    forgotFailed:
      "Het versturen van de herstelmail is mislukt. Probeer het opnieuw.",
    backToLogin: "Terug naar inloggen",
    registerTitle: "Account aanmaken",
    registerSubmit: "Account aanmaken",
    registerSuccess:
      "Je account is aangemaakt. Log in of controleer je e-mail als bevestiging nodig is.",
    registerFailed: "Aanmelden mislukt. Controleer je gegevens en probeer opnieuw.",
    mfaTitle: "Bevestig 2FA",
    mfaPrompt: "Vul de code uit je authenticator app in.",
    mfaCode: "2FA-code",
    mfaSubmit: "Verifiëren",
    mfaInvalid: "Ongeldige code. Probeer opnieuw.",
    mfaSetupPrompt:
      "2FA is verplicht voor admins. Stel dit nu in om verder te gaan.",
    mfaSetupContinue: "Ga door naar admin",
    resetTitle: "Nieuw wachtwoord kiezen",
    resetIntro:
      "Kies een nieuw wachtwoord voor je account. Daarna kun je weer normaal inloggen.",
    resetLoading: "Herstel-link controleren...",
    resetInvalid:
      "Deze herstel-link is ongeldig of verlopen. Vraag opnieuw een wachtwoordreset aan.",
    resetMismatch: "De wachtwoorden komen niet overeen.",
    resetSubmit: "Nieuw wachtwoord opslaan",
    resetSubmitBusy: "Bezig met opslaan...",
    resetSuccess:
      "Je wachtwoord is bijgewerkt. Je kunt nu inloggen met je nieuwe wachtwoord.",
  },
  accountPage: {
    title: "Mijn account",
    subtitle: "Beheer je profiel, credits en ontgrendelde content.",
  },
  accountTabs: {
    overview: "Overzicht",
    profile: "Profiel bewerken",
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
    avatar: "Profielfoto",
    avatarUpload: "Foto uploaden",
    avatarUploading: "Foto uploaden...",
    avatarRemove: "Foto verwijderen",
    avatarUploaded: "Foto geupload. Sla je profiel op om deze te bewaren.",
    avatarUploadFailed: "Uploaden van de profielfoto mislukt.",
    avatarHint: "Upload een vierkante of staande afbeelding voor je profiel.",
    avatarEmpty: "Geen foto",
    displayName: "Weergavenaam",
    bio: "Biografie",
    save: "Opslaan",
    saving: "Opslaan...",
    cancel: "Annuleren",
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
    accountType: "Accounttype",
    accountTypeUser: "Gebruiker",
    accountTypeClient: "Client",
    accountTypeTherapist: "Therapeut",
    contactInfo: "Contactinformatie",
    website: "Website",
    aboutYou: "Over jezelf",
    therapistDetails: "Therapeutgegevens",
    publicDirectory: "Toon in therapeutenoverzicht",
    publicDirectoryHint:
      "Zet dit aan als clienten je publieke profiel mogen zien in het therapeutenoverzicht.",
    professionalTitle: "Functietitel",
    shortIntro: "Korte introductie",
    practiceName: "Praktijknaam",
    registrationNumber: "Registratienummer",
    publicEmail: "Publiek e-mailadres",
    phone: "Telefoon",
    city: "Plaats",
    region: "Regio",
    location: "Locatie",
    onlineAvailable: "Online sessies mogelijk",
    inPersonAvailable: "Fysieke sessies mogelijk",
    acceptingNewClients: "Neemt nieuwe clienten aan",
    specializations: "Beroepen",
    targetGroups: "Doelgroepen",
    languages: "Talen",
    methods: "Methodieken",
    yearsExperience: "Jaren ervaring",
    intakeNote: "Intake of beschikbaarheid",
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
    therapistSubTitle: "Therapeutenlijst abonnement",
    noTherapistSub: "Geen therapeut-abonnementen gevonden.",
    start: "Start",
    endLabel: "Einde",
    activeUntil: "Actief tot",
    renewedUntil: "Verlengd t/m",
    indefinite: "onbepaald",
    notScheduled: "niet ingepland",
    status: "Status",
    active: "actief",
    planned: "ingepland",
    ended: "beeindigd",
    directoryVisibility: "Zichtbaar in therapeutenlijst",
    visibleInDirectory: "ja",
    hiddenInDirectory: "nee",
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
    accordionContent: "Accordion content",
    accordionDescription:
      "Voeg uitklapbare secties toe die onder de hoofdcontent van dit item verschijnen.",
    addAccordionItem: "Accordion-item toevoegen",
    accordionItemTitle: "Titel",
    accordionItemTitlePlaceholder: "Bijvoorbeeld: Veelgestelde vragen",
    accordionEmpty: "Nog geen accordion-items toegevoegd.",
    removeAccordionItem: "Item verwijderen",
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
    multiHint: "Je kunt meerdere bestanden tegelijk uploaden.",
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
    uploadFailed: "{count} bestand(en) konden niet worden geupload.",
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
    modeLogin: "Log in",
    modeRegister: "Register",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    firstName: "First name",
    lastName: "Last name",
    accountType: "I am registering as",
    accountTypeClient: "User (client)",
    accountTypeTherapist: "Therapist",
    submit: "Log in",
    forgotPassword: "Forgot password?",
    forgotTitle: "Reset password",
    forgotIntro:
      "Enter your email address. If an account exists, we will send a recovery email right away.",
    forgotSubmit: "Send recovery email",
    forgotSent:
      "If an account exists for this email address, a recovery email is on its way.",
    forgotFailed:
      "Sending the recovery email failed. Please try again.",
    backToLogin: "Back to login",
    registerTitle: "Create account",
    registerSubmit: "Create account",
    registerSuccess:
      "Your account was created. Log in or check your email if confirmation is required.",
    registerFailed: "Registration failed. Check your details and try again.",
    mfaTitle: "Confirm 2FA",
    mfaPrompt: "Enter the code from your authenticator app.",
    mfaCode: "2FA code",
    mfaSubmit: "Verify",
    mfaInvalid: "Invalid code. Try again.",
    mfaSetupPrompt:
      "2FA is required for admins. Set it up now to continue.",
    mfaSetupContinue: "Continue to admin",
    resetTitle: "Choose a new password",
    resetIntro:
      "Set a new password for your account. After that you can log in normally again.",
    resetLoading: "Checking recovery link...",
    resetInvalid:
      "This recovery link is invalid or expired. Request a new password reset.",
    resetMismatch: "The passwords do not match.",
    resetSubmit: "Save new password",
    resetSubmitBusy: "Saving...",
    resetSuccess:
      "Your password has been updated. You can now log in with your new password.",
  },
  accountPage: { title: "My account", subtitle: "Manage your profile, credits and unlocked content." },
  accountTabs: { ...nl.accountTabs, overview: "Overview", profile: "Edit profile", unlocked: "Unlocked content", clients: "Clients", welcome: "Welcome", accountType: "Account type", availableCredits: "Available credits", unlockedItems: "Unlocked items", unlockedTitle: "Unlocked content", noUnlocked: "No unlocked content yet.", unknownContent: "Unknown content", titleCol: "Title", categoryCol: "Category", dateCol: "Date", therapistDesc: "This is the base for the therapist account. We can add client linking and progress next.", roleTherapist: "Therapist", roleAdmin: "Administrator", roleClient: "Client", roleUser: "User" },
  accountProfile: { ...nl.accountProfile, saved: "Profile saved.", saveFailed: "Saving failed.", title: "Profile", avatar: "Profile photo", avatarUpload: "Upload photo", avatarUploading: "Uploading photo...", avatarRemove: "Remove photo", avatarUploaded: "Photo uploaded. Save your profile to keep it.", avatarUploadFailed: "Uploading the profile photo failed.", avatarHint: "Upload a square or portrait image for your profile.", avatarEmpty: "No photo", displayName: "Display name", bio: "Biography", save: "Save", saving: "Saving...", cancel: "Cancel" },
  userHeader: { createdAt: "Created" },
  userTabs: { general: "General", credits: "Credits", unlocked: "Unlocked content" },
  userGeneral: { ...nl.userGeneral, name: "Name", firstName: "First name", lastName: "Last name", nickname: "Nickname", displayName: "Display name", accountType: "Account type", accountTypeUser: "User", accountTypeClient: "Client", accountTypeTherapist: "Therapist", contactInfo: "Contact info", aboutYou: "About you", therapistDetails: "Therapist details", publicDirectory: "Show in therapist directory", publicDirectoryHint: "Enable this if clients may see your public profile in the therapist directory.", professionalTitle: "Professional title", shortIntro: "Short introduction", practiceName: "Practice name", registrationNumber: "Registration number", publicEmail: "Public email address", phone: "Phone", city: "City", region: "Region", location: "Location", onlineAvailable: "Offers online sessions", inPersonAvailable: "Offers in-person sessions", acceptingNewClients: "Accepting new clients", specializations: "Professions", targetGroups: "Target groups", languages: "Languages", methods: "Methods", yearsExperience: "Years of experience", intakeNote: "Intake or availability", saveChanges: "Save changes", saving: "Saving...", accountSecurity: "Account & security" },
  roleEditor: { ...nl.roleEditor, unknownError: "Unknown error", title: "User role", updated: "Role updated successfully", adminWarning: "Admins have full access to the system", save: "Save role", saving: "Saving...", user: "User", admin: "Admin" },
  resetPassword: { ...nl.resetPassword, unknownError: "Unknown error", title: "Reset password", updated: "Password updated successfully", placeholder: "New password (min. 8 chars)", reset: "Reset password", busy: "Working..." },
  userCredits: { ...nl.userCredits, adjustCredits: "Adjust credits", selfGuard: "You cannot adjust your own credits.", add: "Add", subtract: "Subtract", yearSubTitle: "Year subscription assignments", noYearSub: "No year subscriptions found.", therapistSubTitle: "Therapist directory subscription", noTherapistSub: "No therapist subscriptions found.", start: "Start", endLabel: "End", activeUntil: "Active until", renewedUntil: "Renewed until", indefinite: "indefinite", notScheduled: "not scheduled", status: "Status", active: "active", planned: "planned", ended: "ended", directoryVisibility: "Visible in therapist directory", visibleInDirectory: "yes", hiddenInDirectory: "no", ending: "Ending...", endAction: "End", adjustFailed: "Adjusting credits failed", endFailed: "Ending subscription failed" },
  creditOverview: { available: "Available credits" },
  creditTransactions: { title: "Transactions", noTransactions: "No transactions found.", date: "Date", credits: "Credits", reason: "Reason" },
  unlockedTable: { ...nl.unlockedTable, noUnlocked: "No unlocked content.", title: "Title", category: "Category", paid: "Paid", date: "Date", unknownContent: "Unknown content", creditsSuffix: "credits" },
  lockedView: { ...nl.lockedView, scopeAssignment: "assignment", scopeBook: "book", scopeGame: "game", scopeReferral: "referral", askAccess: "Do you want access to this {scope}?", useCredits: "You will use {scope}-credits for this.", costBalance: "Cost: {cost} {scope}-credits • Balance: {balance} {scope}-credits", buyCredits: "Buy credits", unlockNow: "Unlock now", loginToUnlock: "Log in to unlock", unlocking: "Unlocking...", insufficient: "Insufficient {scope}-credits. Your balance is {balance} and you need {cost}.", unlockFailed: "Something went wrong while unlocking." },
  metadata: { ...nl.metadata, unsavedDeleteConfirm: "There are unsaved changes. Are you sure you want to delete this content?", deleteConfirm: "Are you sure you want to permanently delete this content?", publish: "Publish", saving: "Saving...", saveDraft: "Save draft", viewLive: "View live", editStatus: "edit", cancel: "Cancel", publishDate: "Publish date", creditCost: "Credit cost", update: "Update", publishAction: "Publish", moveToTrash: "Move to trash", permalink: "Permalink", noSlug: "(no-slug)", featuredImage: "Featured image", featuredImageAlt: "Featured image", altText: "Alt text", noFeatured: "No featured image selected yet.", change: "Change", choose: "Choose", delete: "Delete", close: "Close", categories: "Categories", noCategories: "No categories found.", noTags: "No tags found.", excerpt: "Excerpt", excerptPlaceholder: "Short summary like WordPress excerpt", accordionContent: "Accordion content", accordionDescription: "Add expandable sections that appear below the main content of this item.", addAccordionItem: "Add accordion item", accordionItemTitle: "Title", accordionItemTitlePlaceholder: "For example: Frequently asked questions", accordionEmpty: "No accordion items added yet.", removeAccordionItem: "Remove item", settings: "Settings", language: "Language", visibilityPublic: "Visibility: Public", unknownSaveError: "Unknown save error." },
  mediaLibrary: { ...nl.mediaLibrary, libraryTab: "Library", uploadTab: "New file", uploadTitle: "Upload files", chooseFiles: "Choose files", dropHint: "Drop files here or click Choose files.", multiHint: "You can upload multiple files at once.", libraryTitle: "Media library", searchPlaceholder: "Search by filename or alt text", loading: "Loading...", noneFound: "No media found.", attachmentDetails: "Attachment details", selectToEdit: "Select a file to edit metadata.", file: "File", uploaded: "Uploaded", altText: "Alt text", save: "Save", copyUrl: "Copy URL", delete: "Delete", saveAltFailed: "Saving alt text failed.", deleteConfirm: "Are you sure you want to delete this media file?", uploadFailed: "{count} file(s) could not be uploaded.", uploadPartialFailed: "{count} file(s) were uploaded to storage but not inserted into media_assets." },
  categoryRow: { ...nl.categoryRow, quickEdit: "Quick edit", delete: "Delete", save: "Saving...", saved: "Saved", cancel: "Cancel", deleteConfirm: "Are you sure you want to delete this category?" },
};

const de: AppMessages = {
  ...nl,
  home: { title: "Willkommen bei Pure Therapeutic ART", subtitle: "Entdecke Aufgaben und Inhalte, die dich Schritt fur Schritt unterstutzen.", viewContent: "Inhalte ansehen", login: "Anmelden" },
  login: {
    title: "Anmelden",
    modeLogin: "Anmelden",
    modeRegister: "Registrieren",
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestaetigen",
    firstName: "Vorname",
    lastName: "Nachname",
    accountType: "Ich registriere mich als",
    accountTypeClient: "Benutzer (Klient)",
    accountTypeTherapist: "Therapeut",
    submit: "Anmelden",
    forgotPassword: "Passwort vergessen?",
    forgotTitle: "Passwort zurucksetzen",
    forgotIntro:
      "Gib deine E-Mail-Adresse ein. Wenn ein Konto existiert, senden wir dir sofort eine Wiederherstellungs-E-Mail.",
    forgotSubmit: "Wiederherstellungs-E-Mail senden",
    forgotSent:
      "Wenn fur diese E-Mail-Adresse ein Konto existiert, wurde eine Wiederherstellungs-E-Mail versendet.",
    forgotFailed:
      "Die Wiederherstellungs-E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.",
    backToLogin: "Zuruck zum Login",
    registerTitle: "Konto erstellen",
    registerSubmit: "Konto erstellen",
    registerSuccess:
      "Dein Konto wurde erstellt. Melde dich an oder pruefe deine E-Mail, falls eine Bestatigung erforderlich ist.",
    registerFailed:
      "Registrierung fehlgeschlagen. Bitte prufe deine Angaben und versuche es erneut.",
    mfaTitle: "2FA bestaetigen",
    mfaPrompt: "Code aus der Authenticator-App eingeben.",
    mfaCode: "2FA-Code",
    mfaSubmit: "Bestaetigen",
    mfaInvalid: "Ungueltiger Code. Bitte erneut versuchen.",
    mfaSetupPrompt:
      "2FA ist fuer Admins verpflichtend. Jetzt einrichten, um fortzufahren.",
    mfaSetupContinue: "Weiter zum Admin",
    resetTitle: "Neues Passwort festlegen",
    resetIntro:
      "Lege ein neues Passwort fur dein Konto fest. Danach kannst du dich wieder normal anmelden.",
    resetLoading: "Wiederherstellungs-Link wird gepruft...",
    resetInvalid:
      "Dieser Wiederherstellungs-Link ist ungueltig oder abgelaufen. Bitte fordere einen neuen Passwort-Reset an.",
    resetMismatch: "Die Passwoerter stimmen nicht ueberein.",
    resetSubmit: "Neues Passwort speichern",
    resetSubmitBusy: "Speichern...",
    resetSuccess:
      "Dein Passwort wurde aktualisiert. Du kannst dich jetzt mit dem neuen Passwort anmelden.",
  },
  accountPage: { title: "Mein Konto", subtitle: "Verwalte dein Profil, Credits und freigeschaltete Inhalte." },
  accountTabs: { ...nl.accountTabs, overview: "Ubersicht", profile: "Profil bearbeiten", unlocked: "Freigeschaltete Inhalte", clients: "Klienten", welcome: "Willkommen", accountType: "Kontotyp", availableCredits: "Verfugbare Credits", unlockedItems: "Freigeschaltete Elemente", unlockedTitle: "Freigeschaltete Inhalte", noUnlocked: "Noch keine freigeschalteten Inhalte.", unknownContent: "Unbekannter Inhalt", titleCol: "Titel", categoryCol: "Kategorie", dateCol: "Datum", therapistDesc: "Dies ist die Basis fur das Therapeutenkonto. Verknupfung von Klienten und Fortschritt folgt als nachstes.", roleTherapist: "Therapeut", roleAdmin: "Administrator", roleClient: "Klient", roleUser: "Benutzer" },
  accountProfile: { ...nl.accountProfile, saved: "Profil gespeichert.", saveFailed: "Speichern fehlgeschlagen.", title: "Profil", avatar: "Profilfoto", avatarUpload: "Foto hochladen", avatarUploading: "Foto wird hochgeladen...", avatarRemove: "Foto entfernen", avatarUploaded: "Foto hochgeladen. Speichere dein Profil, um es zu behalten.", avatarUploadFailed: "Das Hochladen des Profilfotos ist fehlgeschlagen.", avatarHint: "Lade ein quadratisches oder hochformatiges Bild fur dein Profil hoch.", avatarEmpty: "Kein Foto", displayName: "Anzeigename", bio: "Biografie", save: "Speichern", saving: "Speichern...", cancel: "Abbrechen" },
  userHeader: { createdAt: "Erstellt" },
  userTabs: { general: "Allgemein", credits: "Credits", unlocked: "Freigeschaltete Inhalte" },
  userGeneral: { ...nl.userGeneral, name: "Name", firstName: "Vorname", lastName: "Nachname", nickname: "Spitzname", displayName: "Anzeigename", accountType: "Kontotyp", accountTypeUser: "Benutzer", accountTypeClient: "Klient", accountTypeTherapist: "Therapeut", contactInfo: "Kontaktinformationen", aboutYou: "Uber dich", therapistDetails: "Therapeutendaten", publicDirectory: "Im Therapeutenverzeichnis anzeigen", publicDirectoryHint: "Aktiviere dies, wenn Klienten dein offentliches Profil im Therapeutenverzeichnis sehen durfen.", professionalTitle: "Berufsbezeichnung", shortIntro: "Kurze Einfuhrung", practiceName: "Praxisname", registrationNumber: "Registrierungsnummer", publicEmail: "Offentliche E-Mail-Adresse", phone: "Telefon", city: "Ort", region: "Region", location: "Standort", onlineAvailable: "Online-Sitzungen moglich", inPersonAvailable: "Vor-Ort-Sitzungen moglich", acceptingNewClients: "Nimmt neue Klienten an", specializations: "Berufe", targetGroups: "Zielgruppen", languages: "Sprachen", methods: "Methoden", yearsExperience: "Jahre Erfahrung", intakeNote: "Intake oder Verfugbarkeit", saveChanges: "Anderungen speichern", saving: "Speichern...", accountSecurity: "Konto & Sicherheit" },
  roleEditor: { ...nl.roleEditor, unknownError: "Unbekannter Fehler", title: "Benutzerrolle", updated: "Rolle erfolgreich aktualisiert", adminWarning: "Admins haben vollen Zugriff auf das System", save: "Rolle speichern", saving: "Speichern...", user: "Benutzer", admin: "Admin" },
  resetPassword: { ...nl.resetPassword, unknownError: "Unbekannter Fehler", title: "Passwort zurucksetzen", updated: "Passwort erfolgreich geandert", placeholder: "Neues Passwort (min. 8 Zeichen)", reset: "Passwort zurucksetzen", busy: "In Bearbeitung..." },
  userCredits: { ...nl.userCredits, adjustCredits: "Credits anpassen", selfGuard: "Du kannst deine eigenen Credits nicht anpassen.", add: "Hinzufugen", subtract: "Abziehen", yearSubTitle: "Jahresabo Aufgaben", noYearSub: "Keine Jahresabos gefunden.", therapistSubTitle: "Therapeutenverzeichnis-Abo", noTherapistSub: "Keine Therapeuten-Abos gefunden.", start: "Start", endLabel: "Ende", activeUntil: "Aktiv bis", renewedUntil: "Verlangert bis", indefinite: "unbegrenzt", notScheduled: "nicht geplant", status: "Status", active: "aktiv", planned: "geplant", ended: "beendet", directoryVisibility: "Im Therapeutenverzeichnis sichtbar", visibleInDirectory: "ja", hiddenInDirectory: "nein", ending: "Beenden...", endAction: "Beenden", adjustFailed: "Credits anpassen fehlgeschlagen", endFailed: "Abo beenden fehlgeschlagen" },
  creditOverview: { available: "Verfugbare Credits" },
  creditTransactions: { title: "Transaktionen", noTransactions: "Keine Transaktionen gefunden.", date: "Datum", credits: "Credits", reason: "Grund" },
  unlockedTable: { ...nl.unlockedTable, noUnlocked: "Keine freigeschalteten Inhalte.", title: "Titel", category: "Kategorie", paid: "Bezahlt", date: "Datum", unknownContent: "Unbekannter Inhalt", creditsSuffix: "credits" },
  lockedView: { ...nl.lockedView, scopeAssignment: "aufgabe", scopeBook: "buch", scopeGame: "spiel", scopeReferral: "verweisdatei", askAccess: "Mochtest du Zugriff auf dieses {scope}?", useCredits: "Dafur verwendest du {scope}-credits.", costBalance: "Kosten: {cost} {scope}-credits • Guthaben: {balance} {scope}-credits", buyCredits: "Credits kaufen", unlockNow: "Direkt freischalten", loginToUnlock: "Zum Freischalten anmelden", unlocking: "Wird freigeschaltet...", insufficient: "Nicht genug {scope}-credits. Dein Guthaben ist {balance}, benotigt: {cost}.", unlockFailed: "Beim Freischalten ist ein Fehler aufgetreten." },
  metadata: { ...nl.metadata, unsavedDeleteConfirm: "Es gibt ungespeicherte Anderungen. Inhalt wirklich loschen?", deleteConfirm: "Diesen Inhalt wirklich dauerhaft loschen?", publish: "Veroffentlichen", saveDraft: "Entwurf speichern", viewLive: "Live ansehen", editStatus: "bearbeiten", cancel: "Abbrechen", publishDate: "Veroffentlichungsdatum", creditCost: "Credit-Kosten", update: "Aktualisieren", publishAction: "Veroffentlichen", moveToTrash: "In Papierkorb", noSlug: "(kein-slug)", featuredImage: "Beitragsbild", featuredImageAlt: "Beitragsbild", altText: "Alt-Text", noFeatured: "Noch kein Beitragsbild ausgewahlt.", change: "Andern", choose: "Wahlen", delete: "Loschen", close: "Schliessen", categories: "Kategorien", noCategories: "Keine Kategorien gefunden.", noTags: "Keine Tags gefunden.", excerpt: "Zusammenfassung", excerptPlaceholder: "Kurze Zusammenfassung wie WordPress Excerpt", accordionContent: "Accordion-Inhalt", accordionDescription: "Fuge ausklappbare Bereiche hinzu, die unter dem Hauptinhalt dieses Elements erscheinen.", addAccordionItem: "Accordion-Element hinzufugen", accordionItemTitle: "Titel", accordionItemTitlePlaceholder: "Zum Beispiel: Haufig gestellte Fragen", accordionEmpty: "Noch keine Accordion-Elemente hinzugefugt.", removeAccordionItem: "Element entfernen", settings: "Einstellungen", language: "Sprache", visibilityPublic: "Sichtbarkeit: Offentlich", unknownSaveError: "Unbekannter Fehler beim Speichern." },
  mediaLibrary: { ...nl.mediaLibrary, libraryTab: "Bibliothek", uploadTab: "Neue Datei", uploadTitle: "Dateien hochladen", chooseFiles: "Dateien auswahlen", dropHint: "Dateien hierher ziehen oder auf Dateien auswahlen klicken.", multiHint: "Du kannst mehrere Dateien gleichzeitig hochladen.", libraryTitle: "Mediathek", searchPlaceholder: "Nach Dateiname oder Alt-Text suchen", loading: "Laden...", noneFound: "Keine Medien gefunden.", attachmentDetails: "Anhangdetails", selectToEdit: "Wahle eine Datei, um Metadaten zu bearbeiten.", file: "Datei", uploaded: "Hochgeladen", altText: "Alt-Text", save: "Speichern", copyUrl: "URL kopieren", delete: "Loschen", saveAltFailed: "Alt-Text speichern fehlgeschlagen.", deleteConfirm: "Mochtest du diese Mediendatei wirklich loschen?", uploadFailed: "{count} Datei(en) konnten nicht hochgeladen werden.", uploadPartialFailed: "{count} Datei(en) wurden in Storage hochgeladen, aber nicht in media_assets gespeichert." },
  categoryRow: { ...nl.categoryRow, quickEdit: "Schnell bearbeiten", delete: "Loschen", save: "Speichern...", saved: "Gespeichert", cancel: "Abbrechen", deleteConfirm: "Mochtest du diese Kategorie wirklich loschen?" },
};

export function getAppMessages(language: UiLanguage): AppMessages {
  if (language === "en") return en;
  if (language === "de") return de;
  return nl;
}
