import ThemeEditorClient from "@/components/content/themes/ThemeEditorClient";
import { getThemeEditorData } from "@/lib/content/theme-admin";

type PageProps = {
  searchParams: Promise<{
    source?: string;
  }>;
};

export default async function NewThemePage({ searchParams }: PageProps) {
  const { source } = await searchParams;
  const initialData = await getThemeEditorData({
    sourceKey: source?.trim() || undefined,
  });

  return (
    <ThemeEditorClient
      key={initialData.draft.sourceKey || "new-theme"}
      initialData={initialData}
    />
  );
}
