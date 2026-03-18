"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveAdminBrowserPath } from "@/lib/site/admin-client-paths";

const ranges = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

export default function RangeTabs({
  basePath,
  value,
}: {
  basePath: string;
  value?: string;
}) {
  const pathname = usePathname();
  const resolvedBasePath = resolveAdminBrowserPath(pathname, basePath);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
      {ranges.map((item) => (
        <Link
          key={item.value}
          href={`${resolvedBasePath}?range=${item.value}`}
          className={`rounded border px-2.5 py-1 ${
            value === item.value ? "bg-black text-white" : "hover:bg-gray-50"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
