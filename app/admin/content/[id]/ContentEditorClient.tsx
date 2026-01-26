"use client";

import { useState } from "react";
import EditorCanvas from "@/components/content/EditorCanvas";
import MetadataSidebar from "@/components/content/MetadataSidebar";
import { updateContentItem } from "@/lib/content/actions";

type ContentStatus = "draft" | "published" | "archived";

type Props = {
  item: {
    id: string;
    title: string | null;
    body: string | null;
    status: ContentStatus;
    slug: string | null;
    language: string;
  };
};

export default function ContentEditorClient({ item }: Props) {
  const [draft, setDraft] = useState(() => ({
    title: item.title ?? "",
    body: item.body ?? "",
    status: item.status,
  }));

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const onDraftChange = (
    patch: Partial<{ title: string; body: string; status: ContentStatus }>
  ) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const onSaveAll = async () => {
    setSaving(true);

    await updateContentItem({
      id: item.id,
      title: draft.title,
      body: draft.body,
      status: draft.status,
    });

    setSaving(false);
    setDirty(false);
  };

  return (
    <div className="flex">
      <EditorCanvas
        contentItemId={item.id}
        title={draft.title}
        body={draft.body}
        onChange={onDraftChange}
      />

      <MetadataSidebar
        item={item}
        draft={draft}
        dirty={dirty}
        saving={saving}
        onDraftChange={onDraftChange}
        onSaveAll={onSaveAll}
      />
    </div>
  );
}
