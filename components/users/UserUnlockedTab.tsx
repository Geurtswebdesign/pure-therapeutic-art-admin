"use client";

import Link from "next/link";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Unlock = {
  id: string;
  credits_spent: number;
  unlocked_at: string;
  content_item: {
    id: string;
    title: string;
    slug: string;
    credit_cost: number;
    categories: string[];
  } | null;
};

export default function UserUnlockedTab({
  items,
  language,
}: {
  items: Unlock[];
  language: UiLanguage;
}) {
  const t = getAppMessages(language).unlockedTable;
  const locale = language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  if (!items.length) {
    return (
      <div className="text-sm text-gray-500">
        {t.noUnlocked}
      </div>
    );
  }

  return (
    <div className="border rounded bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-3 py-2">{t.title}</th>
            <th className="px-3 py-2 text-left">{t.category}</th>
            <th className="px-3 py-2 text-center">{t.paid}</th>
            <th className="px-3 py-2 text-center">{t.date}</th>
          </tr>
        </thead>

        <tbody>
          {items.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="px-3 py-2">
                {u.content_item ? (
                  <Link
                    href={`/admin/content/${u.content_item.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {u.content_item.title}
                  </Link>
                ) : (
                  <span className="text-gray-500">{t.unknownContent}</span>
                )}
              </td>

              <td className="px-3 py-2">
                {u.content_item?.categories?.length
                  ? u.content_item.categories.join(", ")
                  : "—"}
              </td>

              <td className="px-3 py-2 text-center">
                {u.credits_spent} {t.creditsSuffix}
              </td>

              <td className="px-3 py-2 text-center">
                {new Date(u.unlocked_at).toLocaleDateString(locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
