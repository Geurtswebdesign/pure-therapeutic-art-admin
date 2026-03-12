import {
  ChartColumnIncreasing,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export type AdminNavItem = {
  label: string;
  href?: string;
  icon: ReactNode;
  children?: {
    label: string;
    href: string;
  }[];
};

export function getAdminNav(language: string): AdminNavItem[] {
  const t = getAdminMessages(resolveUiLanguage(language)).nav;

  return [
    {
      label: t.dashboard,
      href: "/admin/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: t.users,
      icon: <Users size={18} />,
      children: [
        { label: t.usersList, href: "/admin/users" },
        { label: t.newUser, href: "/admin/users/new" },
      ],
    },
    {
      label: t.administration,
      icon: <WalletCards size={18} />,
      children: [
        { label: t.overview, href: "/admin/administration" },
        { label: t.credits, href: "/admin/administration?tab=credits" },
        { label: t.wallets, href: "/admin/administration?tab=wallets" },
        { label: t.transactions, href: "/admin/administration?tab=transactions" },
      ],
    },
    {
      label: t.content,
      icon: <FileText size={18} />,
      children: [
        { label: t.items, href: "/admin/content" },
        { label: t.newItem, href: "/admin/content/new" },
        { label: t.themes, href: "/admin/content/themes" },
        { label: t.categories, href: "/admin/content/taxonomies/category/terms" },
        { label: t.tags, href: "/admin/content/taxonomies/tag/terms" },
        { label: t.media, href: "/admin/media" },
      ],
    },
    {
      label: t.insights,
      href: "/admin/insights",
      icon: <ChartColumnIncreasing size={18} />,
    },
    {
      label: t.settings,
      icon: <Settings size={18} />,
      children: [
        { label: t.general, href: "/admin/settings/general" },
        { label: t.security, href: "/admin/settings/security" },
        { label: t.app, href: "/admin/settings/app" },
        { label: t.email, href: "/admin/settings/email" },
        { label: t.system, href: "/admin/settings/system" },
      ],
    },
  ];
}
