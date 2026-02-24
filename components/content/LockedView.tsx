import type { ContentAccessScope } from "@/lib/content/access";
import LockedViewClient from "@/components/content/LockedViewClient";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  contentId: string;
  cost: number;
  balance: number;
  scope: ContentAccessScope;
  isLoggedIn: boolean;
  language: UiLanguage;
};

export default function LockedView(props: Props) {
  return <LockedViewClient {...props} />;
}
