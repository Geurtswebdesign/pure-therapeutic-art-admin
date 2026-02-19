"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ChevronDown,
  LayoutGrid,
  Image as ImageIcon,
} from "lucide-react";

type MenuItem =
  | {
      label: string;
      href: string;
      icon: React.ReactNode;
    }
  | {
      label: string;
      icon: React.ReactNode;
      children: {
        label: string;
        href: string;
      }[];
    };

const menu: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Users",
    icon: <Users size={18} />,
    children: [
      { label: "All users", href: "/admin/users" },
      { label: "Add new", href: "/admin/users/new" },
    ],
  },
  {
    label: "pagina's",
    icon: <FileText size={18} />,
    children: [
      { label: "Alle pagina's", href: "/admin/content" },
      { label: "Nieuwe pagina's", href: "/admin/content/new" },
      { label: "Categorieen", href: "/admin/content/taxonomies/category/terms" },
      { label: "Tags", href: "/admin/content/tags" },
    ],
  },
  {
    label: "Media",
    icon: <ImageIcon size={18} />,
    children: [
      { label: "Bibliotheek", href: "/admin/media" },
      { label: "Nieuw bestand", href: "/admin/media?tab=upload" },
    ],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings size={18} />,
  },

  {
    label: "Administratie",
    href: "/admin/administratie",
    icon: <LayoutGrid size={18} />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [menuOverride, setMenuOverride] = useState<string | null>(null);

  const activeParentLabel =
    menu.find(
      (item) =>
        "children" in item &&
        item.children.some((c) => pathname.startsWith(c.href))
    )?.label ?? null;

  const openMenu =
    menuOverride === ""
      ? null
      : menuOverride ?? activeParentLabel;

  return (
    <aside className="w-56 bg-[#1d2327] text-white flex-shrink-0">
      <div className="px-4 py-4 text-sm font-semibold border-b border-white/10">
        Admin
      </div>

      <nav className="py-2 text-sm">
        {menu.map((item) => {
          /* ======================
             Simpel menu-item
             ====================== */
          if ("href" in item) {
            const active = pathname === item.href;

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
          const isActive = item.children.some((c) =>
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
                  {item.children.map((child) => {
                    const active = pathname === child.href;

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
