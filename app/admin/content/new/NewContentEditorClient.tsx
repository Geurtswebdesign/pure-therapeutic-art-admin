"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import EditorCanvas from "@/components/content/EditorCanvas";
import MetadataSidebar from "@/components/content/MetadataSidebar";
import { createContentItem } from "@/lib/content/mutations";
import { updateContentItem } from "@/lib/content/actions";
import type { Term } from "@/components/taxonomy/types";
import type { LanguageOption } from "@/lib/i18n/languages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { resolveAdminBrowserHref } from "@/lib/site/admin-client-paths";
import type { AccordionSection } from "@/lib/content/accordionSections";

type ContentStatus = "all" | "draft" | "published" | "archived";
type SaveMode = "save_draft" | "publish_or_update";

const AUTO_CREATE_DELAY_MS = 5 * 60 * 1000;

type Props = {
  uiLanguage: UiLanguage;
  initialLanguage: string;
  categoryTerms: Term[];
  tagTerms: Term[];
  languageOptions: LanguageOption[];
};

export default function NewContentEditorClient({
  uiLanguage,
  initialLanguage,
  categoryTerms,
  tagTerms,
  languageOptions,
}: Props) {
  const metaText = getAppMessages(uiLanguage).metadata;
  const router = useRouter();
  const pathname = usePathname();

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
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

  const [draft, setDraft] = useState(() => ({
    title: "",
    body: "",
    status: "draft" as ContentStatus,
    slug: "",
    excerpt: "",
    published_at: toLocalDateTimeInput(new Date()),
    featured_image_url: "",
    featured_image_alt: "",
    language: initialLanguage,
    credit_cost: 0,
    category_term_ids: [] as string[],
    tag_term_ids: [] as string[],
    accordion_sections: [] as AccordionSection[],
  }));
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtySince, setDirtySince] = useState<number | null>(null);
  const persistedItemIdRef = useRef<string | null>(null);
  const autoCreateStartedRef = useRef(false);

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
      language: string;
      credit_cost: number;
      category_term_ids: string[];
      tag_term_ids: string[];
      accordion_sections: AccordionSection[];
    }>
  ) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };

      if (patch.title !== undefined && !isSlugManual) {
        next.slug = slugify(patch.title);
      }

      return next;
    });

    if (patch.slug !== undefined && patch.title === undefined) {
      setIsSlugManual(Boolean(patch.slug.trim()));
    }

    setDirty((prev) => {
      if (!prev) {
        setDirtySince(Date.now());
      }
      return true;
    });
  };

  async function persistDraft(mode: SaveMode, autoCreate = false) {
    if (saving) return;
    if (persistedItemIdRef.current && autoCreate) return;

    setSaving(true);
    try {
      const item =
        persistedItemIdRef.current
          ? { id: persistedItemIdRef.current }
          : await createContentItem();

      persistedItemIdRef.current = item.id;

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

      const generatedSlug = slugify(draft.title);
      const finalSlug = draft.slug.trim() || generatedSlug || `content-${item.id.slice(0, 8)}`;

      const result = await updateContentItem({
        id: item.id,
        title: draft.title,
        body: draft.body,
        status: nextStatus,
        slug: finalSlug,
        excerpt: draft.excerpt || null,
        published_at: normalizeToIso(publishInput),
        featured_image_url: draft.featured_image_url || null,
        featured_image_alt: draft.featured_image_alt || null,
        language: draft.language,
        credit_cost: draft.credit_cost,
        category_term_ids: draft.category_term_ids,
        tag_term_ids: draft.tag_term_ids,
        accordion_sections: draft.accordion_sections,
      });

      setDraft((prev) => ({
        ...prev,
        status: nextStatus,
        slug: result.slug ?? finalSlug,
        published_at: publishInput,
      }));
      setDirty(false);
      setDirtySince(null);

      router.replace(
        resolveAdminBrowserHref(pathname, `/admin/content/${item.id}`)
      );
      router.refresh();
    } catch (error) {
      autoCreateStartedRef.current = false;
      const message =
        error instanceof Error ? error.message : metaText.unknownSaveError;
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!dirty || dirtySince === null || persistedItemIdRef.current) {
      return;
    }

    const interval = window.setInterval(() => {
      if (autoCreateStartedRef.current) {
        return;
      }

      if (Date.now() - dirtySince < AUTO_CREATE_DELAY_MS) {
        return;
      }

      autoCreateStartedRef.current = true;
      void persistDraft("save_draft", true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [dirty, dirtySince, pathname, draft, saving]);

  return (
    <div className="grid min-w-0 w-full xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
      <EditorCanvas
        contentItemId={persistedItemIdRef.current ?? "draft-temp"}
        title={draft.title}
        body={draft.body}
        accordionSections={draft.accordion_sections}
        language={uiLanguage}
        onChange={onDraftChange}
      />

      <MetadataSidebar
        language={uiLanguage}
        item={{
          id: persistedItemIdRef.current,
          status: draft.status,
          slug: draft.slug,
          language: draft.language,
        }}
        draft={draft}
        dirty={dirty}
        saving={saving}
        onDraftChange={onDraftChange}
        onSaveAll={async (mode) => {
          await persistDraft(mode ?? "publish_or_update");
        }}
        categoryTerms={categoryTerms}
        tagTerms={tagTerms}
        languageOptions={languageOptions}
      />
    </div>
  );
}
