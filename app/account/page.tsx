import Link from "next/link";
import { Download, type LucideIcon } from "lucide-react";
import PublicAppShell from "@/components/public/PublicAppShell";
import AppLogoutButton from "@/components/account/AppLogoutButton";
import AccountPanelAutoScroll from "@/components/account/AccountPanelAutoScroll";
import AccountProfileForm from "@/components/account/AccountProfileForm";
import LanguagePreferenceDialog from "@/components/account/LanguagePreferenceDialog";
import ThemeProgressGrid from "@/components/account/ThemeProgressGrid";
import { login } from "@/components/login/actions";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage, type UiLanguage } from "@/lib/i18n/runtime";
import { getUserProgressCollections } from "@/lib/content/progress";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAccountContentProductsData } from "@/lib/account/content-products";
import {
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
  getTimedEntitlementSummary,
} from "@/lib/users/entitlements";
import {
  type AppProfileData,
  getEffectiveAccountType,
  getProfileAccountType,
  getTherapistProfileData,
} from "@/lib/users/accountTypes";
import { setMySubscriptionCancellationPreference } from "@/app/account/actions";

type AccountSearchParams = {
  error?: string | string[];
  tab?: string | string[];
  panel?: string | string[];
};

type ProfileRow = {
  display_name: string | null;
  role?: string | null;
  profile_data?: AppProfileData | null;
};

type WalletRow = {
  credits_available: number | null;
};

