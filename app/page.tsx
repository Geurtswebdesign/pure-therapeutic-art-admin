import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/branding/logo.png";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";

export default async function Home() {
  const t = getAppMessages(resolveUiLanguage(await getPrimaryLanguage())).home;
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-8 py-16 text-center sm:px-16">
        <Image
          src={logo}
          alt="Pure Therapeutic ART logo"
          width={120}
          height={120}
          priority
        />
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-black">{t.title}</h1>
          <p className="text-zinc-700">
            {t.subtitle}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded bg-black px-5 py-2 text-white"
            href="/content"
          >
            {t.viewContent}
          </Link>
          <Link
            className="rounded border border-black px-5 py-2 text-black"
            href="/login"
          >
            {t.login}
          </Link>
        </div>
      </main>
    </div>
  );
}
