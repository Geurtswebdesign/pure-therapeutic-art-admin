export type GeneralSettings = {
  siteName: string;
  tagline: string;
  logoUrl: string;
  timezone: string;
  locale: string;
  currency: string;
  primaryLanguage: string;
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: "Pure Therapeutic ART Therapy",
  tagline: "",
  logoUrl: "",
  timezone: "Europe/Amsterdam",
  locale: "nl-NL",
  currency: "EUR",
  primaryLanguage: "nl",
};
