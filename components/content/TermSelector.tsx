"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Term } from "@/components/taxonomy/types";
import { buildTermTree, flattenTree } from "@/components/taxonomy/types";

type Props = {
  contentId: string;
  taxonomySlug: string;
};

export default function TermSelector({ contentId, taxonomySlug }: Props) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const { data: tax } = await supabase
        .from("content_taxonomies")
        .select("id")
        .eq("slug", taxonomySlug)
        .single();

      if (!tax) return;

      const { data: allTerms } = await supabase
        .from("content_terms")
        .select("*")
        .eq("taxonomy_id", tax.id)
        .order("sort_order");

      const { data: rel } = await supabase
        .from("content_term_relationships")
        .select("term_id")
        .eq("content_item_id", contentId);

      const selectedMap: Record<string, boolean> = {};
      rel?.forEach((r) => {
        selectedMap[r.term_id] = true;
      });

      setSelected(selectedMap);
      setTerms(allTerms || []);
    }

    load();
  }, [contentId, taxonomySlug]);

  async function toggle(termId: string, checked: boolean) {
    if (checked) {
      await supabase
        .from("content_term_relationships")
        .insert({
          content_item_id: contentId,
          term_id: termId,
        });
    } else {
      await supabase
        .from("content_term_relationships")
        .delete()
        .eq("content_item_id", contentId)
        .eq("term_id", termId);
    }

    setSelected((s) => ({ ...s, [termId]: checked }));
  }

  const tree = buildTermTree(terms);
  const flat = flattenTree(tree);

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <h3 className="font-medium capitalize">
        {taxonomySlug}
      </h3>

      {flat.map(({ node, depth }) => (
        <label
          key={node.id}
          className="flex items-center gap-2 text-sm"
          style={{ paddingLeft: depth * 18 }}
        >
          <input
            type="checkbox"
            checked={!!selected[node.id]}
            onChange={(e) =>
              toggle(node.id, e.target.checked)
            }
          />
          {node.name}
        </label>
      ))}
    </div>
  );
}
