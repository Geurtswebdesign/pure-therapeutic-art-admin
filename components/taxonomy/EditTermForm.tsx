"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import type { Taxonomy, Term } from "./types";
import MediaPicker from "@/components/content/media/MediaPicker";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function EditTermForm(props: {
  taxonomy: Taxonomy;
  term: Term;
  allTerms: Array<{ id: string; name: string; parent_id: string | null }>;
}) {
  const router = useRouter();

  const [name, setName] = useState(props.term.name);
  const [slug, setSlug] = useState(props.term.slug);
  const [description, setDescription] = useState(props.term.description || "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    props.term.featured_image_url || ""
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState(
    props.term.featured_image_alt || ""
  );
  const [parentId, setParentId] = useState<string>(props.term.parent_id || "");
  const [isHomepageSeed, setIsHomepageSeed] = useState<boolean>(
    Boolean(props.term.is_homepage_seed)
  );
  const [homepageSortOrder, setHomepageSortOrder] = useState<number>(
    props.term.homepage_sort_order ?? 0
  );
  const [active, setActive] = useState<boolean>(props.term.is_active);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSelectMedia(ids: string[]) {
    const id = ids[0];
    if (!id) return;
    const { data, error } = await supabase
      .from("media_assets")
      .select("file_path, alt_text")
      .eq("id", id)
      .maybeSingle<{ file_path: string; alt_text: string | null }>();
    if (error || !data) return;
    const url = data.file_path.startsWith("http")
      ? data.file_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.file_path}`;
    setFeaturedImageUrl(url);
    setFeaturedImageAlt(data.alt_text ?? "");
    setPickerOpen(false);
  }

  async function save() {
    setFormError(null);
    const { error } = await supabase
      .from("content_terms")
      .update({
        name,
        slug,
        description,
        featured_image_url: featuredImageUrl || null,
        featured_image_alt: featuredImageAlt || null,
        parent_id: props.taxonomy.is_hierarchical ? (parentId || null) : null,
        is_homepage_seed:
          props.taxonomy.slug === "category" ? isHomepageSeed : false,
        homepage_sort_order:
          props.taxonomy.slug === "category" && isHomepageSeed
            ? homepageSortOrder
            : null,
        is_active: active,
      })
      .eq("id", props.term.id);

    if (error) {
      const hint = error.message.includes("featured_image_url") || error.message.includes("featured_image_alt")
        ? "Controleer of sql/content_term_images.sql is uitgevoerd in Supabase."
        : "";
      setFormError(hint ? `${error.message} ${hint}` : error.message);
      return;
    }

    // WP-like: terug naar overzicht
    router.push(`/admin/content/taxonomies/${props.taxonomy.slug}/terms`);
    router.refresh();
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
      {formError ? (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            setName(v);
            setSlug(slugify(v));
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Slug</label>
        <input className="w-full border rounded px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>

      {props.taxonomy.is_hierarchical && (
        <div>
          <label className="block text-sm font-medium">Parent</label>
          <select className="w-full border rounded px-3 py-2" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None</option>
            {props.allTerms
              .filter((t) => t.id !== props.term.id)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea className="w-full border rounded px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium">Category image URL</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={() => setPickerOpen(true)}
          >
            Kies uit mediatheek
          </button>
          {featuredImageUrl ? (
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
              onClick={() => {
                setFeaturedImageUrl("");
                setFeaturedImageAlt("");
              }}
            >
              Verwijderen
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Category image alt text</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={featuredImageAlt}
          onChange={(e) => setFeaturedImageAlt(e.target.value)}
        />
      </div>

      {props.taxonomy.slug === "category" ? (
        <div className="space-y-3 rounded border p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isHomepageSeed}
              onChange={(e) => setIsHomepageSeed(e.target.checked)}
            />
            Toon op homepage (seed categorie)
          </label>

          {isHomepageSeed ? (
            <label className="block text-sm">
              <span className="mb-1 block">Homepage volgorde</span>
              <input
                type="number"
                min={0}
                value={homepageSortOrder}
                onChange={(e) => setHomepageSortOrder(Number(e.target.value))}
                className="w-full rounded border px-3 py-2"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>

      <button onClick={save} className="bg-black text-white px-4 py-2 rounded">
        Update
      </button>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Kies categorie-afbeelding</h4>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded border px-3 py-1 text-xs"
              >
                Sluiten
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-auto">
              <MediaPicker onSelect={handleSelectMedia} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
