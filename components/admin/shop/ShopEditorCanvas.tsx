"use client";

import TitleField from "@/components/content/TitleField";
import ClassicTextEditor from "@/components/content/ClassicTextEditor";

type Props = {
  itemId: string;
  title: string;
  body: string;
  onChange: (patch: { title?: string; body?: string }) => void;
};

export default function ShopEditorCanvas({
  itemId,
  title,
  body,
  onChange,
}: Props) {
  return (
    <main className="flex-1 p-10">
      <TitleField
        value={title}
        onChange={(nextTitle) => onChange({ title: nextTitle })}
        placeholder="Titel toevoegen"
      />

      <ClassicTextEditor
        contentItemId={`shop/${itemId}`}
        value={body}
        onChange={(nextBody) => onChange({ body: nextBody })}
      />
    </main>
  );
}
