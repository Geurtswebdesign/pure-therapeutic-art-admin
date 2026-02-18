"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import type { Taxonomy, Term } from "./types";

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
  const [parentId, setParentId] = useState<string>(props.term.parent_id || "");
  const [active, setActive] = useState<boolean>(props.term.is_active);

  async function save() {
    await supabase
      .from("content_terms")
      .update({
        name,
        slug,
        description,
        parent_id: props.taxonomy.is_hierarchical ? (parentId || null) : null,
        is_active: active,
      })
      .eq("id", props.term.id);

    // WP-like: terug naar overzicht
    router.push(`/admin/content/taxonomies/${props.taxonomy.slug}/terms`);
    router.refresh();
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
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

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>

      <button onClick={save} className="bg-black text-white px-4 py-2 rounded">
        Update
      </button>
    </div>
  );
}
