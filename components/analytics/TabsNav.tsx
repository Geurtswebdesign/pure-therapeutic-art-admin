"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveAdminBrowserHref } from "@/lib/site/admin-client-paths";

type Tab = {
  label: string;
  href: string;
};

export default function TabsNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href = resolveAdminBrowserHref(pathname, tab.href);
        const isActive = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={`rounded border px-3 py-1.5 text-xs ${
              isActive ? "bg-black text-white" : "hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
