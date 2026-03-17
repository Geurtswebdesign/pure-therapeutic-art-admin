"use client";

import type { ChangeEvent } from "react";
import Link from "next/link";
import { useRef, useState } from "react";
import Image from "next/image";
import MediaPicker from "@/components/content/media/MediaPicker";
import { supabase } from "@/lib/supabase/browser";
import { uploadMediaAssetClient } from "@/lib/content/uploadClient";
import { getCatalogItemPath, type CatalogItem } from "@/lib/shop/catalog-shared";

type ShopEditorDraft = {
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  introTitle: string;
  introText: string;
  descriptionTitle: string;
  detailsTitle: string;
  purchaseTitle: string;
  purchaseDescription: string;
  purchaseButtonLabel: string;
  developmentStateLabel: string;
  unavailablePriceLabel: string;
  developmentCalloutLabel: string;
  developmentPurchaseText: string;
  developmentNotice: string;
  description: string;
  details: string[];
  format: string;
  tag: string;
  price: number;
  href: string;
  status: CatalogItem["status"];
};

type BoxKey =
  | "publication"
  | "permalink"
  | "featured"
  | "labels"
  | "shop";

type Props = {
  item: CatalogItem;
  draft: ShopEditorDraft;
  dirty: boolean;
  saving: boolean;
  success: boolean;
  error: string | null;
  onDraftChange: (patch: Partial<ShopEditorDraft>) => void;
  onSaveAll: () => Promise<void>;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function ShopMetadataSidebar({
  item,
  draft,
  dirty,
  saving,
  success,
  error,
  onDraftChange,
  onSaveAll,
}: Props) {
  const [openBox, setOpenBox] = useState<BoxKey>("permalink");
  const [pickingFeatured, setPickingFeatured] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canSave = dirty && !saving;
  const publicPath = getCatalogItemPath(item);
  const isInDevelopment = draft.status === "in_development";
  const isPubliclyVisible = draft.status !== "concept";

  async function handlePickFeatured(ids: string[]) {
    const pickedId = ids[0];
    if (!pickedId) return;

    const { data } = await supabase
      .from("media_assets")
      .select("file_path, alt_text")
      .eq("id", pickedId)
      .maybeSingle();

    if (!data?.file_path) return;

    const url = data.file_path.startsWith("http")
      ? data.file_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.file_path}`;

    onDraftChange({
      imageUrl: url,
      imageAlt: data.alt_text ?? "",
    });
    setUploadError(null);
    setPickingFeatured(false);
  }

  async function handleUploadFeatured(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploadingFeatured(true);

    try {
      const url = await uploadMediaAssetClient(file, `shop/${item.id}`);
      onDraftChange({
        imageUrl: url,
        imageAlt: draft.imageAlt || draft.title,
      });
      setPickingFeatured(false);
    } catch {
      setUploadError("Afbeelding uploaden mislukt. Probeer opnieuw.");
    } finally {
      setUploadingFeatured(false);
    }
  }

  function renderBox(key: BoxKey, title: string, content: React.ReactNode) {
    const isPublication = key === "publication";
    const isOpen = isPublication || openBox === key;

    return (
      <section className="rounded border bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
          onClick={() => {
            if (!isPublication) setOpenBox(key);
          }}
        >
          <span>{title}</span>
          <span className="text-gray-500">{isOpen ? "▾" : "▸"}</span>
        </button>
        {isOpen ? <div className="border-t px-4 py-4 text-sm">{content}</div> : null}
      </section>
    );
  }

  return (
    <aside className="w-96 space-y-4 border-l bg-gray-50 p-4">
      {renderBox(
        "publication",
        "Publicatie",
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void onSaveAll()}
              className="rounded border px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Wijzigingen opslaan"}
            </button>

            {isPubliclyVisible ? (
              <a
                href={publicPath}
                target="_blank"
                rel="noreferrer"
                className="rounded border px-3 py-2 text-sm hover:bg-gray-100"
              >
                Bekijk live
              </a>
            ) : (
              <div className="rounded border border-dashed px-3 py-2 text-sm text-gray-500">
                Concept is niet zichtbaar in de shop
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="block text-xs text-gray-600">Status</span>
            <select
              value={draft.status ?? "concept"}
              onChange={(event) =>
                onDraftChange({
                  status: event.target.value as CatalogItem["status"],
                })
              }
              className="w-full rounded border px-2 py-1"
            >
              <option value="concept">Concept</option>
              <option value="live">Live</option>
              <option value="in_development">In ontwikkeling</option>
            </select>
          </div>

          {!isPubliclyVisible ? (
            <p className="text-xs leading-5 text-gray-500">
              Concept-items blijven alleen zichtbaar in de admin en worden niet
              getoond in de shop.
            </p>
          ) : null}

          <div className="space-y-1 text-xs text-gray-600">
            <div>Categorie: {item.category}</div>
            <div>Slug: {item.id}</div>
          </div>

          {success ? (
            <p className="text-sm text-green-600">
              Shop-item succesvol opgeslagen.
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Link
            href="/admin/shop"
            className="inline-flex text-sm text-blue-700 hover:underline"
          >
            Terug naar shop-items
          </Link>
        </div>
      )}

      {renderBox(
        "permalink",
        "Permalink",
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-600">Publieke route</div>
            <div className="mt-1 break-all rounded border bg-gray-50 px-3 py-2 text-sm text-stone-800">
              {publicPath}
            </div>
          </div>

          <label className="block space-y-1">
            <span className="block text-xs text-gray-600">Productlink</span>
            <input
              value={draft.href}
              onChange={(event) =>
                onDraftChange({ href: event.target.value })
              }
              className="w-full rounded border px-2 py-1"
            />
          </label>
        </div>
      )}

      {renderBox(
        "featured",
        "Afbeelding",
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadFeatured}
          />

          {draft.imageUrl ? (
            <div className="space-y-2">
              <Image
                src={draft.imageUrl}
                alt={draft.imageAlt || draft.title || "Shopafbeelding"}
                width={480}
                height={360}
                unoptimized
                className="h-auto w-full rounded border object-cover"
              />
              <input
                value={draft.imageAlt}
                onChange={(event) =>
                  onDraftChange({ imageAlt: event.target.value })
                }
                className="w-full rounded border px-2 py-1"
                placeholder="Alt-tekst"
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Nog geen shopafbeelding geselecteerd.
            </p>
          )}

          {!pickingFeatured ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 hover:bg-gray-100"
                onClick={() => setPickingFeatured(true)}
              >
                Kies uit mediatheek
              </button>
              <button
                type="button"
                disabled={uploadingFeatured}
                className="rounded border px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingFeatured ? "Uploaden..." : "Uploaden"}
              </button>
              {draft.imageUrl ? (
                <button
                  type="button"
                  className="rounded border px-3 py-1 text-red-600 hover:bg-red-50"
                  onClick={() =>
                    onDraftChange({ imageUrl: "", imageAlt: "" })
                  }
                >
                  Verwijderen
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={uploadingFeatured}
                  className="rounded border px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingFeatured ? "Uploaden..." : "Nieuwe afbeelding uploaden"}
                </button>
              </div>
              <MediaPicker onSelect={handlePickFeatured} />
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setPickingFeatured(false)}
              >
                Sluiten
              </button>
            </div>
          )}

          {uploadError ? (
            <p className="text-xs text-red-600">{uploadError}</p>
          ) : null}
        </div>
      )}

      {renderBox(
        "labels",
        "Extra labels",
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="block text-xs text-gray-600">Label koopknop</span>
            <input
              value={draft.purchaseButtonLabel}
              onChange={(event) =>
                onDraftChange({ purchaseButtonLabel: event.target.value })
              }
              className="w-full rounded border px-2 py-1"
            />
          </label>

          {isInDevelopment ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="block text-xs text-gray-600">
                    Label status ontwikkeling
                  </span>
                  <input
                    value={draft.developmentStateLabel}
                    onChange={(event) =>
                      onDraftChange({
                        developmentStateLabel: event.target.value,
                      })
                    }
                    className="w-full rounded border px-2 py-1"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="block text-xs text-gray-600">
                    Label niet beschikbaar
                  </span>
                  <input
                    value={draft.unavailablePriceLabel}
                    onChange={(event) =>
                      onDraftChange({
                        unavailablePriceLabel: event.target.value,
                      })
                    }
                    className="w-full rounded border px-2 py-1"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="block text-xs text-gray-600">
                  Label ontwikkeling callout
                </span>
                <input
                  value={draft.developmentCalloutLabel}
                  onChange={(event) =>
                    onDraftChange({
                      developmentCalloutLabel: event.target.value,
                    })
                  }
                  className="w-full rounded border px-2 py-1"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text-xs text-gray-600">
                  Tekst ontwikkeling bestelblok
                </span>
                <textarea
                  value={draft.developmentPurchaseText}
                  onChange={(event) =>
                    onDraftChange({
                      developmentPurchaseText: event.target.value,
                    })
                  }
                  className="min-h-[100px] w-full rounded border px-2 py-2"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text-xs text-gray-600">
                  Melding onderaan bij ontwikkeling
                </span>
                <textarea
                  value={draft.developmentNotice}
                  onChange={(event) =>
                    onDraftChange({ developmentNotice: event.target.value })
                  }
                  className="min-h-[120px] w-full rounded border px-2 py-2"
                />
              </label>
            </>
          ) : (
            <p className="text-xs leading-5 text-gray-500">
              Ontwikkelteksten en meldingen worden pas gebruikt als de status op
              In ontwikkeling staat.
            </p>
          )}
        </div>
      )}

      {renderBox(
        "shop",
        "Shopgegevens",
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="block text-xs text-gray-600">Format</span>
            <input
              value={draft.format}
              onChange={(event) =>
                onDraftChange({ format: event.target.value })
              }
              className="w-full rounded border px-2 py-1"
            />
          </label>

          <label className="block space-y-1">
            <span className="block text-xs text-gray-600">Tag</span>
            <input
              value={draft.tag}
              onChange={(event) =>
                onDraftChange({ tag: event.target.value })
              }
              className="w-full rounded border px-2 py-1"
            />
          </label>

          <label className="block space-y-1">
            <span className="block text-xs text-gray-600">Prijs (EUR)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.price}
              onChange={(event) =>
                onDraftChange({
                  price: Number(event.target.value) || 0,
                })
              }
              className="w-full rounded border px-2 py-1"
            />
            <span className="block text-xs text-gray-500">
              Huidige weergave: {formatPrice(draft.price)}
            </span>
          </label>
        </div>
      )}
    </aside>
  );
}
