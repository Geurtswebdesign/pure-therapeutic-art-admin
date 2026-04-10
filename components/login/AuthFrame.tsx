import Image from "next/image";
import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/branding/logo.png";
import type { BaseUiLanguage } from "@/lib/i18n/runtime";

export const AUTH_FRAME_COPY: Record<
  BaseUiLanguage,
  {
    eyebrow: string;
    backHome: string;
  }
> = {
  nl: {
    eyebrow: "Veilige toegang",
    backHome: "Terug naar home",
  },
  en: {
    eyebrow: "Secure access",
    backHome: "Back to home",
  },
  de: {
    eyebrow: "Sicherer Zugang",
    backHome: "Zuruck zur Startseite",
  },
};

type AuthShellProps = {
  siteName: string;
  logoUrl: string | null;
  title: string;
  eyebrow: string;
  backLabel: string;
  backHref: string;
  isNativeApp?: boolean;
  maxWidthClassName?: string;
  children: ReactNode;
};

export function AuthShell({
  siteName,
  logoUrl,
  title,
  eyebrow,
  backLabel,
  backHref,
  isNativeApp = false,
  maxWidthClassName = "max-w-md",
  children,
}: AuthShellProps) {
  const shellClassName = isNativeApp
    ? "h-[100svh] h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f3e4d9_0%,#efe5dc_26%,#f7f2ec_64%,#f9f7f3_100%)] px-0 pb-0 pt-0"
    : "min-h-[100svh] min-h-[100dvh] bg-[linear-gradient(180deg,#f3e4d9_0%,#efe5dc_26%,#f7f2ec_64%,#f9f7f3_100%)] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:px-6 sm:pb-6 sm:pt-6";
  const wrapperClassName = isNativeApp
    ? "h-full w-full"
    : `mx-auto w-full ${maxWidthClassName}`;
  const cardClassName = isNativeApp
    ? "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#fdfaf6_0%,#faf4ed_52%,#f7f1ea_100%)]"
    : "overflow-hidden rounded-[2rem] border border-stone-300/70 bg-[linear-gradient(180deg,#fdfaf6_0%,#faf4ed_52%,#f7f1ea_100%)] shadow-[0_30px_80px_rgba(49,34,25,0.18)]";
  const headerClassName = isNativeApp
    ? "shrink-0 border-b border-stone-200/75 bg-white/80 px-4 pb-4 pt-3 backdrop-blur-sm"
    : "border-b border-stone-200/80 px-5 pb-5 pt-5";
  const contentClassName = isNativeApp
    ? "min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6"
    : "px-4 py-5 sm:px-5 sm:py-6";

  return (
    <div className={shellClassName}>
      <div className={wrapperClassName}>
        <div className={cardClassName}>
          <header className={headerClassName}>
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${siteName} logo`}
                    fill
                    sizes="48px"
                    unoptimized
                    className="object-contain"
                  />
                ) : (
                  <Image
                    src={logo}
                    alt={siteName}
                    fill
                    sizes="48px"
                    className="object-contain"
                    priority
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xl leading-tight text-stone-900">
                  {siteName}
                </div>
                <div className="truncate text-xs uppercase tracking-[0.22em] text-stone-500">
                  {eyebrow}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start justify-between gap-3">
              <h1 className="font-serif text-3xl leading-tight text-stone-950">
                {title}
              </h1>
              <Link
                href={backHref}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#decfbe] bg-white/80 px-3 py-2 text-xs font-medium text-stone-700 shadow-sm"
              >
                <ArrowLeft size={14} strokeWidth={1.8} />
                {backLabel}
              </Link>
            </div>
          </header>

          <div className={contentClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

export function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-[1rem] border border-[#d9cbbb] bg-white px-3 py-3 text-base text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#c68567] focus:ring-2 focus:ring-[#ecd2c2] sm:text-sm"
    />
  );
}
