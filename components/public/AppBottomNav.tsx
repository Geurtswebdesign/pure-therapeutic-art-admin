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
  native?: boolean;
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

export default function AppBottomNav({ active, native = false }: Props) {
  const navClassName = native
    ? "absolute inset-x-0 bottom-0 z-30 border-t border-stone-200/90 bg-[rgba(250,247,243,0.98)] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-2 shadow-[0_-14px_34px_rgba(49,34,25,0.12)] backdrop-blur-xl"
    : "absolute inset-x-0 bottom-0 z-30 border-t border-stone-200/90 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2 shadow-[0_-14px_34px_rgba(49,34,25,0.12)] backdrop-blur";
  const listClassName = native
    ? "mx-auto grid max-w-xl grid-cols-5 gap-1"
    : "grid grid-cols-5 gap-1";

  return (
    <nav className={navClassName}>
      <ul className={listClassName}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === active;

          return (
            <li key={tab.key}>
              <a
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${native ? "min-h-[54px] justify-center" : ""} ${
                  isActive
                    ? "bg-stone-100 text-stone-950"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{tab.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
