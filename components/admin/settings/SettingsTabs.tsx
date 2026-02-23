"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Algemeen", href: "/admin/settings/general" },
  { label: "Beveiliging", href: "/admin/settings/security" },
  { label: "App", href: "/admin/settings/app" },
  { label: "Email", href: "/admin/settings/email" },
  { label: "Systeem", href: "/admin/settings/system" },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b pb-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "rounded px-3 py-1.5 text-sm",
              active ? "bg-black text-white" : "hover:bg-gray-100",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
