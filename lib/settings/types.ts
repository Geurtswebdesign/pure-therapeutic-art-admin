export type GeneralSettings = {
  siteName: string;
  tagline: string;
  timezone: string;
  locale: string;
  currency: string;
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: "Pure Therapeutic ART Therapy",
  tagline: "",
  timezone: "Europe/Amsterdam",
  locale: "nl-NL",
  currency: "EUR",
};
