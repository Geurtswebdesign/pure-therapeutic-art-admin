"use client";

import TitleField from "@/components/content/TitleField";
import ClassicTextEditor from "@/components/content/ClassicTextEditor";

type Props = {
  itemId: string;
  title: string;
  body: string;
  description: string;
  introTitle: string;
  introText: string;
  descriptionTitle: string;
  detailsTitle: string;
  details: string[];
  purchaseTitle: string;
  purchaseDescription: string;
  onChange: (patch: {
    title?: string;
    body?: string;
    description?: string;
    introTitle?: string;
    introText?: string;
    descriptionTitle?: string;
    detailsTitle?: string;
    details?: string[];
    purchaseTitle?: string;
    purchaseDescription?: string;
  }) => void;
};

function detailsToText(details: string[]) {
  return details.join("\n");
}

function detailsFromText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function ShopEditorCanvas({
  itemId,
  title,
  body,
  description,
  introTitle,
  introText,
  descriptionTitle,
  detailsTitle,
  details,
  purchaseTitle,
  purchaseDescription,
  onChange,
}: Props) {
  return (
    <main className="flex-1 space-y-8 p-10">
      <TitleField
        value={title}
        onChange={(nextTitle) => onChange({ title: nextTitle })}
        placeholder="Titel toevoegen"
      />

      <section className="space-y-5 rounded border bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">
          Publieke teksten
        </h2>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Samenvatting tekst
          </span>
          <textarea
            value={description}
            onChange={(event) =>
              onChange({ description: event.target.value })
            }
            className="min-h-[140px] w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Intro label
          </span>
          <input
            value={introTitle}
            onChange={(event) =>
              onChange({ introTitle: event.target.value })
            }
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Intro tekst
          </span>
          <textarea
            value={introText}
            onChange={(event) =>
              onChange({ introText: event.target.value })
            }
            className="min-h-[120px] w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Beschrijving label
          </span>
          <input
            value={descriptionTitle}
            onChange={(event) =>
              onChange({ descriptionTitle: event.target.value })
            }
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-stone-800">
            Beschrijving tekst
          </span>
          <ClassicTextEditor
            contentItemId={`shop/${itemId}`}
            value={body}
            onChange={(nextBody) => onChange({ body: nextBody })}
          />
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Meer info label
          </span>
          <input
            value={detailsTitle}
            onChange={(event) =>
              onChange({ detailsTitle: event.target.value })
            }
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Meer info blokken
          </span>
          <textarea
            value={detailsToText(details)}
            onChange={(event) =>
              onChange({ details: detailsFromText(event.target.value) })
            }
            className="min-h-[180px] w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Bestellen label
          </span>
          <input
            value={purchaseTitle}
            onChange={(event) =>
              onChange({ purchaseTitle: event.target.value })
            }
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Bestellen tekst
          </span>
          <textarea
            value={purchaseDescription}
            onChange={(event) =>
              onChange({ purchaseDescription: event.target.value })
            }
            className="min-h-[120px] w-full rounded border px-3 py-2 text-sm"
          />
        </label>
      </section>
    </main>
  );
}
