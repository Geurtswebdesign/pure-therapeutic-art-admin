"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default function SettingsTabs({ language = "nl" }: { language?: string }) {
  const pathname = usePathname();
  const labels = getAdminMessages(resolveUiLanguage(language)).nav;
  const tabs = [
    { label: labels.general, href: "/admin/settings/general" },
    { label: labels.security, href: "/admin/settings/security" },
    { label: labels.app, href: "/admin/settings/app" },
    { label: labels.shop, href: "/admin/settings/shop" },
    { label: labels.email, href: "/admin/settings/email" },
    { label: labels.system, href: "/admin/settings/system" },
  ];

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
