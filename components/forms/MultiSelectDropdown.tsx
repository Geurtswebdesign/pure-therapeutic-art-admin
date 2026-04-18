"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { mergeTherapistOptions } from "@/lib/users/therapistProfileOptions";

type Props = {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
};

function normalizeStringList(values: unknown) {
  if (!Array.isArray(values)) {
    return [] as string[];
  }

  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function summarizeSelection(values: string[], label: string) {
  if (!values.length) return label;
  if (values.length <= 2) return values.join(", ");
  return `${values.slice(0, 2).join(", ")} +${values.length - 2}`;
}

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const safeSelectedValues = useMemo(
    () => normalizeStringList(selectedValues),
    [selectedValues]
  );
  const mergedOptions = useMemo(
    () => mergeTherapistOptions(normalizeStringList(options), safeSelectedValues),
    [options, safeSelectedValues]
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function toggleValue(value: string) {
    const exists = safeSelectedValues.includes(value);
    if (exists) {
      onChange(safeSelectedValues.filter((entry) => entry !== value));
      return;
    }

    onChange([...safeSelectedValues, value]);
  }

  return (
    <div ref={rootRef} className="relative space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-stone-300 bg-white px-3 py-2 text-left text-sm text-stone-900"
      >
        <span className="truncate">{summarizeSelection(safeSelectedValues, label)}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-stone-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {safeSelectedValues.length ? (
        <div className="flex flex-wrap gap-2">
          {safeSelectedValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleValue(value)}
              className="inline-flex items-center gap-1 rounded-full bg-[#efe4da] px-3 py-1 text-xs text-stone-700"
            >
              <span>{value}</span>
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-lg">
          <div className="space-y-1">
            {mergedOptions.map((option) => {
              const checked = safeSelectedValues.includes(option);
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                    checked ? "bg-[#f4ece4] text-stone-900" : "text-stone-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(option)}
                    className="h-4 w-4 rounded border-stone-300"
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
