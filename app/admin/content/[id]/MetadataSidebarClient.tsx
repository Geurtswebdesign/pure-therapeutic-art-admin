"use client";

import { useState } from "react";
import MetadataSidebar from "@/components/content/MetadataSidebar";
import { updateContentItem } from "@/lib/content/actions";
import type { ContentStatus } from "@/components/content/MetadataSidebar";

export default function MetadataSidebarClient({
  item,
}: {
  item: {
    id: string;
    status: ContentStatus;
    slug: string | null;
    language: string;
  };
}) {
  const [draft, setDraft] = useState({
    status: item.status,
  });

  const [dirty, setDirty] = useState(false);

  return (
    <MetadataSidebar
      item={item}
      draft={draft}
      dirty={dirty}
      onDraftChange={(patch) => {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
      }}
      onSaveAll={async () => {
        await updateContentItem(item.id, draft);
        setDirty(false);
      }}
    />
  );
}
