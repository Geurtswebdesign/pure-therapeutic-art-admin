"use client";

import { useState } from "react";
import MetadataSidebar from "@/components/content/MetadataSidebar";
import { updateContentItem } from "@/lib/content/actions";
import { buildLanguageOptions } from "@/lib/i18n/languages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import type { ContentStatus } from "@/components/content/MetadataSidebar";

export default function MetadataSidebarClient({
  item,
}: {
  item: {
    id: string;
    status: ContentStatus;
    slug: string | null;
    language: string;
    credit_cost?: number | null;
    excerpt?: string | null;
    published_at?: string | null;
    featured_image_url?: string | null;
    featured_image_alt?: string | null;
  };
}) {
  const [draft, setDraft] = useState({
    status: item.status,
    slug: item.slug ?? "",
    excerpt: item.excerpt ?? "",
    published_at: item.published_at ? item.published_at.slice(0, 16) : "",
    featured_image_url: item.featured_image_url ?? "",
    featured_image_alt: item.featured_image_alt ?? "",
    language: item.language ?? "nl",
    credit_cost: item.credit_cost ?? 0,
    category_term_ids: [] as string[],
    tag_term_ids: [] as string[],
  });

  const [dirty, setDirty] = useState(false);
  const languageOptions = buildLanguageOptions([item.language]);

  return (
    <MetadataSidebar
      language={resolveUiLanguage(item.language)}
      item={item}
      draft={draft}
      dirty={dirty}
      onDraftChange={(patch) => {
        setDraft((d) => ({ ...d, ...patch }));
        setDirty(true);
      }}
      onSaveAll={async () => {
        const result = await updateContentItem({
          id: item.id,
          status: draft.status,
          slug: draft.slug,
          excerpt: draft.excerpt || null,
          published_at: draft.published_at || null,
          featured_image_url: draft.featured_image_url || null,
          featured_image_alt: draft.featured_image_alt || null,
          language: draft.language,
          credit_cost: draft.credit_cost,
          category_term_ids: draft.category_term_ids,
          tag_term_ids: draft.tag_term_ids,
        });
        setDraft((current) => ({
          ...current,
          slug: result.slug ?? current.slug,
        }));
        setDirty(false);
      }}
      categoryTerms={[]}
      tagTerms={[]}
      languageOptions={languageOptions}
    />
  );
}
