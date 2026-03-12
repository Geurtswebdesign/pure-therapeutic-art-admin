"use client";

import { useState } from "react";
import MediaPicker from "@/components/content/media/MediaPicker";
import { supabase } from "@/lib/supabase/browser";

type PickedMedia = {
  alt: string;
  url: string;
};

export default function ThemeMediaPickerDialog({
  open,
  title,
  onClose,
  onPick,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onPick: (media: PickedMedia) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  if (!open) return null;

  async function handleSelect(ids: string[]) {
    const pickedId = ids[0];
    if (!pickedId) return;

    setError(null);
    setIsResolving(true);

    const { data, error: queryError } = await supabase
      .from("media_assets")
      .select("file_path, alt_text")
      .eq("id", pickedId)
      .maybeSingle<{ alt_text: string | null; file_path: string }>();

    setIsResolving(false);

    if (queryError || !data?.file_path) {
      setError("Afbeelding laden mislukt.");
      return;
    }

    const url = data.file_path.startsWith("http")
      ? data.file_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.file_path}`;

    onPick({
      alt: data.alt_text ?? "",
      url,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-stone-900">{title}</h4>
            <p className="mt-1 text-sm text-stone-600">
              Kies een bestand uit de mediatheek. De publieke URL en alt-tekst
              worden direct ingevuld.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-stone-300 px-3 py-1.5 text-sm"
          >
            Sluiten
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isResolving ? (
          <div className="mt-4 rounded border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            Bestand wordt geladen...
          </div>
        ) : null}

        <div className="mt-4 max-h-[70vh] overflow-auto rounded-lg border border-stone-200 p-3">
          <MediaPicker onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
}
