"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Taxonomy, Term, TermNode } from "./types";
import { buildTermTree, flattenTree } from "./types";

type Props = {
  taxonomy: Taxonomy;
  terms: Term[];
};

type FlatRow = { node: TermNode; depth: number };

/**
 * Simpele, betrouwbare DnD:
 * - Reorder binnen dezelfde parent (sort_order)
 * - Nest/un-nest via "Bulk: Set Parent" (WP heeft dit via parent dropdown in edit + quick edit)
 *
 * Wil je écht “drop to nest” op horizontale drag: kan, maar is veel complexer (collision + offset tree rules).
 * Dit is 1-op-1 WP: nesting beheer je primair via Parent.
 */
export default function TermsTable({ taxonomy, terms }: Props) {
  const router = useRouter();

  // local order state for DnD reorder
  const [localTerms] = useState<Term[]>(terms);

  // selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  // bulk
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkParentId, setBulkParentId] = useState<string>("");

  // dnd
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const tree = useMemo(() => buildTermTree(terms), [terms]);
  const flat = useMemo<FlatRow[]>(() => flattenTree(tree), [tree]);

  // For reorder we only reorder within same parent group, so we need a stable list per parent.
  // We'll use the flattened list but only allow reorder within same parent_id.
  const flatIds = flat.map((r) => r.node.id);

  function toggleAll(checked: boolean) {
    const next: Record<string, boolean> = {};
    if (checked) for (const r of flat) next[r.node.id] = true;
    setSelected(next);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((s) => ({ ...s, [id]: checked }));
  }

  async function applyBulk() {
    if (!bulkAction || selectedIds.length === 0) return;

    if (bulkAction === "delete") {
      if (!confirm(`Delete ${selectedIds.length} term(s)?`)) return;
      await supabase.from("content_terms").delete().in("id", selectedIds);
      router.refresh();
      return;
    }

    if (bulkAction === "activate") {
      await supabase.from("content_terms").update({ is_active: true }).in("id", selectedIds);
      router.refresh();
      return;
    }

    if (bulkAction === "deactivate") {
      await supabase.from("content_terms").update({ is_active: false }).in("id", selectedIds);
      router.refresh();
      return;
    }

    if (bulkAction === "set_parent") {
      // WP: parent only if hierarchical
      if (!taxonomy.is_hierarchical) return;

      // avoid self-parent
      if (selectedIds.includes(bulkParentId)) {
        alert("A term cannot be its own parent.");
        return;
      }

      await supabase
        .from("content_terms")
        .update({ parent_id: bulkParentId || null })
        .in("id", selectedIds);

      router.refresh();
      return;
    }
  }

  async function toggleActive(term: Term) {
    await supabase.from("content_terms").update({ is_active: !term.is_active }).eq("id", term.id);
    router.refresh();
  }

  async function deleteOne(term: Term) {
    if (!confirm(`Delete "${term.name}"?`)) return;
    await supabase.from("content_terms").delete().eq("id", term.id);
    router.refresh();
  }

  // DnD reorder (same parent)
  async function onDragEnd(e: DragEndEvent) {
    const active = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (!over || active === over) return;

    const activeTerm = terms.find((t) => t.id === active);
    const overTerm = terms.find((t) => t.id === over);
    if (!activeTerm || !overTerm) return;

    // Only reorder within same parent_id (WP-like stable & predictable)
    if ((activeTerm.parent_id || null) !== (overTerm.parent_id || null)) return;

    // Build list of siblings
    const siblings = localTerms
      .filter((t) => (t.parent_id || null) === (activeTerm.parent_id || null))
      .sort((a, b) => a.sort_order - b.sort_order);

    const oldIndex = siblings.findIndex((t) => t.id === active);
    const newIndex = siblings.findIndex((t) => t.id === over);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);

    // Update sort_order sequentially
    const updates = reordered.map((t, idx) => ({ id: t.id, sort_order: idx }));

    // Persist (batched-ish)
    // If you want truly atomic: create a RPC. For now: sequential update is ok.
    for (const u of updates) {
      await supabase.from("content_terms").update({ sort_order: u.sort_order }).eq("id", u.id);
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Bulk bar (WP style) */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="border rounded px-3 py-2"
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
        >
          <option value="">Bulk actions</option>
          <option value="activate">Activate</option>
          <option value="deactivate">Deactivate</option>
          <option value="delete">Delete</option>
          {taxonomy.is_hierarchical && <option value="set_parent">Set parent</option>}
        </select>

        {taxonomy.is_hierarchical && bulkAction === "set_parent" && (
          <select
            className="border rounded px-3 py-2"
            value={bulkParentId}
            onChange={(e) => setBulkParentId(e.target.value)}
          >
            <option value="">None</option>
            {localTerms
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        )}

        <button className="border rounded px-4 py-2" onClick={applyBulk} disabled={!bulkAction || selectedIds.length === 0}>
          Apply
        </button>

        <div className="text-sm text-muted-foreground">
          Selected: <span className="font-medium">{selectedIds.length}</span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => toggleAll(e.target.checked)}
                      checked={flat.length > 0 && selectedIds.length === flat.length}
                    />
                  </th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Slug</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left w-56">Actions</th>
                </tr>
              </thead>

              <tbody>
                {flat.map(({ node, depth }) => (
                  <SortableRow
                    key={node.id}
                    taxonomySlug={taxonomy.slug}
                    node={node}
                    depth={depth}
                    checked={!!selected[node.id]}
                    onCheck={toggleOne}
                    onToggleActive={() => toggleActive(node)}
                    onDelete={() => deleteOne(node)}
                  />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag & drop reorders within the same parent. Changing hierarchy is done via Parent (Edit / Bulk Set Parent).
      </p>
    </div>
  );
}

function SortableRow(props: {
  taxonomySlug: string;
  node: Term;
  depth: number;
  checked: boolean;
  onCheck: (id: string, checked: boolean) => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.node.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-t hover:bg-muted/50">
      <td className="p-3 align-top">
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(e) => props.onCheck(props.node.id, e.target.checked)}
        />
      </td>

      <td className="p-3 align-top">
        <div className="flex items-start gap-2" style={{ paddingLeft: props.depth * 18 }}>
          <button
            className="cursor-grab select-none text-muted-foreground"
            title="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>

          <div>
            <Link
              className="font-medium text-blue-600 hover:underline"
              href={`/admin/content/taxonomies/${props.taxonomySlug}/terms/${props.node.slug}`}
            >
              {props.node.name}
            </Link>
          </div>
        </div>
      </td>

      <td className="p-3 align-top text-muted-foreground">{props.node.description}</td>
      <td className="p-3 align-top">{props.node.slug}</td>

      <td className="p-3 align-top">
        <span className={props.node.is_active ? "" : "text-muted-foreground"}>{props.node.is_active ? "Active" : "Inactive"}</span>
      </td>

      <td className="p-3 align-top space-x-3">
        <button onClick={props.onToggleActive} className="text-blue-600 hover:underline">
          {props.node.is_active ? "Deactivate" : "Activate"}
        </button>
        <button onClick={props.onDelete} className="text-red-600 hover:underline">
          Delete
        </button>
      </td>
    </tr>
  );
}
