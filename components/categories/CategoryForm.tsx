"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import { trackEvent } from "@/lib/analytics/track";
type CategoryOption = {
  id: string;
  name: string;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function CategoryForm() {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    trackEvent({
      eventName: "admin_category_create_submit",
      eventCategory: "admin_content",
    });

    const { error } = await supabase.from("content_categories").insert({
      name,
      slug: slug || slugify(name),
      description,
      parent_id: parentId || null,
    });

    setLoading(false);
    if (error) {
      trackEvent({
        eventName: "admin_category_create_failed",
        eventCategory: "admin_content",
        eventLabel: error.message,
      });
      return;
    }
    trackEvent({
      eventName: "admin_category_create_success",
      eventCategory: "admin_content",
    });
    router.refresh();
  }

  return (
    <div className="border rounded-lg p-6 bg-muted/30">
      <h2 className="text-lg font-semibold mb-4">
        Add New Category
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

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
            required
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

            {categories.map((cat) => (
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
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Add Category"}
        </button>
      </form>
    </div>
  );
}
