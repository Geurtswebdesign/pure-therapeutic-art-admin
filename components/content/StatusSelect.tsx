"use client";

export type ContentStatus = "all" | "draft" | "published" | "archived";

export default function StatusSelect({
  value,
  onChange,
}: {
  value: ContentStatus;
  onChange: (value: ContentStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ContentStatus)}
      className="w-full border p-2 text-sm"
    >
      <option value="draft">Concept</option>
      <option value="published">Gepubliceerd</option>
      <option value="archived">Gearchiveerd</option>
    </select>
  );
}
