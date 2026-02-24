"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getAdminNav } from "@/components/admin/nav";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default function AdminSidebar({ language = "nl" }: { language?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOverride, setMenuOverride] = useState<string | null>(null);
  const t = getAdminMessages(resolveUiLanguage(language));
  const adminNav = getAdminNav(language);

  function hrefMatches(href: string) {
    const [targetPath, queryString] = href.split("?");
    if (pathname !== targetPath) return false;
    if (!queryString) return true;

    const targetParams = new URLSearchParams(queryString);
    for (const [key, value] of targetParams.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  }

  const activeParentLabel =
    adminNav.find(
      (item) =>
        "children" in item &&
        item.children?.some((c) => pathname === c.href.split("?")[0])
    )?.label ?? null;

  const openMenu =
    menuOverride === ""
      ? null
      : menuOverride ?? activeParentLabel;

  return (
    <aside className="w-56 bg-[#1d2327] text-white flex-shrink-0">
      <div className="px-4 py-4 text-sm font-semibold border-b border-white/10">
        {t.adminLabel}
      </div>

      <nav className="py-2 text-sm">
        {adminNav.map((item) => {
          /* ======================
             Simpel menu-item
             ====================== */
          if (item.href) {
            const active = hrefMatches(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 ${
                  active
                    ? "bg-[#2271b1] text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          }

          /* ======================
             Menu met submenu
             ====================== */
          const isOpen = openMenu === item.label;
          const isActive = (item.children ?? []).some((c) =>
            pathname.startsWith(c.href)
          );

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() =>
                  setMenuOverride(isOpen ? "" : item.label)
                }
                className={`w-full flex items-center justify-between px-4 py-2 ${
                  isActive
                    ? "text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>

                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {(item.children ?? []).map((child) => {
                    const active = hrefMatches(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-1.5 rounded text-sm ${
                          active
                            ? "bg-[#2271b1] text-white"
                            : "text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
