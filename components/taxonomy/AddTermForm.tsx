"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { Taxonomy, Term } from "./types";
import { trackEvent } from "@/lib/analytics/track";

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
  const [parentId, setParentId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

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
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
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
    setParentId("");
  }

  return (
    <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
      <h2 className="text-lg font-semibold">
        Add New {taxonomy.name.slice(0, -1)}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button className="bg-black text-white px-4 py-2 rounded">
          Add
        </button>
      </form>
    </div>
  );
}
