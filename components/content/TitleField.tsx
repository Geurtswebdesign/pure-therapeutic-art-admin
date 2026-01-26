"use client";

import { useId } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

/**
 * Draft-only title input.
 *
 * Important: this component MUST NOT persist anything.
 * Persistence happens exclusively via the Save/Publish buttons.
 */
export default function TitleField({
  value,
  onChange,
  placeholder = "Titel toevoegen",
}: Props) {
  const id = useId();

  return (
    <div className="mb-6">
      <label htmlFor={id} className="sr-only">
        Titel
      </label>

      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-3xl font-semibold outline-none bg-transparent"
        autoComplete="off"
      />

      {/*
        Note: No “saved” indicator here. The canonical state is controlled by the parent:
        dirty=true until the user explicitly saves.
      */}
    </div>
  );
}
