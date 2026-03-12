import ThemeEditorClient from "@/components/content/themes/ThemeEditorClient";
import { getThemeEditorData } from "@/lib/content/theme-admin";

export default async function EditThemePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialData = await getThemeEditorData({ themeId: id });

  return (
    <ThemeEditorClient
      key={initialData.draft.id || id}
      initialData={initialData}
    />
  );
}
