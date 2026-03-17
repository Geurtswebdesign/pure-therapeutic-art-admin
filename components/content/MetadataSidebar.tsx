"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PreviewButton from "@/components/admin/PreviewButton";
import StatusSelect from "./StatusSelect";
import { deleteContentItem } from "@/lib/content/actions";
import Image from "next/image";
import { supabase } from "@/lib/supabase/browser";
import MediaPicker from "@/components/content/media/MediaPicker";
import type { Term } from "@/components/taxonomy/types";
import { buildTermTree, flattenTree } from "@/components/taxonomy/types";
import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

export type ContentStatus = "all" | "draft" | "published" | "archived";

type DraftState = {
  status: ContentStatus;
  slug: string;
  excerpt: string;
  published_at: string;
  featured_image_url: string;
  featured_image_alt: string;
  language: string;
  credit_cost: number;
  category_term_ids: string[];
  tag_term_ids: string[];
};

type MetadataSidebarProps = {
  language: UiLanguage;
  item: {
    id: string;
    status: ContentStatus;
    slug: string | null;
    language: string;
  };
  draft: DraftState;
  dirty: boolean;
  onDraftChange: (patch: Partial<DraftState>) => void;
  onSaveAll: (mode?: "save_draft" | "publish_or_update") => Promise<void>;
  saving?: boolean;
  categoryTerms: Term[];
  tagTerms: Term[];
};

