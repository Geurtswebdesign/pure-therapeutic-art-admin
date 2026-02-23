import {
  ChartColumnIncreasing,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

export type AdminNavItem = {
  label: string;
  href?: string;
  icon: ReactNode;
  children?: {
    label: string;
    href: string;
  }[];
};

export const adminNav: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Algemeen",
    href: "/admin/settings/general",
    icon: <Shield size={18} />,
  },
  {
    label: "Gebruikers",
    icon: <Users size={18} />,
    children: [
      { label: "Gebruikerslijst", href: "/admin/users" },
      { label: "Nieuwe gebruiker", href: "/admin/users/new" },
    ],
  },
  {
    label: "Administratie",
    icon: <WalletCards size={18} />,
    children: [
      { label: "Overzicht", href: "/admin/administration" },
      { label: "Credits", href: "/admin/administration?tab=credits" },
      { label: "Wallets", href: "/admin/administration?tab=wallets" },
      { label: "Transacties", href: "/admin/administration?tab=transactions" },
    ],
  },
  {
    label: "Content",
    icon: <FileText size={18} />,
    children: [
      { label: "Items", href: "/admin/content" },
      { label: "Nieuw item", href: "/admin/content/new" },
      { label: "Categorieen", href: "/admin/content/taxonomies/category/terms" },
      { label: "Tags", href: "/admin/content/taxonomies/tag/terms" },
      { label: "Media", href: "/admin/media" },
    ],
  },
  {
    label: "Inzichten",
    href: "/admin/insights",
    icon: <ChartColumnIncreasing size={18} />,
  },
  {
    label: "Instellingen",
    icon: <Settings size={18} />,
    children: [
      { label: "Algemeen", href: "/admin/settings/general" },
      { label: "Beveiliging", href: "/admin/settings/security" },
      { label: "App", href: "/admin/settings/app" },
      { label: "Email", href: "/admin/settings/email" },
      { label: "Systeem", href: "/admin/settings/system" },
    ],
  },
];
