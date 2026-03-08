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

export type CustomizerSettings = {
  primaryColor: string;
  secondaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  cardRadius: string;
  fontScale: string;
};

export const DEFAULT_CUSTOMIZER_SETTINGS: CustomizerSettings = {
  primaryColor: "#b64040",
  secondaryColor: "#8fae96",
  gradientFrom: "#f9f0e5",
  gradientTo: "#e8d0cb",
  cardRadius: "16",
  fontScale: "100",
};

export type CustomizerHeaderTargetType = "category" | "route" | "page";

export type CustomizerHeader = {
  id: string;
  name: string;
  logoUrl: string;
  logoAlt: string;
  subtitle: string;
  isActive: boolean;
  sortOrder: number;
};

export type CustomizerHeaderRule = {
  id: string;
  headerId: string;
  targetType: CustomizerHeaderTargetType;
  targetValue: string;
};

export type CustomizerHeaderConfig = {
  headers: CustomizerHeader[];
  rules: CustomizerHeaderRule[];
  fallbackHeaderId: string | null;
  categories: Array<{ slug: string; name: string }>;
};
