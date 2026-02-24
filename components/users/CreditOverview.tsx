import { CreditWallet } from "@/lib/credits/types";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  wallet: CreditWallet;
  language: UiLanguage;
};

export default function CreditOverview({ wallet, language }: Props) {
  const t = getAppMessages(language).creditOverview;
  return (
    <div className="rounded border bg-white p-4">
      <p className="text-sm text-gray-500">{t.available}</p>
      <p className="text-2xl font-semibold">
        {wallet.credits_available}
      </p>
    </div>
  );
}