type BoxKey = "publish" | "permalink" | "featured" | "categories" | "tags" | "excerpt" | "options";
type SecondaryBoxKey = Exclude<BoxKey, "publish">;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function MetadataSidebar({
  language,
  item,
  draft,
  dirty,
  onDraftChange,
  onSaveAll,
  saving = false,
  categoryTerms,
  tagTerms,
}: MetadataSidebarProps) {
  const t = getAppMessages(language).metadata;
  const router = useRouter();
  const [openBox, setOpenBox] = useState<SecondaryBoxKey>("permalink");
  const [pickingFeatured, setPickingFeatured] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ContentStatus>(draft.status);

  const categoryTree = useMemo(() => buildTermTree(categoryTerms), [categoryTerms]);
  const flatCategories = useMemo(() => flattenTree(categoryTree), [categoryTree]);
  const canSaveDraft = dirty && !saving;
  const canPublishOrUpdate = !saving && (dirty || draft.status === "draft");
  const isPublished = draft.status === "published";
  const liveSlug = draft.slug.trim();

  function renderBox(
    key: BoxKey,
    title: string,
    content: React.ReactNode
  ) {
    const isPublishBox = key === "publish";
    const isOpen = isPublishBox || openBox === key;
    return (
      <section className="rounded border bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
          onClick={() => {
            if (!isPublishBox) setOpenBox(key as SecondaryBoxKey);
          }}
        >
          <span>{title}</span>
          <span className="text-gray-500">{isOpen ? "▾" : "▸"}</span>
        </button>
        {isOpen ? <div className="border-t px-4 py-4 text-sm">{content}</div> : null}
      </section>
    );
  }

  async function handlePickFeatured(ids: string[]) {
    const pickedId = ids[0];
    if (!pickedId) return;

    const { data } = await supabase
      .from("media_assets")
      .select("file_path, alt_text")
      .eq("id", pickedId)
      .maybeSingle();

    if (!data?.file_path) return;

    const url = data.file_path.startsWith("http")
      ? data.file_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.file_path}`;

    onDraftChange({
      featured_image_url: url,
      featured_image_alt: data.alt_text ?? "",
    });
    setPickingFeatured(false);
  }

  function toggleCategory(termId: string, checked: boolean) {
    const currentIds = draft.category_term_ids;
    const nextIds = checked
      ? currentIds.includes(termId)
        ? currentIds
        : [...currentIds, termId]
      : currentIds.filter((id) => id !== termId);
    onDraftChange({ category_term_ids: nextIds });
  }

  function toggleTag(termId: string, checked: boolean) {
    const currentIds = draft.tag_term_ids;
    const nextIds = checked
      ? currentIds.includes(termId)
        ? currentIds
        : [...currentIds, termId]
      : currentIds.filter((id) => id !== termId);
    onDraftChange({ tag_term_ids: nextIds });
  }

  async function handleDelete() {
    const ok = confirm(
      dirty
        ? t.unsavedDeleteConfirm
        : t.deleteConfirm
    );
    if (!ok) return;
    await deleteContentItem(item.id);
    router.push("/admin/content");
  }

  return (
    <aside className="min-w-0 space-y-4 border-t bg-gray-50 p-4 xl:border-l xl:border-t-0">
      {renderBox(
        "publish",
        t.publish,
        <div className="space-y-4">
          <div className="flex gap-2">
            {draft.status === "draft" ? (
              <button
                type="button"
                disabled={!canSaveDraft}
                onClick={() => onSaveAll("save_draft")}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                {saving ? t.saving : t.saveDraft}
              </button>
            ) : null}

            {liveSlug && draft.status === "draft" ? (
              <PreviewButton slug={liveSlug} locale={item.language} />
            ) : null}

            {liveSlug && draft.status === "published" ? (
              <a
                href={`/${item.language}/${liveSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border px-3 py-2 text-sm hover:bg-gray-100"
              >
                {t.viewLive}
              </a>
            ) : null}
          </div>

          {!isEditingStatus ? (
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  setPendingStatus(draft.status);
                  setIsEditingStatus(true);
                }}
              >
                {draft.status} {t.editStatus}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <StatusSelect value={pendingStatus} onChange={setPendingStatus} />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1 hover:bg-gray-100"
                  onClick={() => {
                    onDraftChange({ status: pendingStatus });
                    setIsEditingStatus(false);
                  }}
                >
                  {t.ok}
                </button>
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => setIsEditingStatus(false)}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          <label className="block space-y-1">
            <span className="block text-xs text-gray-600">{t.publishDate}</span>
            <input
              type="datetime-local"
              value={draft.published_at}
              onChange={(e) => onDraftChange({ published_at: e.target.value })}
              className="w-full rounded border px-2 py-1"
            />
          </label>

          <label className="block space-y-1">
            <span className="block text-xs text-gray-600">{t.creditCost}</span>
            <input
              type="number"
              min={0}
              value={draft.credit_cost}
              onChange={(e) => onDraftChange({ credit_cost: Number(e.target.value) })}
              className="w-full rounded border px-2 py-1"
            />
          </label>

          <button
            type="button"
            disabled={!canPublishOrUpdate}
            onClick={() => onSaveAll("publish_or_update")}
            className={`w-full rounded px-4 py-2 font-medium text-white ${
              canPublishOrUpdate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? t.saving : isPublished ? t.update : t.publishAction}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            {t.moveToTrash}
          </button>
        </div>
      )}

      {renderBox(
        "permalink",
        t.permalink,
        <div className="space-y-2">
          <input
            value={draft.slug}
            onChange={(e) => onDraftChange({ slug: slugify(e.target.value) })}
            className="w-full rounded border px-2 py-1"
          />
          <p className="text-xs text-gray-500">
            URL: /{item.language}/{draft.slug || t.noSlug}
          </p>
        </div>
      )}

      {renderBox(
        "featured",
        t.featuredImage,
        <div className="space-y-3">
          {draft.featured_image_url ? (
            <div className="space-y-2">
              <Image
                src={draft.featured_image_url}
                alt={draft.featured_image_alt || t.featuredImageAlt}
                width={480}
                height={280}
                unoptimized
                className="h-auto w-full rounded border object-cover"
              />
              <input
                value={draft.featured_image_alt}
                onChange={(e) => onDraftChange({ featured_image_alt: e.target.value })}
                className="w-full rounded border px-2 py-1"
                placeholder={t.altText}
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500">{t.noFeatured}</p>
          )}

          {!pickingFeatured ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 hover:bg-gray-100"
                onClick={() => setPickingFeatured(true)}
              >
                {draft.featured_image_url ? t.change : t.choose}
              </button>
              {draft.featured_image_url ? (
                <button
                  type="button"
                  className="rounded border px-3 py-1 text-red-600 hover:bg-red-50"
                  onClick={() => onDraftChange({ featured_image_url: "", featured_image_alt: "" })}
                >
                  {t.delete}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <MediaPicker onSelect={handlePickFeatured} />
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setPickingFeatured(false)}
              >
                {t.close}
              </button>
            </div>
          )}
        </div>
      )}

      {renderBox(
        "categories",
        t.categories,
        flatCategories.length ? (
          <div className="max-h-56 space-y-1 overflow-auto">
            {flatCategories.map(({ node, depth }) => (
              <label key={node.id} className="flex items-center gap-2" style={{ paddingLeft: depth * 14 }}>
                <input
                  type="checkbox"
                  checked={draft.category_term_ids.includes(node.id)}
                  onChange={(e) => toggleCategory(node.id, e.target.checked)}
                />
                <span>{node.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">{t.noCategories}</p>
        )
      )}

      {renderBox(
        "tags",
        t.tags,
        tagTerms.length ? (
          <div className="max-h-40 space-y-1 overflow-auto">
            {tagTerms.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.tag_term_ids.includes(tag.id)}
                  onChange={(e) => toggleTag(tag.id, e.target.checked)}
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">{t.noTags}</p>
        )
      )}

      {renderBox(
        "excerpt",
        t.excerpt,
        <textarea
          value={draft.excerpt}
          onChange={(e) => onDraftChange({ excerpt: e.target.value })}
          rows={5}
          className="w-full rounded border px-2 py-1"
          placeholder={t.excerptPlaceholder}
        />
      )}

      {renderBox(
        "options",
        t.settings,
        <div className="space-y-2 text-xs text-gray-600">
          <label className="block space-y-1">
            <span className="block text-xs text-gray-600">{t.language}</span>
            <select
              value={draft.language}
              onChange={(e) => onDraftChange({ language: e.target.value })}
              className="w-full rounded border px-2 py-1 text-sm"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
          <p>{t.visibilityPublic}</p>
        </div>
      )}
    </aside>
  );
}