type TherapistEntitlementRow = {
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function accountCardClassName() {
  return "rounded-2xl border border-[#e5dbcf] bg-[#f7f0e9] p-3";
}

type ContentProductsMessages = {
  title: string;
  purchases: string;
  ebooks: string;
  subscriptions: string;
  language: string;
  security: string;
  logbook: string;
  purchasesTitle: string;
  purchasesSubtitle: string;
  purchasesEmpty: string;
  websiteSyncNotice: string;
  ebooksTitle: string;
  ebooksSubtitle: string;
  ebooksEmpty: string;
  ebooksRead: string;
  ebooksSecurity: string;
  subscriptionsTitle: string;
  subscriptionsSubtitle: string;
  subscriptionsEmpty: string;
  subscriptionsExtend: string;
  subscriptionsCancel: string;
  subscriptionsResume: string;
  subscriptionsCancelled: string;
  subscriptionsActiveUntil: string;
  subscriptionsStartsAt: string;
  subscriptionsAmount: string;
  statusActive: string;
  statusPlanned: string;
  statusEnded: string;
  securityTitle: string;
  securitySubtitle: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  termsTitle: string;
  termsBody: string;
  privacyTitle: string;
  privacyBody: string;
  impressumTitle: string;
  impressumBody: string;
  copyrightTitle: string;
  copyrightBody: string;
  dialogTitle: string;
  dialogSubtitle: string;
  dialogSave: string;
  dialogSaving: string;
  openedAt: string;
  purchaseGroupCredits: string;
  purchaseGroupSubscriptions: string;
  purchaseGroupOther: string;
  purchaseSingular: string;
  purchasePlural: string;
};

type ContentProductsRow = {
  label: string;
  href?: string;
  icon?: LucideIcon;
};

type ActiveAccountPanel = "purchases" | "ebooks" | "subscriptions" | "security" | null;

function buildContentHref(slug: string | null) {
  return slug ? `/content/${slug}` : null;
}

function getTrajectoryMessages(language: UiLanguage) {
  if (language === "en") {
    return {
      title: "My journey",
      subtitle: "See which unlocked chapters are waiting, which ones you can continue, and what you already completed.",
      themes: "Themes",
      inProgress: "Continue",
      unlocked: "My chapters",
      completed: "Completed",
      recent: "Recently viewed",
      noThemes: "You have no unlocked themes yet.",
      unavailable: "Progress tracking is not available yet. Your unlocked chapters are shown below.",
      noInProgress: "You have no unlocked chapters to continue yet.",
      noUnlocked: "You have not unlocked any chapters yet.",
      noCompleted: "You have not completed any chapters yet.",
      noRecent: "No recently viewed content yet.",
      noCategory: "No category",
      chapterSingular: "chapter",
      chapterPlural: "chapters",
      chaptersLabel: "Chapters",
      continueWith: "Continue with",
      openTheme: "Open theme",
      themeStatusActive: "Active",
      themeStatusCompleted: "Completed",
      themeStatusUnlocked: "Unlocked",
      progressSuffix: "completed",
      unlockedSuffix: "unlocked",
      lastViewed: "Last viewed",
      unlockedAt: "Unlocked on",
      completedAt: "Completed on",
      statusNotStarted: "Not started",
      statusInProgress: "In progress",
      statusCompleted: "Completed",
    };
  }

  if (language === "de") {
    return {
      title: "Mein Weg",
      subtitle: "Sieh, welche freigeschalteten Kapitel bereitstehen, welche du fortsetzen kannst und was du bereits abgeschlossen hast.",
      themes: "Themen",
      inProgress: "Weiter",
      unlocked: "Meine Kapitel",
      completed: "Abgeschlossen",
      recent: "Zuletzt angesehen",
      noThemes: "Du hast noch keine freigeschalteten Themen.",
      unavailable: "Fortschritt ist noch nicht verfugbar. Deine freigeschalteten Kapitel stehen unten.",
      noInProgress: "Du hast noch keine freigeschalteten Kapitel zum Fortsetzen.",
      noUnlocked: "Du hast noch keine Kapitel freigeschaltet.",
      noCompleted: "Du hast noch keine Kapitel abgeschlossen.",
      noRecent: "Noch keine zuletzt angesehenen Inhalte.",
      noCategory: "Keine Kategorie",
      chapterSingular: "Kapitel",
      chapterPlural: "Kapitel",
      chaptersLabel: "Kapitel",
      continueWith: "Weiter mit",
      openTheme: "Thema ansehen",
      themeStatusActive: "Aktiv",
      themeStatusCompleted: "Abgeschlossen",
      themeStatusUnlocked: "Freigeschaltet",
      progressSuffix: "abgeschlossen",
      unlockedSuffix: "freigeschaltet",
      lastViewed: "Zuletzt angesehen",
      unlockedAt: "Freigeschaltet am",
      completedAt: "Abgeschlossen am",
      statusNotStarted: "Noch nicht begonnen",
      statusInProgress: "In Bearbeitung",
      statusCompleted: "Abgeschlossen",
    };
  }

  return {
    title: "Mijn traject",
    subtitle: "Bekijk welke ontgrendelde hoofdstukken klaarstaan, welke je kunt oppakken en wat je al hebt afgerond.",
    themes: "Thema's",
    inProgress: "Verdergaan",
    unlocked: "Mijn hoofdstukken",
    completed: "Afgerond",
    recent: "Recent bekeken",
    noThemes: "Je hebt nog geen ontgrendelde thema's.",
    unavailable: "Voortgang is nog niet beschikbaar. Je ontgrendelde hoofdstukken staan hieronder.",
    noInProgress: "Je hebt nog geen ontgrendelde hoofdstukken om verder mee te gaan.",
    noUnlocked: "Je hebt nog geen hoofdstukken ontgrendeld.",
    noCompleted: "Je hebt nog geen hoofdstukken afgerond.",
    noRecent: "Nog geen recent bekeken content.",
    noCategory: "Geen categorie",
    chapterSingular: "hoofdstuk",
    chapterPlural: "hoofdstukken",
    chaptersLabel: "Hoofdstukken",
    continueWith: "Verder met",
    openTheme: "Bekijk thema",
    themeStatusActive: "Actief",
    themeStatusCompleted: "Voltooid",
    themeStatusUnlocked: "Ontgrendeld",
    progressSuffix: "afgerond",
    unlockedSuffix: "ontgrendeld",
    lastViewed: "Laatst bekeken",
    unlockedAt: "Ontgrendeld op",
    completedAt: "Afgerond op",
    statusNotStarted: "Nog niet gestart",
    statusInProgress: "Bezig",
    statusCompleted: "Afgerond",
  };
}

function getContentProductsMessages(language: UiLanguage): ContentProductsMessages {
  if (language === "en") {
    return {
      title: "Content & products",
      purchases: "My purchases",
      ebooks: "EBooks",
      subscriptions: "My subscriptions",
      language: "Change language",
      security: "Security & privacy",
      logbook: "Logbook",
      purchasesTitle: "My purchases",
      purchasesSubtitle: "Everything currently recorded in the app for your account.",
      purchasesEmpty: "No purchases have been recorded in the app for your account yet.",
      websiteSyncNotice:
        "Orders from the website will appear here as soon as the external order sync is connected.",
      ebooksTitle: "EBooks",
      ebooksSubtitle: "Read your unlocked e-books in the app.",
      ebooksEmpty: "No e-books are available for your account yet.",
      ebooksRead: "Open e-book",
      ebooksSecurity:
        "E-books stay inside the app reader. Downloading, printing and easy copying are limited there.",
      subscriptionsTitle: "My subscriptions",
      subscriptionsSubtitle: "See your active subscriptions and manage renewal preferences.",
      subscriptionsEmpty: "No subscriptions were found for your account.",
      subscriptionsExtend: "Extend",
      subscriptionsCancel: "Cancel renewal",
      subscriptionsResume: "Resume renewal",
      subscriptionsCancelled: "Will not renew automatically",
      subscriptionsActiveUntil: "Active until",
      subscriptionsStartsAt: "Starts on",
      subscriptionsAmount: "Amount",
      statusActive: "Active",
      statusPlanned: "Planned",
      statusEnded: "Ended",
      securityTitle: "Security & privacy",
      securitySubtitle: "The legal and privacy information that belongs to the app experience.",
      disclaimerTitle: "Disclaimer",
      disclaimerBody:
        "Explain that the app supports reflection and therapeutic work, but does not replace medical or emergency care.",
      termsTitle: "Terms & conditions",
      termsBody:
        "Describe the rules for purchases, account use, subscriptions, access to content and limits of liability.",
      privacyTitle: "Privacy statement (GDPR)",
      privacyBody:
        "Explain which personal data is processed, why, how long it is kept, who receives it and which user rights apply.",
      impressumTitle: "Impressum",
      impressumBody:
        "State the legal identity of the organisation, contact details, registration details and responsible publisher information.",
      copyrightTitle: "Copyright",
      copyrightBody:
        "Show the copyright notice for the app, texts, assignments, downloads and visual assets.",
      dialogTitle: "Choose app language",
      dialogSubtitle: "Select one of the languages that is available in the app.",
      dialogSave: "Save language",
      dialogSaving: "Saving...",
      openedAt: "Opened on",
      purchaseGroupCredits: "Credits",
      purchaseGroupSubscriptions: "Subscriptions",
      purchaseGroupOther: "Purchases via De troostbook",
      purchaseSingular: "purchase",
      purchasePlural: "purchases",
    };
  }

  if (language === "de") {
    return {
      title: "Inhalte & Produkte",
      purchases: "Meine Einkaufe",
      ebooks: "EBooks",
      subscriptions: "Meine Abonnements",
      language: "Sprache andern",
      security: "Sicherheit & Datenschutz",
      logbook: "Logbuch",
      purchasesTitle: "Meine Einkaufe",
      purchasesSubtitle: "Alles, was derzeit in der App fur dein Konto registriert ist.",
      purchasesEmpty: "Fur dein Konto wurden noch keine Einkaufe in der App erfasst.",
      websiteSyncNotice:
        "Bestellungen uber die Website erscheinen hier, sobald die externe Bestellsynchronisierung verbunden ist.",
      ebooksTitle: "EBooks",
      ebooksSubtitle: "Lies deine freigeschalteten E-Books in der App.",
      ebooksEmpty: "Fur dein Konto sind noch keine E-Books verfugbar.",
      ebooksRead: "E-Book offnen",
      ebooksSecurity:
        "E-Books bleiben im App-Reader. Download, Drucken und einfaches Kopieren werden dort eingeschrankt.",
      subscriptionsTitle: "Meine Abonnements",
      subscriptionsSubtitle: "Sieh deine aktiven Abonnements ein und verwalte die Verlangerung.",
      subscriptionsEmpty: "Fur dein Konto wurden keine Abonnements gefunden.",
      subscriptionsExtend: "Verlangern",
      subscriptionsCancel: "Verlangerung stoppen",
      subscriptionsResume: "Verlangerung wieder aktivieren",
      subscriptionsCancelled: "Wird nicht automatisch verlangert",
      subscriptionsActiveUntil: "Aktiv bis",
      subscriptionsStartsAt: "Startet am",
      subscriptionsAmount: "Betrag",
      statusActive: "Aktiv",
      statusPlanned: "Geplant",
      statusEnded: "Beendet",
      securityTitle: "Sicherheit & Datenschutz",
      securitySubtitle: "Die rechtlichen und datenschutzbezogenen Informationen zur App.",
      disclaimerTitle: "Haftungsausschluss",
      disclaimerBody:
        "Erklare, dass die App therapeutische Prozesse unterstutzt, aber keine medizinische oder akute Hilfe ersetzt.",
      termsTitle: "Allgemeine Geschaftsbedingungen",
      termsBody:
        "Beschreibe die Regeln fur Kaufe, Kontonutzung, Abonnements, Inhaltszugang und Haftungsgrenzen.",
      privacyTitle: "Datenschutzerklarung (DSGVO)",
      privacyBody:
        "Erklare, welche personenbezogenen Daten verarbeitet werden, warum, wie lange und welche Rechte Nutzer haben.",
      impressumTitle: "Impressum",
      impressumBody:
        "Nenne die rechtliche Identitat, Kontaktdaten, Registrierungsangaben und die verantwortliche Stelle.",
      copyrightTitle: "Urheberrecht",
      copyrightBody:
        "Zeige den Copyright-Hinweis fur die App, Texte, Aufgaben, Downloads und visuelle Inhalte.",
      dialogTitle: "App-Sprache auswahlen",
      dialogSubtitle: "Wahle eine Sprache, die in der App verfugbar ist.",
      dialogSave: "Sprache speichern",
      dialogSaving: "Speichern...",
      openedAt: "Geoffnet am",
      purchaseGroupCredits: "Credits",
      purchaseGroupSubscriptions: "Abonnements",
      purchaseGroupOther: "Einkaufe uber De troostbook",
      purchaseSingular: "Einkauf",
      purchasePlural: "Einkaufe",
    };
  }

  return {
    title: "Content & producten",
    purchases: "Mijn aankopen",
    ebooks: "EBooks",
    subscriptions: "Mijn abonnementen",
    language: "Taal wijzigen",
    security: "Veiligheid & privacy",
    logbook: "Logboek",
    purchasesTitle: "Mijn aankopen",
    purchasesSubtitle: "Alles wat nu al in de app aan jouw account gekoppeld is.",
    purchasesEmpty: "Er zijn nog geen aankopen in de app aan jouw account gekoppeld.",
    websiteSyncNotice:
      "Bestellingen via de website verschijnen hier zodra de externe orderkoppeling ze doorzet.",
    ebooksTitle: "EBooks",
    ebooksSubtitle: "Lees je vrijgespeelde e-books veilig in de app.",
    ebooksEmpty: "Er zijn nog geen e-books beschikbaar voor jouw account.",
    ebooksRead: "Open e-book",
    ebooksSecurity:
      "E-books blijven in de app-reader. Downloaden, printen en makkelijk kopieren worden daar beperkt.",
    subscriptionsTitle: "Mijn abonnementen",
    subscriptionsSubtitle: "Bekijk je lopende abonnementen en beheer verlenging.",
    subscriptionsEmpty: "Er zijn nog geen abonnementen gevonden voor jouw account.",
    subscriptionsExtend: "Verlengen",
    subscriptionsCancel: "Verlenging stopzetten",
    subscriptionsResume: "Verlenging hervatten",
    subscriptionsCancelled: "Wordt niet automatisch verlengd",
    subscriptionsActiveUntil: "Actief tot",
    subscriptionsStartsAt: "Start op",
    subscriptionsAmount: "Bedrag",
    statusActive: "Actief",
    statusPlanned: "Gepland",
    statusEnded: "Beindigd",
    securityTitle: "Veiligheid & privacy",
    securitySubtitle: "De juridische en privacy-informatie die bij de app hoort.",
    disclaimerTitle: "Disclaimer",
    disclaimerBody:
      "Leg uit dat de app ondersteuning biedt bij reflectie en therapeutisch werken, maar geen medische of acute hulp vervangt.",
    termsTitle: "Algemene voorwaarden en condities",
    termsBody:
      "Beschrijf de regels voor aankopen, accountgebruik, abonnementen, toegang tot content en aansprakelijkheidsgrenzen.",
    privacyTitle: "Privacyverklaring AVG",
    privacyBody:
      "Leg uit welke persoonsgegevens worden verwerkt, waarom, hoe lang, met wie ze worden gedeeld en welke rechten gebruikers hebben.",
    impressumTitle: "Impressum",
    impressumBody:
      "Vermeld de juridische identiteit van de organisatie, contactgegevens, registratiegegevens en verantwoordelijke uitgever.",
    copyrightTitle: "Copyright",
    copyrightBody:
      "Toon het copyright voor de app, teksten, opdrachten, downloads en visuele assets.",
    dialogTitle: "Kies app-taal",
    dialogSubtitle: "Selecteer een taal die in de app beschikbaar is.",
    dialogSave: "Taal opslaan",
    dialogSaving: "Opslaan...",
    openedAt: "Geopend op",
    purchaseGroupCredits: "Credits",
    purchaseGroupSubscriptions: "Abonnementen",
    purchaseGroupOther: "Aankopen via De troostbook",
    purchaseSingular: "aankoop",
    purchasePlural: "aankopen",
  };
}

function labelForProgressStatus(
  status: "not_started" | "in_progress" | "completed",
  messages: ReturnType<typeof getTrajectoryMessages>
) {
  if (status === "completed") return messages.statusCompleted;
  if (status === "in_progress") return messages.statusInProgress;
  return messages.statusNotStarted;
}

function labelForAccountType(
  accountType: "admin" | "user" | "client" | "therapist",
  t: ReturnType<typeof getAppMessages>["accountTabs"]
) {
  if (accountType === "therapist") return t.roleTherapist;
  if (accountType === "admin") return t.roleAdmin;
  if (accountType === "client") return t.roleClient;
  return t.roleUser;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-3">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="max-w-[65%] text-right text-sm text-stone-800">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-medium text-stone-900">{value}</p>
      {detail ? <p className="mt-1 text-sm text-stone-500">{detail}</p> : null}
    </div>
  );
}

