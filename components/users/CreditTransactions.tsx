import type { CreditTransaction } from '@/lib/credits/types';
import CreditHistoryTable from '@/components/users/CreditHistoryTable';
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  transactions: CreditTransaction[];
  language: UiLanguage;
};

export default function CreditTransactions({ transactions, language }: Props) {
  const t = getAppMessages(language).creditTransactions;
  return (
    <section className="rounded border p-4 space-y-4">
      <h2 className="text-lg font-semibold">{t.title}</h2>
      <CreditHistoryTable transactions={transactions} language={language} />
    </section>
  );
}
