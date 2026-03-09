export const HOMEPAGE_SEED_CATEGORY_SLUGS = [
  "cognitie-inzicht",
  "emoties-innerlijke-beleving",
  "gedrag-interactie",
  "lichaam-zintuigen",
  "natuur-symbolische-kracht",
  "zingeving-ritualen-spiritualiteit",
  "specifieke-doelgroepen-context",
  "gratis",
] as const;

export function isSeedCategorySlug(slug: string) {
  return HOMEPAGE_SEED_CATEGORY_SLUGS.includes(
    slug as (typeof HOMEPAGE_SEED_CATEGORY_SLUGS)[number]
  );
}
