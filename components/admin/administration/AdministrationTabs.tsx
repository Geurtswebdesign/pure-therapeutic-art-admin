"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default function AdministrationTabs({ language = "nl" }: { language?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "overview";
  const t = getAdminMessages(resolveUiLanguage(language)).nav;
  const tabs = [
    { label: t.overview, tab: "overview" },
    { label: t.credits, tab: "credits" },
    { label: t.wallets, tab: "wallets" },
    { label: t.transactions, tab: "transactions" },
  ];

  return (
    <div className="flex flex-wrap gap-2 border-b pb-2">
      {tabs.map((item) => {
        const params = new URLSearchParams(searchParams.toString());
        if (item.tab === "overview") {
          params.delete("tab");
        } else {
          params.set("tab", item.tab);
        }

        const href = params.toString() ? `${pathname}?${params}` : pathname;
        const isActive = active === item.tab;

        return (
          <Link
            key={item.tab}
            href={href}
            className={[
              "rounded px-3 py-1.5 text-sm",
              isActive ? "bg-black text-white" : "hover:bg-gray-100",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
