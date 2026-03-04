"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import type { Category } from "./CategoryTree";
import { trackEvent } from "@/lib/analytics/track";

type CategoryOption = {
  id: string;
  name: string;
};

type Props = {
  category: Category;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function EditCategoryForm({
  category,
}: Props) {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] =
    useState(category.description || "");
  const [parentId, setParentId] =
    useState<string | null>(category.parent_id);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("content_categories")
        .select("id, name")
        .order("name");

      setCategories(data || []);
    }

    loadCategories();
  }, []);

  async function handleSave() {
    trackEvent({
      eventName: "admin_category_update_submit",
      eventCategory: "admin_content",
      eventLabel: category.id,
    });

    const { error } = await supabase
      .from("content_categories")
      .update({
        name,
        slug,
        description,
        parent_id: parentId,
      })
      .eq("id", category.id);

    if (error) {
      trackEvent({
        eventName: "admin_category_update_failed",
        eventCategory: "admin_content",
        eventLabel: error.message,
      });
      return;
    }

    trackEvent({
      eventName: "admin_category_update_success",
      eventCategory: "admin_content",
      eventLabel: category.id,
    });
    router.push("/admin/content/categories");
    router.refresh();
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium">
          Name
        </label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(slugify(e.target.value));
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Slug
        </label>
        <input
          className="w-full border rounded px-3 py-2"
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value)
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Parent Category
        </label>
        <select
          className="w-full border rounded px-3 py-2"
          value={parentId || ""}
          onChange={(e) =>
            setParentId(
              e.target.value || null
            )
          }
        >
          <option value="">
            None
          </option>

          {categories
            .filter((c) => c.id !== category.id)
            .map((cat) => (
              <option
                key={cat.id}
                value={cat.id}
              >
                {cat.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">
          Description
        </label>
        <textarea
          className="w-full border rounded px-3 py-2"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />
      </div>

      <button
        onClick={handleSave}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Update Category
      </button>
    </div>
  );
}
