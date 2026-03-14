"use client";

import { useRouter } from "next/navigation";

type MonthOption = {
  value: string;
  label: string;
};

export default function MonthFilter({
  basePath,
  month,
  range,
  options,
}: {
  basePath: string;
  month?: string;
  range?: string;
  options: MonthOption[];
}) {
  const router = useRouter();

  function handleChange(nextMonth: string) {
    const params = new URLSearchParams();

    if (range) {
      params.set("range", range);
    }

    if (nextMonth) {
      params.set("month", nextMonth);
    }

    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <label className="flex items-center gap-2 text-xs text-gray-600">
      <span className="font-medium text-gray-700">Maand</span>
      <select
        value={month ?? ""}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded border bg-white px-3 py-1.5 text-xs text-gray-700"
      >
        <option value="">Gebruik range</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
