"use client";

import { useState } from "react";
import EditorCanvas from "@/components/content/EditorCanvas";
import MetadataSidebar from "@/components/content/MetadataSidebar";
import { updateContentItem } from "@/lib/content/actions";
import type { Term } from "@/components/taxonomy/types";

type ContentStatus = "all" | "draft" | "published" | "archived";
type SaveMode = "save_draft" | "publish_or_update";

type Props = {
  item: {
    id: string;
    title: string | null;
    body: string | null;
    status: ContentStatus;
    slug: string | null;
    excerpt: string | null;
    published_at: string | null;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    language: string;
    credit_cost: number | null;
  };
  categoryTerms: Term[];
  selectedCategoryIds: string[];
  tagTerms: Term[];
  selectedTagIds: string[];
};

export default function ContentEditorClient({
  item,
  categoryTerms,
  selectedCategoryIds,
  tagTerms,
  selectedTagIds,
}: Props) {
  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  function isUuidLike(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  function toLocalDateTimeInput(value: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = value.getFullYear();
    const m = pad(value.getMonth() + 1);
    const d = pad(value.getDate());
    const h = pad(value.getHours());
    const min = pad(value.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  function normalizeToIso(value: string | null) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  }

  const initialPublishedAt =
    item.published_at ? toLocalDateTimeInput(new Date(item.published_at)) : toLocalDateTimeInput(new Date());

  const [draft, setDraft] = useState(() => ({
    title: item.title ?? "",
    body: item.body ?? "",
    status: item.status,
    slug: item.slug ?? "",
    excerpt: item.excerpt ?? "",
    published_at: initialPublishedAt,
    featured_image_url: item.featured_image_url ?? "",
    featured_image_alt: item.featured_image_alt ?? "",
    credit_cost: item.credit_cost ?? 0,
    category_term_ids: selectedCategoryIds,
    tag_term_ids: selectedTagIds,
  }));

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const onDraftChange = (
    patch: Partial<{
      title: string;
      body: string;
      status: ContentStatus;
      slug: string;
      excerpt: string;
      published_at: string;
      featured_image_url: string;
      featured_image_alt: string;
      credit_cost: number;
      category_term_ids: string[];
      tag_term_ids: string[];
    }>
  ) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const onSaveAll = async (mode: SaveMode = "publish_or_update") => {
    setSaving(true);
    try {
      const nextStatus: ContentStatus =
        mode === "save_draft"
          ? "draft"
          : draft.status === "draft"
          ? "published"
          : draft.status;

      const publishInput =
        nextStatus === "published"
          ? draft.published_at || toLocalDateTimeInput(new Date())
          : draft.published_at;

      const slugLooksAuto =
        !draft.slug ||
        draft.slug === item.id ||
        isUuidLike(draft.slug);
      const generatedSlug = slugify(draft.title);
      const finalSlug = slugLooksAuto
        ? generatedSlug || `content-${item.id.slice(0, 8)}`
        : draft.slug;

      await updateContentItem({
        id: item.id,
        title: draft.title,
        body: draft.body,
        status: nextStatus,
        slug: finalSlug,
        excerpt: draft.excerpt || null,
        published_at: normalizeToIso(publishInput),
        featured_image_url: draft.featured_image_url || null,
        featured_image_alt: draft.featured_image_alt || null,
        credit_cost: draft.credit_cost,
        category_term_ids: draft.category_term_ids,
        tag_term_ids: draft.tag_term_ids,
      });

      setDraft((prev) => ({
        ...prev,
        status: nextStatus,
        slug: finalSlug,
        published_at: publishInput,
      }));
      setDirty(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Onbekende fout bij opslaan.";
      alert(message);
    } finally {
      setSaving(false);
    }
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
        categoryTerms={categoryTerms}
        tagTerms={tagTerms}
      />
    </div>
  );
}
