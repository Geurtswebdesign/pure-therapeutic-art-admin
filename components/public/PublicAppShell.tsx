import type { ReactNode } from "react";
import Image from "next/image";
import logo from "@/assets/branding/logo.png";
import { getPublicBranding } from "@/lib/settings/public";
import AppBottomNav from "@/components/public/AppBottomNav";

type Props = {
  activeTab: "home" | "trainingen" | "shop" | "therapeuten" | "profiel";
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export default async function PublicAppShell({
  activeTab,
  title,
  subtitle,
  children,
}: Props) {
  const branding = await getPublicBranding();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#efe5dc_0%,#f7f2ec_30%,#f9f7f3_100%)] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-stone-300/70 bg-[#fcfaf6] shadow-[0_30px_80px_rgba(49,34,25,0.18)]">
        <header className="border-b border-stone-200/80 px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt={`${branding.siteName} logo`}
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 object-contain"
              />
            ) : (
              <Image
                src={logo}
                alt={branding.siteName}
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            )}
            <div className="min-w-0">
              <div className="truncate font-serif text-xl leading-tight text-stone-900">
                {branding.siteName}
              </div>
              {subtitle ? (
                <div className="truncate text-xs uppercase tracking-[0.22em] text-stone-500">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>

          {title ? (
            <div className="mt-4">
              <h1 className="font-serif text-3xl leading-tight text-stone-950">
                {title}
              </h1>
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5">{children}</div>

        <AppBottomNav active={activeTab} />
      </div>
    </div>
  );
}
