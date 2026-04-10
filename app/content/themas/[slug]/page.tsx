import { notFound } from "next/navigation";
import ThemePageView from "@/components/content/ThemePageView";
import { stripRichText } from "@/lib/content/stripRichText";
import { getPublishedThemePageBySlug } from "@/lib/content/theme-queries";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const language = resolveUiLanguage(await getAppLanguage());
  const { slug } = await params;
  const theme = await getPublishedThemePageBySlug(slug, language);

  if (!theme) {
    notFound();
  }

  return <ThemePageView theme={theme} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const language = resolveUiLanguage(await getAppLanguage());
  const { slug } = await params;
  const theme = await getPublishedThemePageBySlug(slug, language);

  if (!theme) {
    return {};
  }

  return {
    title: theme.title,
    description: stripRichText(theme.description),
  };
}
