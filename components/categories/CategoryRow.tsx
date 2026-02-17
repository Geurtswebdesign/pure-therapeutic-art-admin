"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { CategoryNode } from "./CategoryTree";
import Link from "next/link";

type Props = {
  node: CategoryNode;
  depth: number;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function CategoryRow({ node, depth }: Props) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(node.name);
  const [slug, setSlug] = useState(node.slug);
  const [description, setDescription] = useState(
    node.description || ""
  );
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = confirm(
      "Weet je zeker dat je deze categorie wilt verwijderen?"
    );
    if (!confirmed) return;

    await supabase
      .from("content_categories")
      .delete()
      .eq("id", node.id);

    router.refresh();
  }

  async function handleSave() {
    setLoading(true);

    await supabase
      .from("content_categories")
      .update({
        name,
        slug,
        description,
      })
      .eq("id", node.id);

    setLoading(false);
    setIsEditing(false);

    router.refresh();
  }

  return (
    <>
      <tr className="border-t hover:bg-muted/50">
        <td
          className="py-2"
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          {isEditing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              value={name}
              onChange={(e) => {
                const newName = e.target.value;
                setName(newName);
                setSlug(slugify(newName));
              }}
            />
          ) : (
            <Link
                href={`/admin/content/categories/${node.slug}`}
                className="font-medium text-blue-600 hover:underline"
                >
                {node.name}
            </Link>
          )}

          {!isEditing && (
            <div className="text-sm text-muted-foreground space-x-3 mt-1">
              <button
                onClick={() => setIsEditing(true)}
                className="hover:underline text-blue-600"
              >
                Snel bewerken
              </button>

              <button
                onClick={handleDelete}
                className="hover:underline text-red-600"
              >
                Verwijderen
              </button>
            </div>
          )}
        </td>

        <td>
          {isEditing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />
          ) : (
            node.description
          )}
        </td>

        <td>
          {isEditing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value)
              }
            />
          ) : (
            node.slug
          )}
        </td>

        <td className="text-sm">
          0
        </td>
      </tr>

      {isEditing && (
        <tr>
          <td colSpan={4} className="bg-muted/30 p-3">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-black text-white px-4 py-1 rounded"
              >
                {loading ? "Opslaan..." : "Opgeslagen"}
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1 border rounded"
              >
                Annuleer
              </button>
            </div>
          </td>
        </tr>
      )}

      {node.children.map((child) => (
        <CategoryRow
          key={child.id}
          node={child}
          depth={depth + 1}
        />
      ))}
    </>
  );
}
