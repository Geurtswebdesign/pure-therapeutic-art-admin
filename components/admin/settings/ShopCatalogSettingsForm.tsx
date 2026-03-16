"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { saveShopCatalogSettings } from "@/lib/settings/actions";
import type { CatalogItem, ShopCatalogSettings } from "@/lib/shop/catalog";

type Props = {
  initialValues: ShopCatalogSettings;
};

type CategoryKey = "books" | "games";

function detailsToText(details: string[]) {
  return details.join("\n");
}

function detailsFromText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function ShopCatalogSettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState(initialValues);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem<K extends keyof CatalogItem>(
    category: CategoryKey,
    index: number,
    key: K,
    value: CatalogItem[K]
  ) {
    setForm((current) => ({
      ...current,
      [category]: current[category].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSuccess(false);
    setError(null);

    startTransition(async () => {
      try {
        await saveShopCatalogSettings(form);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Shopcatalogus</h2>
        <p className="mt-1 text-sm text-gray-600">
          Beheer hier de inhoud van boeken en spellen die in de shop getoond
          worden. De vaste slugs en visuals blijven behouden; je bewerkt hier de
          tekst, prijs, productlink en status.
        </p>
      </section>

      <CategoryEditor
        title="Boeken"
        category="books"
        items={form.books}
        onChange={updateItem}
      />

      <CategoryEditor
        title="Spellen"
        category="games"
        items={form.games}
        onChange={updateItem}
      />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? "Opslaan..." : "Shopcontent opslaan"}
        </button>

        {success ? (
          <span className="text-sm text-green-600">
            Shopcontent succesvol opgeslagen.
          </span>
        ) : null}

        {error ? (
          <span className="text-sm text-red-600">{error}</span>
        ) : null}
      </div>
    </form>
  );

  function CategoryEditor({
    title,
    category,
    items,
    onChange,
  }: {
    title: string;
    category: CategoryKey;
    items: CatalogItem[];
    onChange: <K extends keyof CatalogItem>(
      category: CategoryKey,
      index: number,
      key: K,
      value: CatalogItem[K]
    ) => void;
  }) {
    return (
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="mt-4 space-y-5">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-medium text-stone-900">{item.title}</h4>
                  <p className="text-xs text-stone-500">
                    slug: {item.id} • categorie: {item.category}
                  </p>
                </div>
                <span className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-700">
                  {item.palette}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Titel">
                  <input
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={item.title}
                    onChange={(e) =>
                      onChange(category, index, "title", e.target.value)
                    }
                  />
                </Field>

                <Field label="Format">
                  <input
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={item.format}
                    onChange={(e) =>
                      onChange(category, index, "format", e.target.value)
                    }
                  />
                </Field>

                <Field label="Tag">
                  <input
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={item.tag}
                    onChange={(e) =>
                      onChange(category, index, "tag", e.target.value)
                    }
                  />
                </Field>

                <Field label="Prijs (EUR)">
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={item.price}
                    onChange={(e) =>
                      onChange(category, index, "price", Number(e.target.value))
                    }
                  />
                </Field>

                <Field label="Status">
                  <select
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={item.status ?? "live"}
                    onChange={(e) =>
                      onChange(
                        category,
                        index,
                        "status",
                        e.target.value as CatalogItem["status"]
                      )
                    }
                  >
                    <option value="live">Live</option>
                    <option value="in_development">In ontwikkeling</option>
                  </select>
                </Field>

                <Field label="Productlink">
                  <input
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={item.href ?? ""}
                    onChange={(e) =>
                      onChange(category, index, "href", e.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4">
                <Field label="Korte beschrijving">
                  <textarea
                    className="mt-1 min-h-[88px] w-full rounded border px-3 py-2 text-sm"
                    value={item.description}
                    onChange={(e) =>
                      onChange(category, index, "description", e.target.value)
                    }
                  />
                </Field>

                <Field label="Meer info punten">
                  <textarea
                    className="mt-1 min-h-[120px] w-full rounded border px-3 py-2 text-sm"
                    value={detailsToText(item.details)}
                    onChange={(e) =>
                      onChange(
                        category,
                        index,
                        "details",
                        detailsFromText(e.target.value)
                      )
                    }
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    Zet ieder infopunt op een nieuwe regel.
                  </p>
                </Field>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-stone-800">
      {label}
      {children}
    </label>
  );
}