function ContentProductsRowItem({
  label,
  href,
  icon: Icon,
}: ContentProductsRow) {
  const isPanelLink = Boolean(href && href.includes("?panel="));
  const classes =
    "flex items-center gap-3 px-4 py-3 text-stone-900 transition";
  const content = (
    <>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-stone-700">
        {Icon ? <Icon size={18} strokeWidth={1.8} /> : null}
      </span>
      <span className="font-serif text-[1.15rem] leading-none">{label}</span>
    </>
  );

  if (!href) {
    return <div className={`${classes} cursor-default`}>{content}</div>;
  }

  return (
    <Link
      href={href}
      scroll={!isPanelLink}
      className={`${classes} hover:bg-[#fcf8f4]`}
    >
      {content}
    </Link>
  );
}

function normalizeActivePanel(value?: string | string[]): ActiveAccountPanel {
  const panel = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  if (
    panel === "purchases" ||
    panel === "ebooks" ||
    panel === "subscriptions" ||
    panel === "security"
  ) {
    return panel;
  }
  return null;
}

function formatMoney(amountCents: number | null, currency: string | null) {
  if (amountCents === null) return "-";

  try {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency || "EUR"}`;
  }
}

function buildPurchaseGroups(
  items: Awaited<ReturnType<typeof getAccountContentProductsData>>["purchases"],
  t: ContentProductsMessages
) {
  const groups = new Map<
    string,
    {
      key: string;
      title: string;
      order: number;
      latestAt: string;
      items: typeof items;
    }
  >();

  for (const item of items) {
    let key = "";
    let title = "";
    let order = 0;

    if (item.themeTitle) {
      key = `theme:${item.themeTitle}`;
      title = item.themeTitle;
      order = 0;
    } else if (item.categoryTitle) {
      key = `category:${item.categoryTitle}`;
      title = item.categoryTitle;
      order = 1;
    } else if (item.kind === "credit_pack") {
      key = "kind:credit_pack";
      title = t.purchaseGroupCredits;
      order = 2;
    } else if (item.kind === "subscription") {
      key = "kind:subscription";
      title = t.purchaseGroupSubscriptions;
      order = 3;
    } else {
      key = "kind:other";
      title = t.purchaseGroupOther;
      order = 4;
    }

    const currentGroup = groups.get(key);
    if (currentGroup) {
      currentGroup.items.push(item);
      if (new Date(item.occurredAt).getTime() > new Date(currentGroup.latestAt).getTime()) {
        currentGroup.latestAt = item.occurredAt;
      }
      continue;
    }

    groups.set(key, {
      key,
      title,
      order,
      latestAt: item.occurredAt,
      items: [item],
    });
  }

  return Array.from(groups.values()).sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    const rightTime = new Date(right.latestAt).getTime();
    const leftTime = new Date(left.latestAt).getTime();
    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.title.localeCompare(right.title, "nl");
  });
}

function LegalInfoCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5dbcf] bg-white px-4 py-4">
      <h4 className="font-medium text-stone-900">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
    </div>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<AccountSearchParams>;
}) {
  const language = resolveUiLanguage(await getAppLanguage());
  const messages = getAppMessages(language);
  const tabsT = messages.accountTabs;
  const generalT = messages.userGeneral;
  const headerT = messages.userHeader;
  const creditsT = messages.userCredits;
  const trajectoryT = getTrajectoryMessages(language);
  const contentProductsT = getContentProductsMessages(language);
  const locale =
    language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  const params = await searchParams;
  const error = Array.isArray(params?.error) ? params?.error[0] : params?.error;
  const tab = Array.isArray(params?.tab) ? params?.tab[0] : params?.tab;
  const activePanel = normalizeActivePanel(params?.panel);
  const hasInvalidError = error === "invalid";
  const activeTab = tab === "profile" ? "profile" : "overview";

  const user = await getCurrentUser();
  const supabase = createAdminClient();

  if (!user) {
    return (
      <PublicAppShell activeTab="profiel">
        <section className="space-y-4">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-950">Welkom terug</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Log in om je profiel, voortgang en aankopen te bekijken.
            </p>
          </div>

          <form
            action={login}
            className="space-y-3 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm"
          >
            <input type="hidden" name="next" value="/account" />
            <input type="hidden" name="origin" value="account" />

            <div>
              <label className="mb-1 block text-sm text-stone-700">E-mail</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#b64040]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-stone-700">
                Wachtwoord
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#b64040]"
              />
            </div>

            {hasInvalidError ? (
              <p className="text-sm text-red-600">
                Ongeldige inloggegevens. Probeer het opnieuw.
              </p>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex rounded-full bg-[#b64040] px-4 py-2 text-sm font-medium text-white"
              >
                Inloggen
              </button>
              <Link
                href="/login?mode=register"
                className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-800"
              >
                Aanmelden
              </Link>
            </div>
          </form>
        </section>
      </PublicAppShell>
    );
  }

  const [
    { data: profile },
    { data: wallet },
    { count: unlockedCount },
    { data: therapistEntitlements },
    progressCollections,
    contentProductsData,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, role, profile_data")
      .eq("user_id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("credit_wallets")
      .select("credits_available")
      .eq("user_id", user.id)
      .maybeSingle<WalletRow>(),
    supabase
      .from("content_unlocks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_entitlements")
      .select("starts_at, ends_at, is_active, created_at")
      .eq("user_id", user.id)
      .eq("entitlement_key", THERAPIST_DIRECTORY_ENTITLEMENT_KEY)
      .order("created_at", { ascending: false })
      .returns<TherapistEntitlementRow[]>(),
    getUserProgressCollections(user.id),
    getAccountContentProductsData({
      userId: user.id,
      email: user.email ?? null,
    }),
  ]);

  const firstName = profile?.profile_data?.first_name?.trim() ?? "";
  const lastName = profile?.profile_data?.last_name?.trim() ?? "";
  const website = profile?.profile_data?.website?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const displayName =
    profile?.display_name?.trim() ||
    fullName ||
    firstName ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "") ||
    user.email?.split("@")[0] ||
    "Gebruiker";
  const avatarUrl =
    profile?.profile_data?.avatar_url?.trim() ||
    profile?.profile_data?.profile_image ||
    (typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "") ||
    (typeof user.user_metadata?.picture === "string"
      ? user.user_metadata.picture
      : "") ||
    "";
  const bio = profile?.profile_data?.bio?.trim() ?? "";
  const userAccountType = getProfileAccountType(profile?.profile_data ?? null);
  const therapistProfile = getTherapistProfileData(profile?.profile_data ?? null);
  const accountType = getEffectiveAccountType(
    profile?.role ??
      user.user_metadata?.role ??
      user.app_metadata?.role ??
      "user",
    profile?.profile_data ?? null
  );
  const memberSince = formatDate(user.created_at, locale);
  const safeUnlockedCount = unlockedCount ?? 0;
  const therapistSubscription = getTimedEntitlementSummary(
    therapistEntitlements ?? []
  );
  const therapistSubscriptionStatus =
    therapistSubscription.status === "active"
      ? creditsT.active
      : therapistSubscription.status === "planned"
        ? creditsT.planned
        : creditsT.ended;
  const therapistSubscriptionStart =
    therapistSubscription.current?.starts_at ??
    therapistSubscription.next?.starts_at ??
    null;
  const therapistSubscriptionActiveUntil =
    therapistSubscription.current?.ends_at
      ? formatDate(therapistSubscription.current.ends_at, locale)
      : therapistSubscription.current
        ? creditsT.indefinite
        : "-";
  const therapistSubscriptionRenewedUntil = therapistSubscription.hasOpenEnded
    ? creditsT.indefinite
    : therapistSubscription.latestRelevantEndAt
      ? formatDate(therapistSubscription.latestRelevantEndAt, locale)
      : creditsT.notScheduled;
  const therapistDirectoryVisible =
    userAccountType === "therapist" &&
    Boolean(therapistProfile.public_profile_enabled) &&
    therapistSubscription.status === "active";
  const showPublicDirectoryHint =
    userAccountType === "therapist" &&
    !therapistProfile.public_profile_enabled &&
    therapistSubscription.status !== "ended";

  const themeItems = progressCollections.themes.map((theme) => {
    const progressPercent = theme.totalChapterCount
      ? Math.round((theme.completedChapterCount / theme.totalChapterCount) * 100)
      : 0;
    const chapterLabel =
      theme.unlockedChapterCount === 1
        ? trajectoryT.chapterSingular
        : trajectoryT.chapterPlural;
    const statusText =
      theme.totalChapterCount > 0 &&
      theme.completedChapterCount >= theme.totalChapterCount
        ? trajectoryT.themeStatusCompleted
        : theme.inProgressChapterCount > 0
          ? trajectoryT.themeStatusActive
          : trajectoryT.themeStatusUnlocked;
    const themeChapters = progressCollections.unlocked
      .filter((item) => item.themeId === theme.id)
      .sort((left, right) => {
        const leftSectionOrder = left.themeSectionSortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightSectionOrder = right.themeSectionSortOrder ?? Number.MAX_SAFE_INTEGER;

        if (leftSectionOrder !== rightSectionOrder) {
          return leftSectionOrder - rightSectionOrder;
        }

        const leftItemOrder = left.themeItemSortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightItemOrder = right.themeItemSortOrder ?? Number.MAX_SAFE_INTEGER;

        if (leftItemOrder !== rightItemOrder) {
          return leftItemOrder - rightItemOrder;
        }

        return left.title.localeCompare(right.title, "nl");
      })
      .map((item) => ({
        id: item.contentItemId,
        title: item.title,
        href: buildContentHref(item.slug),
        statusText: labelForProgressStatus(item.progressStatus, trajectoryT),
        metaText:
          item.progressStatus === "completed"
            ? `${trajectoryT.completedAt}: ${formatDate(item.completedAt, locale)}`
            : item.lastViewedAt
              ? `${trajectoryT.lastViewed}: ${formatDate(item.lastViewedAt, locale)}`
              : `${trajectoryT.unlockedAt}: ${formatDate(item.unlockedAt, locale)}`,
      }));

    return {
      id: theme.id,
      title: theme.title,
      progressPercent,
      progressText: `${theme.completedChapterCount} / ${theme.totalChapterCount} ${trajectoryT.progressSuffix}`,
      metaText: `${theme.unlockedChapterCount} ${chapterLabel} ${trajectoryT.unlockedSuffix}`,
      statusText,
      continueHref: theme.continueHref,
      continueLabel: theme.continueTitle
        ? `${trajectoryT.continueWith} ${theme.continueTitle}`
        : trajectoryT.openTheme,
      themeHref: theme.themeHref,
      themeLabel: trajectoryT.openTheme,
      chaptersLabel: trajectoryT.chaptersLabel,
      chapterCountLabel: `${themeChapters.length} ${
        themeChapters.length === 1
          ? trajectoryT.chapterSingular
          : trajectoryT.chapterPlural
      }`,
      openByDefault: theme.inProgressChapterCount > 0,
      chapters: themeChapters,
    };
  });
  const contentProductsRows: ContentProductsRow[] = [
    { label: contentProductsT.purchases, href: "/account?panel=purchases" },
    { label: contentProductsT.ebooks, href: "/account?panel=ebooks", icon: Download },
    {
      label: contentProductsT.subscriptions,
      href: "/account?panel=subscriptions",
    },
    { label: contentProductsT.security, href: "/account?panel=security" },
  ];
  const purchaseGroups = buildPurchaseGroups(contentProductsData.purchases, contentProductsT);
  const currentYear = new Date().getFullYear();

  return (
    <PublicAppShell activeTab="profiel">
      <section className="space-y-4">
        <AccountPanelAutoScroll targetId="account-content-panel" />

        <div className="overflow-hidden rounded-[1.5rem] border border-[#d8c6b8] bg-[#d8e0d3]">
          <div className="px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-16 w-16 rounded-full border border-white/80 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#b64040] text-xl font-semibold text-white">
                    {getInitials(displayName)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xl text-stone-900">
                  {displayName}
                </p>
                <p className="mt-1 truncate text-sm text-stone-600">
                  {user.email ?? ""}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-700">
                    {labelForAccountType(accountType, tabsT)}
                  </span>
                  <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-stone-700">
                    {headerT.createdAt}: {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === "profile" ? (
          <>
            <AccountProfileForm
              userId={user.id}
              accountType={userAccountType}
              initialDisplayName={displayName}
              initialBio={bio}
              initialFirstName={firstName}
              initialLastName={lastName}
              initialWebsite={website}
              initialAvatarUrl={avatarUrl}
              initialTherapistProfile={therapistProfile}
              email={user.email ?? ""}
              language={language}
            />
          </>
        ) : (
          <>
            <div className={accountCardClassName()}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-stone-900">Mijn gegevens</h3>
                <Link
                  href="/account?tab=profile"
                  className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs text-stone-800"
                >
                  {tabsT.profile}
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                <DetailRow label={generalT.firstName} value={firstName || "-"} />
                <DetailRow label={generalT.lastName} value={lastName || "-"} />
                <DetailRow label={generalT.displayName} value={displayName} />
                <DetailRow label="E-mail" value={user.email ?? "-"} />
                <DetailRow label={generalT.website} value={website || "-"} />
              </div>
            </div>

            <div className={accountCardClassName()}>
              <h3 className="mb-3 font-medium text-stone-900">Mijn account</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard
                  label={tabsT.accountType}
                  value={labelForAccountType(accountType, tabsT)}
                />
                <StatCard
                  label={headerT.createdAt}
                  value={memberSince}
                />
                <StatCard
                  label={tabsT.availableCredits}
                  value={String(wallet?.credits_available ?? 0)}
                />
                <StatCard
                  label={tabsT.unlockedItems}
                  value={String(safeUnlockedCount)}
                />
              </div>
            </div>

            {userAccountType === "therapist" ? (
              <div className={accountCardClassName()}>
                <h3 className="mb-3 font-medium text-stone-900">
                  {creditsT.therapistSubTitle}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label={creditsT.status}
                    value={therapistSubscriptionStatus}
                    detail={
                      therapistSubscriptionStart
                        ? `${creditsT.start}: ${formatDate(
                            therapistSubscriptionStart,
                            locale
                          )}`
                        : undefined
                    }
                  />
                  <StatCard
                    label={creditsT.activeUntil}
                    value={therapistSubscriptionActiveUntil}
                  />
                  <StatCard
                    label={creditsT.renewedUntil}
                    value={therapistSubscriptionRenewedUntil}
                  />
                  <StatCard
                    label={creditsT.directoryVisibility}
                    value={
                      therapistDirectoryVisible
                        ? creditsT.visibleInDirectory
                        : creditsT.hiddenInDirectory
                    }
                  />
                </div>
                {showPublicDirectoryHint ? (
                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    {generalT.publicDirectoryHint}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div id="mijn-traject" className={accountCardClassName()}>
              <div className="mb-4">
                <h3 className="font-medium text-stone-900">{trajectoryT.title}</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {trajectoryT.subtitle}
                </p>
              </div>

              {!progressCollections.storageReady ? (
                <div className="mb-3 rounded-xl bg-white px-4 py-4 text-sm text-stone-600">
                  {trajectoryT.unavailable}
                </div>
              ) : null}

              <div className="space-y-3">
                <ThemeProgressGrid
                  title={trajectoryT.themes}
                  emptyText={trajectoryT.noThemes}
                  items={themeItems}
                />
              </div>
            </div>

            <div className={accountCardClassName()}>
              <h3 className="mb-3 font-serif text-2xl text-stone-950">
                {contentProductsT.title}
              </h3>
              <div className="overflow-hidden rounded-2xl border border-[#e5dbcf] bg-white">
                {contentProductsRows.slice(0, 3).map((row) => (
                  <div
                    key={row.label}
                    className="border-b border-[#ead8cb]"
                  >
                    <ContentProductsRowItem {...row} />
                  </div>
                ))}
                <div className="border-b border-[#ead8cb]">
                  <LanguagePreferenceDialog
                    triggerLabel={contentProductsT.language}
                    currentLanguage={language}
                    title={contentProductsT.dialogTitle}
                    subtitle={contentProductsT.dialogSubtitle}
                    saveLabel={contentProductsT.dialogSave}
                    savingLabel={contentProductsT.dialogSaving}
                    cancelLabel={messages.accountProfile.cancel}
                  />
                </div>
                {contentProductsRows.slice(3).map((row, index) => (
                  <div
                    key={row.label}
                    className={
                      index === contentProductsRows.slice(3).length - 1
                        ? ""
                        : "border-b border-[#ead8cb]"
                    }
                  >
                    <ContentProductsRowItem {...row} />
                  </div>
                ))}
              </div>
            </div>

            {activePanel === "purchases" ? (
              <div id="account-content-panel" className={accountCardClassName()}>
                <h3 className="font-serif text-2xl text-stone-950">
                  {contentProductsT.purchasesTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {contentProductsT.purchasesSubtitle}
                </p>
                <p className="mt-3 rounded-2xl border border-dashed border-[#decfbe] bg-white/80 px-4 py-3 text-sm text-stone-600">
                  {contentProductsT.websiteSyncNotice}
                </p>

                {contentProductsData.purchases.length ? (
                  <div className="mt-4 space-y-3">
                    {purchaseGroups.map((group) => (
                      <details
                        key={group.key}
                        className="group overflow-hidden rounded-2xl border border-[#e5dbcf] bg-white"
                      >
                        <summary className="flex list-none items-center justify-between gap-3 px-4 py-3 text-left marker:hidden">
                          <div className="min-w-0">
                            <div className="font-medium text-stone-900">{group.title}</div>
                            <div className="mt-1 text-xs text-stone-500">
                              {group.items.length}{" "}
                              {group.items.length === 1
                                ? contentProductsT.purchaseSingular
                                : contentProductsT.purchasePlural}
                            </div>
                          </div>
                          <span className="relative block h-4 w-4 shrink-0">
                            <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-stone-400" />
                            <span className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-stone-400 transition group-open:opacity-0" />
                          </span>
                        </summary>

                        <div className="space-y-3 border-t border-[#eadfd4] bg-[#fcf8f4] px-3 py-3">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-[#e5dbcf] bg-white px-4 py-4"
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-stone-900">{item.title}</h4>
                                  {item.subtitle ? (
                                    <p className="mt-1 text-sm text-stone-600">
                                      {item.subtitle}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="shrink-0 text-sm text-stone-500">
                                  {formatDate(item.occurredAt, locale)}
                                </div>
                                <div className="shrink-0 text-sm text-stone-700">
                                  {formatMoney(item.amountCents, item.currency)}
                                </div>
                                {item.href ? (
                                  <Link
                                    href={item.href}
                                    className="inline-flex rounded-full border border-stone-300 bg-[#f8f3ed] px-3 py-1.5 text-sm text-stone-800"
                                  >
                                    Open
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-[#e5dbcf] bg-white px-4 py-4 text-sm text-stone-600">
                    {contentProductsT.purchasesEmpty}
                  </div>
                )}
              </div>
            ) : null}

            {activePanel === "ebooks" ? (
              <div id="account-content-panel" className={accountCardClassName()}>
                <h3 className="font-serif text-2xl text-stone-950">
                  {contentProductsT.ebooksTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {contentProductsT.ebooksSubtitle}
                </p>
                <p className="mt-3 rounded-2xl border border-dashed border-[#decfbe] bg-white/80 px-4 py-3 text-sm text-stone-600">
                  {contentProductsT.ebooksSecurity}
                </p>

                {contentProductsData.ebooks.length ? (
                  <div className="mt-4 space-y-3">
                    {contentProductsData.ebooks.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#e5dbcf] bg-white px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-stone-900">{item.title}</h4>
                            {item.excerpt ? (
                              <p className="mt-1 text-sm leading-6 text-stone-600">
                                {item.excerpt}
                              </p>
                            ) : null}
                          </div>
                          <div className="text-sm text-stone-500">
                            {contentProductsT.openedAt}: {formatDate(item.unlockedAt, locale)}
                          </div>
                        </div>
                        {item.href ? (
                          <div className="mt-3">
                            <Link
                              href={item.href}
                              className="inline-flex rounded-full bg-[#b64040] px-4 py-2 text-sm text-white"
                            >
                              {contentProductsT.ebooksRead}
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-[#e5dbcf] bg-white px-4 py-4 text-sm text-stone-600">
                    {contentProductsT.ebooksEmpty}
                  </div>
                )}
              </div>
            ) : null}

            {activePanel === "subscriptions" ? (
              <div id="account-content-panel" className={accountCardClassName()}>
                <h3 className="font-serif text-2xl text-stone-950">
                  {contentProductsT.subscriptionsTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {contentProductsT.subscriptionsSubtitle}
                </p>

                {contentProductsData.subscriptions.length ? (
                  <div className="mt-4 space-y-3">
                    {contentProductsData.subscriptions.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#e5dbcf] bg-white px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="font-medium text-stone-900">{item.title}</h4>
                            <p className="mt-1 text-sm text-stone-600">
                              {item.status === "active"
                                ? contentProductsT.statusActive
                                : item.status === "planned"
                                  ? contentProductsT.statusPlanned
                                  : contentProductsT.statusEnded}
                            </p>
                            <div className="mt-2 space-y-1 text-sm text-stone-500">
                              <div>
                                {contentProductsT.subscriptionsStartsAt}:{" "}
                                {formatDate(item.startsAt, locale)}
                              </div>
                              <div>
                                {contentProductsT.subscriptionsActiveUntil}:{" "}
                                {formatDate(item.endsAt, locale)}
                              </div>
                              <div>
                                {contentProductsT.subscriptionsAmount}:{" "}
                                {formatMoney(item.amountCents, item.currency)}
                              </div>
                              {item.cancelAtPeriodEnd ? (
                                <div className="text-[#b64040]">
                                  {contentProductsT.subscriptionsCancelled}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href="/shop"
                              className="rounded-full bg-[#b64040] px-4 py-2 text-sm text-white"
                            >
                              {contentProductsT.subscriptionsExtend}
                            </Link>
                            {item.status !== "ended" ? (
                              <form
                                action={async () => {
                                  "use server";
                                  await setMySubscriptionCancellationPreference({
                                    entitlementKey: item.entitlementKey,
                                    cancelAtPeriodEnd: !item.cancelAtPeriodEnd,
                                  });
                                }}
                              >
                                <button
                                  type="submit"
                                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700"
                                >
                                  {item.cancelAtPeriodEnd
                                    ? contentProductsT.subscriptionsResume
                                    : contentProductsT.subscriptionsCancel}
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-[#e5dbcf] bg-white px-4 py-4 text-sm text-stone-600">
                    {contentProductsT.subscriptionsEmpty}
                  </div>
                )}
              </div>
            ) : null}

            {activePanel === "security" ? (
              <div id="account-content-panel" className={accountCardClassName()}>
                <h3 className="font-serif text-2xl text-stone-950">
                  {contentProductsT.securityTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {contentProductsT.securitySubtitle}
                </p>

                <div className="mt-4 space-y-3">
                  <LegalInfoCard
                    title={contentProductsT.disclaimerTitle}
                    body={contentProductsT.disclaimerBody}
                  />
                  <LegalInfoCard
                    title={contentProductsT.termsTitle}
                    body={contentProductsT.termsBody}
                  />
                  <LegalInfoCard
                    title={contentProductsT.privacyTitle}
                    body={contentProductsT.privacyBody}
                  />
                  <LegalInfoCard
                    title={contentProductsT.impressumTitle}
                    body={contentProductsT.impressumBody}
                  />
                  <LegalInfoCard
                    title={`${contentProductsT.copyrightTitle} © 2025 - ${currentYear}`}
                    body={contentProductsT.copyrightBody}
                  />
                </div>
              </div>
            ) : null}
          </>
        )}

        <div className="pb-2 pt-1">
          <AppLogoutButton />
        </div>
      </section>
    </PublicAppShell>
  );
}
