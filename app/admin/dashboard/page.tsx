import Link from "next/link";
import "@/styles/globals.css";
import "@/styles/content.css";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default async function AdminDashboardPage() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAdminMessages(language).dashboard;

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t.title}</h1>
        <p className="text-sm text-gray-600">
          {t.subtitle}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link className="rounded border bg-white p-4 hover:bg-gray-50" href="/admin/users">
          <h2 className="font-semibold">{t.users}</h2>
          <p className="mt-1 text-sm text-gray-600">{t.usersDesc}</p>
        </Link>
        <Link className="rounded border bg-white p-4 hover:bg-gray-50" href="/admin/administration">
          <h2 className="font-semibold">{t.administration}</h2>
          <p className="mt-1 text-sm text-gray-600">{t.administrationDesc}</p>
        </Link>
        <Link className="rounded border bg-white p-4 hover:bg-gray-50" href="/admin/content">
          <h2 className="font-semibold">{t.content}</h2>
          <p className="mt-1 text-sm text-gray-600">{t.contentDesc}</p>
        </Link>
      </div>
    </div>
  );
}
