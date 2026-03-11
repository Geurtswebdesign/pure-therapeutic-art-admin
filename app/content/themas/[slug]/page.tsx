import { notFound } from "next/navigation";
import ThemePageView from "@/components/content/ThemePageView";
import { getPublishedThemePageBySlug } from "@/lib/content/theme-queries";

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = await getPublishedThemePageBySlug(slug);

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
  const { slug } = await params;
  const theme = await getPublishedThemePageBySlug(slug);

  if (!theme) {
    return {};
  }

  return {
    title: theme.title,
    description: theme.description ?? "",
  };
}
