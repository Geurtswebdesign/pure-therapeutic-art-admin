"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { label: "Overview", tab: "overview" },
  { label: "Credits", tab: "credits" },
  { label: "Wallets", tab: "wallets" },
  { label: "Transacties", tab: "transactions" },
];

export default function AdministrationTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "overview";

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
