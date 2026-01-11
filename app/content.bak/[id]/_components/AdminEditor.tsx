"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Wysiwyg from "@/app/_components/editor/Wysiwyg";

type Translation = {
  id: string;
  content_id: string;
  locale: string;
  title: string | null;
  summary: string | null;
  body_richtext: string | null;
  duration_minutes: number | null;
  metadata: any;
};

export default function AdminEditor({
  item,
  translations,
}: {
  item: any;
  translations: Translation[];
}) {
  const locales = useMemo(() => {
  const found = Array.from(new Set(translations.map(t => t.locale)));
  return found.length ? found.sort() : ["nl"];
}, [translations]);

  const [activeLocale, setActiveLocale] = useState(locales[0] ?? "nl");

  const current = useMemo(
    () => translations.find((t) => t.locale === activeLocale),
    [translations, activeLocale]
  );

  // item meta
  const [status, setStatus] = useState(item.status ?? "");
  const [type, setType] = useState(item.type ?? "");
  const [slug, setSlug] = useState(item.slug ?? "");
  const [creditCost, setCreditCost] = useState(item.credit_cost ?? 0);

  // translation fields (local state)
  const [title, setTitle] = useState(current?.title ?? "");
  const [summary, setSummary] = useState(current?.summary ?? "");
  const [body, setBody] = useState(current?.body_richtext ?? "");
  const [duration, setDuration] = useState<number>(current?.duration_minutes ?? 0);
  const [metadata, setMetadata] = useState<string>(
    current?.metadata ? JSON.stringify(current.metadata, null, 2) : "{}"
  );

  // when locale changes, load locale fields
  function switchLocale(loc: string) {
    const t = translations.find((x) => x.locale === loc);
    setActiveLocale(loc);
    setTitle(t?.title ?? "");
    setSummary(t?.summary ?? "");
    setBody(t?.body_richtext ?? "");
    setDuration(t?.duration_minutes ?? 0);
    setMetadata(t?.metadata ? JSON.stringify(t.metadata, null, 2) : "{}");
  }

  const [saving, setSaving] = useState(false);

  async function saveAll() {
  setSaving(true);

  // 1) update item meta
  const { error: itemErr } = await supabaseBrowser
    .from("content_items")
    .update({
      status,
      type,
      slug,
      credit_cost: creditCost,
    })
    .eq("id", item.id)
    .select();

  if (itemErr) {
    setSaving(false);
    alert(itemErr.message);
    return;
  }

  // 2) parse metadata
  let parsedMeta: any = {};
  try {
    parsedMeta = metadata ? JSON.parse(metadata) : {};
  } catch {
    setSaving(false);
    alert("Metadata is geen geldige JSON.");
    return;
  }

  // 3) UPSERT translation (update of insert)
  const { error: transErr } = await supabaseBrowser
    .from("content_translations")
    .upsert(
      {
        content_id: item.id,
        locale: activeLocale,
        title,
        summary,
        body_richtext: body,
        duration_minutes: duration,
        metadata: parsedMeta,
      },
      {
        onConflict: "content_id,locale",
      }
    )
    .select();

  setSaving(false);

  if (transErr) {
    alert(transErr.message);
    return;
  }

  alert("Opgeslagen");
}


  return (
    <div>
      {/* WP-like page header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Content bewerken</h1>
        <p className="text-sm text-gray-600 mt-1">ID: {item.id}</p>
      </div>

      {/* WP-like two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* LEFT: editor */}
        <div className="space-y-4">
          {/* Locale tabs */}
          <div className="bg-white border border-gray-300 rounded">
            <div className="border-b px-3 py-2 flex gap-2">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={`px-3 py-1 rounded text-sm ${
                    loc === activeLocale
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Samenvatting</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Inhoud (Classic editor)</label>
                <Wysiwyg value={body} onChange={setBody} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: metaboxes */}
        <div className="space-y-4">
          {/* Publish box */}
          <div className="bg-white border border-gray-300 rounded">
            <div className="px-3 py-2 border-b font-semibold text-sm">Publiceren</div>
            <div className="p-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <button
                onClick={saveAll}
                disabled={saving}
                className="w-full bg-[#2271b1] hover:bg-[#135e96] text-white rounded px-3 py-2"
              >
                {saving ? "Opslaan…" : "Update"}
              </button>
            </div>
          </div>

          {/* Content settings */}
          <div className="bg-white border border-gray-300 rounded">
            <div className="px-3 py-2 border-b font-semibold text-sm">Instellingen</div>
            <div className="p-3 space-y-3 text-sm">
              <div>
                <label className="block mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                >
                  <option value="exercise">exercise</option>
                  <option value="article">article</option>
                  <option value="audio">audio</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                />
              </div>

              <div>
                <label className="block mb-1">Credit cost</label>
                <input
                  type="number"
                  value={creditCost}
                  onChange={(e) => setCreditCost(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                />
              </div>

              <div>
                <label className="block mb-1">Duur (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                />
              </div>

              <div>
                <label className="block mb-1">Metadata (JSON)</label>
                <textarea
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 h-32 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
