import type { ReactNode } from "react";
import Image from "next/image";
import logo from "@/assets/branding/logo.png";
import { getPublicBranding, getPublicHeaderOverride } from "@/lib/settings/public";
import AppBottomNav from "@/components/public/AppBottomNav";

type Props = {
  activeTab: "home" | "trainingen" | "shop" | "therapeuten" | "profiel";
  title?: string;
  subtitle?: string;
  headerCategorySlug?: string;
  headerPage?: string;
  children: ReactNode;
};

export default async function PublicAppShell({
  activeTab,
  title,
  subtitle,
  headerCategorySlug,
  headerPage,
  children,
}: Props) {
  const branding = await getPublicBranding();
  const headerOverride = await getPublicHeaderOverride({
    categorySlug: headerCategorySlug ?? null,
    route: activeTab,
    page: headerPage ?? null,
  });
  const headerLogoUrl = headerOverride?.logoUrl ?? branding.logoUrl;
  const headerLogoAlt = headerOverride?.logoAlt ?? `${branding.siteName} logo`;
  const headerSubtitle = headerOverride?.subtitle || subtitle;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f3e4d9_0%,#efe5dc_26%,#f7f2ec_64%,#f9f7f3_100%)] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-stone-300/70 bg-[linear-gradient(180deg,#fdfaf6_0%,#faf4ed_52%,#f7f1ea_100%)] shadow-[0_30px_80px_rgba(49,34,25,0.18)]">
        <header className="border-b border-stone-200/80 px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            {headerLogoUrl ? (
              <Image
                src={headerLogoUrl}
                alt={headerLogoAlt}
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
              {headerSubtitle ? (
                <div className="truncate text-xs uppercase tracking-[0.22em] text-stone-500">
                  {headerSubtitle}
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
