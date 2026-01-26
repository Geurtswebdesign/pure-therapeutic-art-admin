"use client";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

/**
 * Draft-only plain textarea editor.
 *
 * This is intentionally persistence-free (no Supabase calls, no effects).
 */
export default function BodyEditor({
  value,
  onChange,
  placeholder = "Begin met schrijven…",
}: Props) {
  return (
    <div className="mb-6">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full min-h-[200px]
          resize-none bg-transparent
          outline-none
          text-base leading-relaxed
        "
      />
    </div>
  );
}
