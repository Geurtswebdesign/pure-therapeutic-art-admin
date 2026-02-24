import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  transactions: {
    id: string;
    delta: number;
    reason: string;
    created_at: string;
  }[];
  language: UiLanguage;
};

export default function CreditsHistoryTable({ transactions, language }: Props) {
  const t = getAppMessages(language).creditTransactions;
  const locale = language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  if (transactions.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        {t.noTransactions}
      </div>
    );
  }

  return (
    <table className="w-full text-sm border">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1 text-left">{t.date}</th>
          <th className="border px-2 py-1 text-right">{t.credits}</th>
          <th className="border px-2 py-1 text-left">{t.reason}</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(t => (
          <tr key={t.id}>
            <td className="border px-2 py-1">
              {new Date(t.created_at).toLocaleString(locale)}
            </td>
            <td
              className={`border px-2 py-1 text-right ${
                t.delta > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {t.delta > 0 ? `+${t.delta}` : t.delta}
            </td>
            <td className="border px-2 py-1">{t.reason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
