"use client";

import { useMemo, useState, useTransition } from "react";
import { Globe, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { updateMyPreferredLanguage } from "@/app/account/actions";

type Props = {
  triggerLabel: string;
  currentLanguage: UiLanguage;
  title: string;
  subtitle: string;
  saveLabel: string;
  savingLabel: string;
  cancelLabel: string;
};

export default function LanguagePreferenceDialog({
  triggerLabel,
  currentLanguage,
  title,
  subtitle,
  saveLabel,
  savingLabel,
  cancelLabel,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<UiLanguage>(currentLanguage);
  const [isPending, startTransition] = useTransition();
  const activeLanguageLabel = useMemo(
    () =>
      LANGUAGE_OPTIONS.find((option) => option.code === currentLanguage)?.label ??
      "Nederlands",
    [currentLanguage]
  );

  function handleSave() {
    startTransition(async () => {
      await updateMyPreferredLanguage(selectedLanguage);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-stone-900 transition hover:bg-[#fcf8f4]"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-stone-700">
          <Globe size={18} strokeWidth={1.8} />
        </span>
        <span className="font-serif text-[1.15rem] leading-none">{triggerLabel}</span>
        <span className="ml-auto text-xs text-stone-500">{activeLanguageLabel}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/35 px-4">
          <div className="w-full max-w-sm rounded-[1.5rem] border border-[#e5dbcf] bg-[#f7f0e9] p-4 shadow-[0_24px_70px_rgba(28,25,23,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl text-stone-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-stone-300 bg-white p-2 text-stone-700"
                aria-label={cancelLabel}
              >
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {LANGUAGE_OPTIONS.map((option) => (
                <label
                  key={option.code}
                  className="flex items-center gap-3 rounded-2xl border border-[#e5dbcf] bg-white px-4 py-3"
                >
                  <input
                    type="radio"
                    name="preferred-language"
                    value={option.code}
                    checked={selectedLanguage === option.code}
                    onChange={() => setSelectedLanguage(option.code as UiLanguage)}
                    className="h-4 w-4 border-stone-300"
                  />
                  <span className="text-sm text-stone-800">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-full bg-[#b64040] px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {isPending ? savingLabel : saveLabel}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 disabled:opacity-60"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
