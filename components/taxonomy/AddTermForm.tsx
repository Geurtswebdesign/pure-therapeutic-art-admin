"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { Taxonomy, Term } from "./types";
import { trackEvent } from "@/lib/analytics/track";
import MediaPicker from "@/components/content/media/MediaPicker";

type Props = {
  taxonomy: Taxonomy;
  terms: Term[];
  onAdd: (term: Term) => void;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function AddTermForm({
  taxonomy,
  terms,
  onAdd,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [parentId, setParentId] = useState("");
  const [isHomepageSeed, setIsHomepageSeed] = useState(false);
  const [homepageSortOrder, setHomepageSortOrder] = useState<number>(0);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setFormError(null);

    trackEvent({
      eventName: "admin_term_create_submit",
      eventCategory: "admin_content",
      eventLabel: taxonomy.name,
    });

    const { data, error } = await supabase
      .from("content_terms")
      .insert({
        taxonomy_id: taxonomy.id,
        name,
        slug: slug || slugify(name),
        description,
        featured_image_url: featuredImageUrl || null,
        featured_image_alt: featuredImageAlt || null,
        parent_id: parentId || null,
        is_homepage_seed: taxonomy.slug === "category" ? isHomepageSeed : false,
        homepage_sort_order:
          taxonomy.slug === "category" && isHomepageSeed
            ? homepageSortOrder
            : null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      const hint = error.message.includes("featured_image_url") || error.message.includes("featured_image_alt")
        ? "Controleer of sql/content_term_images.sql is uitgevoerd in Supabase."
        : "";
      setFormError(hint ? `${error.message} ${hint}` : error.message);
      trackEvent({
        eventName: "admin_term_create_failed",
        eventCategory: "admin_content",
        eventLabel: error.message,
      });
      return;
    }

    trackEvent({
      eventName: "admin_term_create_success",
      eventCategory: "admin_content",
      eventLabel: taxonomy.name,
    });

    // Voeg direct toe aan client state
    onAdd({
      ...data,
      content_term_relationships: [{ count: 0 }],
    });

    // Reset form
    setName("");
    setSlug("");
    setDescription("");
    setFeaturedImageUrl("");
    setFeaturedImageAlt("");
    setParentId("");
    setIsHomepageSeed(false);
    setHomepageSortOrder(0);
  }

  return (
    <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
      <h2 className="text-lg font-semibold">
        Add New {taxonomy.name.slice(0, -1)}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {formError ? (
          <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(slugify(e.target.value));
          }}
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        {taxonomy.is_hierarchical && (
          <select
            className="w-full border rounded px-3 py-2"
            value={parentId}
            onChange={(e) =>
              setParentId(e.target.value)
            }
          >
            <option value="">None</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Category image URL"
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
        />

        <div className="flex gap-2">
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

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Category image alt text"
          value={featuredImageAlt}
          onChange={(e) => setFeaturedImageAlt(e.target.value)}
        />

        {taxonomy.slug === "category" ? (
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

        <button className="bg-black text-white px-4 py-2 rounded">
          Add
        </button>
      </form>

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
