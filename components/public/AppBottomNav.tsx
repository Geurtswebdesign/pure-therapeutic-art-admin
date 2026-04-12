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
  labels: Record<TabKey, string>;
  native?: boolean;
};

const tabs: Array<{
  key: TabKey;
  href: string;
  icon: typeof Home;
}> = [
  { key: "home", href: "/", icon: Home },
  {
    key: "trainingen",
    href: "/trainingen",
    icon: CalendarDays,
  },
  { key: "shop", href: "/shop", icon: ShoppingBag },
  {
    key: "therapeuten",
    href: "/therapeuten",
    icon: Users,
  },
  { key: "profiel", href: "/account", icon: UserRound },
];

export default function AppBottomNav({
  active,
  labels,
  native = false,
}: Props) {
  const navClassName = native
    ? "absolute inset-x-0 bottom-0 z-30 border-t border-stone-200/90 bg-[rgba(250,247,243,0.98)] px-2 pb-[calc(env(safe-area-inset-bottom,0px)+5px)] pt-1.5 shadow-[0_-12px_28px_rgba(49,34,25,0.1)] backdrop-blur-xl"
    : "absolute inset-x-0 bottom-0 z-30 border-t border-stone-200/90 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2 shadow-[0_-14px_34px_rgba(49,34,25,0.12)] backdrop-blur";
  const listClassName = native
    ? "mx-auto grid max-w-xl grid-cols-5 gap-0.5"
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
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-1.5 py-1 text-[10px] leading-tight transition ${native ? "min-h-[45px] justify-center" : ""} ${
                  isActive
                    ? "bg-stone-100 text-stone-950"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{labels[tab.key]}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
