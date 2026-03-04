"use client";

import Link from "next/link";
import {
  CalendarDays,
  Home,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";

type TabKey = "home" | "trainingen" | "shop" | "therapeuten" | "profiel";

type Props = {
  active: TabKey;
};

const tabs: Array<{
  key: TabKey;
  label: string;
  href: string;
  icon: typeof Home;
}> = [
  { key: "home", label: "Home", href: "/", icon: Home },
  {
    key: "trainingen",
    label: "Trainingen",
    href: "/trainingen",
    icon: CalendarDays,
  },
  { key: "shop", label: "Shop", href: "/shop", icon: ShoppingBag },
  {
    key: "therapeuten",
    label: "Therapeuten",
    href: "/therapeuten",
    icon: Users,
  },
  { key: "profiel", label: "Profiel", href: "/account", icon: UserRound },
];

export default function AppBottomNav({ active }: Props) {
  return (
    <nav className="sticky bottom-0 z-20 mt-6 border-t border-stone-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2 backdrop-blur">
      <ul className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === active;

          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
                  isActive
                    ? "bg-stone-100 text-stone-950"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
