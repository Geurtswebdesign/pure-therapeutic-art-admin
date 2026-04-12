import type { ReactNode } from "react";
import Image from "next/image";
import logo from "@/assets/branding/logo.png";
import { getPublicBranding, getPublicHeaderOverride } from "@/lib/settings/public";
import { isNativeAppRequest } from "@/lib/native/isNativeAppRequest";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";
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
  const isNativeApp = await isNativeAppRequest();
  const language = resolveUiLanguage(await getAppLanguage());
  const nav = getPublicAppMessages(language).nav;

  const shellClassName = isNativeApp
    ? "h-[100svh] h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f3e4d9_0%,#efe5dc_26%,#f7f2ec_64%,#f9f7f3_100%)] px-0 pb-0 pt-0"
    : "h-[100svh] h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f3e4d9_0%,#efe5dc_26%,#f7f2ec_64%,#f9f7f3_100%)] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:px-6 sm:pb-6 sm:pt-6";
  const shellCardClassName = isNativeApp
    ? "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#fdfaf6_0%,#faf4ed_52%,#f7f1ea_100%)]"
    : "relative mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-stone-300/70 bg-[linear-gradient(180deg,#fdfaf6_0%,#faf4ed_52%,#f7f1ea_100%)] shadow-[0_30px_80px_rgba(49,34,25,0.18)]";
  const headerClassName = isNativeApp
    ? "shrink-0 border-b border-stone-200/75 bg-white/80 px-4 pb-4 pt-3 backdrop-blur-sm"
    : "shrink-0 border-b border-stone-200/80 px-5 pb-4 pt-5";
  const contentClassName = isNativeApp
    ? "min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(var(--app-bottom-nav-height)+1.5rem)] pt-4"
    : "min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(var(--app-bottom-nav-height)+1.25rem)] pt-5";

  return (
    <div className={shellClassName}>
      <div
        className={shellCardClassName}
        style={{
          ["--app-bottom-nav-height" as string]:
            isNativeApp
              ? "calc(env(safe-area-inset-bottom,0px) + 4.5rem)"
              : "calc(env(safe-area-inset-bottom,0px) + 5.75rem)",
        }}
      >
        <header className={headerClassName}>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0">
              {headerLogoUrl ? (
                <Image
                  src={headerLogoUrl}
                  alt={headerLogoAlt}
                  fill
                  sizes="48px"
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <Image
                  src={logo}
                  alt={branding.siteName}
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl leading-tight text-stone-900">
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

        <div className={contentClassName}>
          {children}
        </div>

        <AppBottomNav
          active={activeTab}
          labels={{
            home: nav.home,
            trainingen: nav.trainingen,
            shop: nav.shop,
            therapeuten: nav.therapeuten,
            profiel: nav.profiel,
          }}
          native={isNativeApp}
        />
      </div>
    </div>
  );
}
