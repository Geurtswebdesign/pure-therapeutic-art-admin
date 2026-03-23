import type { UiLanguage } from "@/lib/i18n/runtime";

export type LegalDocumentSlug =
  | "disclaimer"
  | "terms"
  | "privacy"
  | "impressum"
  | "copyright";

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  body: string;
};

export function getLegalDocuments(
  language: UiLanguage,
  currentYear = new Date().getFullYear()
): LegalDocument[] {
  if (language === "en") {
    return [
      {
        slug: "disclaimer",
        title: "Disclaimer",
        body:
          "This app supports reflection and therapeutic work, but does not replace medical care, mental health treatment or emergency services. If acute or severe complaints arise, always contact an appropriate healthcare provider or emergency service.",
      },
      {
        slug: "terms",
        title: "Terms & conditions",
        body:
          "These terms describe how accounts, purchases, subscriptions, content access and liability limits are handled within the app. They apply to the use of the platform, the protected content and any related services.",
      },
      {
        slug: "privacy",
        title: "Privacy statement (GDPR)",
        body:
          "The privacy statement explains which personal data is processed, for which purposes, how long the data is retained, who may receive it and which rights users have under GDPR, including access, correction and deletion.",
      },
      {
        slug: "impressum",
        title: "Impressum",
        body:
          "The impressum contains the legal identity of the organisation, contact details, registration information and the party responsible for the content and publication of the app.",
      },
      {
        slug: "copyright",
        title: `Copyright © 2025 - ${currentYear}`,
        body:
          "All texts, assignments, downloads, visuals and other app materials are protected by copyright. Use outside the app or without written permission is not allowed.",
      },
    ];
  }

  if (language === "de") {
    return [
      {
        slug: "disclaimer",
        title: "Haftungsausschluss",
        body:
          "Diese App unterstutzt Reflexion und therapeutische Arbeit, ersetzt jedoch weder medizinische Versorgung noch psychologische Behandlung oder Notfallhilfe. Bei akuten oder schweren Beschwerden ist immer ein geeigneter Gesundheitsdienst zu kontaktieren.",
      },
      {
        slug: "terms",
        title: "Allgemeine Geschaftsbedingungen",
        body:
          "Diese Bedingungen regeln die Nutzung von Konten, Einkaufen, Abonnements, Inhaltszugang und Haftungsgrenzen innerhalb der App. Sie gelten fur die Nutzung der Plattform, geschutzter Inhalte und zugehoriger Dienste.",
      },
      {
        slug: "privacy",
        title: "Datenschutzerklarung (DSGVO)",
        body:
          "Die Datenschutzerklarung beschreibt, welche personenbezogenen Daten verarbeitet werden, zu welchen Zwecken dies geschieht, wie lange Daten gespeichert werden, wer sie erhalten kann und welche Rechte Nutzer nach der DSGVO haben.",
      },
      {
        slug: "impressum",
        title: "Impressum",
        body:
          "Im Impressum stehen die rechtliche Identitat der Organisation, Kontaktdaten, Registrierungsangaben und die fur Inhalte und Veroffentlichung der App verantwortliche Stelle.",
      },
      {
        slug: "copyright",
        title: `Copyright © 2025 - ${currentYear}`,
        body:
          "Alle Texte, Aufgaben, Downloads, visuellen Materialien und sonstigen Inhalte der App sind urheberrechtlich geschutzt. Eine Nutzung ausserhalb der App oder ohne schriftliche Erlaubnis ist nicht gestattet.",
      },
    ];
  }

  return [
    {
      slug: "disclaimer",
      title: "Disclaimer",
      body:
        "Deze app ondersteunt reflectie en therapeutisch werk, maar vervangt geen medische zorg, geestelijke gezondheidszorg of spoedhulp. Neem bij acute of ernstige klachten altijd contact op met een passende zorgverlener of noodhulpdienst.",
    },
    {
      slug: "terms",
      title: "Algemene voorwaarden en condities",
      body:
        "Deze voorwaarden beschrijven hoe accounts, aankopen, abonnementen, toegang tot content en aansprakelijkheidsgrenzen binnen de app geregeld zijn. Ze gelden voor het gebruik van het platform, de afgeschermde inhoud en bijbehorende diensten.",
    },
    {
      slug: "privacy",
      title: "Privacyverklaring AVG",
      body:
        "De privacyverklaring legt uit welke persoonsgegevens worden verwerkt, voor welke doelen dat gebeurt, hoe lang gegevens worden bewaard, met wie gegevens gedeeld kunnen worden en welke rechten gebruikers hebben onder de AVG.",
    },
    {
      slug: "impressum",
      title: "Impressum",
      body:
        "In het impressum staat de juridische identiteit van de organisatie, contactinformatie, registratiedetails en wie verantwoordelijk is voor de inhoud en publicatie van de app.",
    },
    {
      slug: "copyright",
      title: `Copyright © 2025 - ${currentYear}`,
      body:
        "Alle teksten, opdrachten, downloads, visuele materialen en overige inhoud van de app vallen onder het auteursrecht. Gebruik buiten de app of zonder schriftelijke toestemming is niet toegestaan.",
    },
  ];
}
