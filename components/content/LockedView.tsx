import type { ContentAccessScope } from "@/lib/content/access";
import LockedViewClient from "@/components/content/LockedViewClient";

type Props = {
  contentId: string;
  cost: number;
  balance: number;
  scope: ContentAccessScope;
  isLoggedIn: boolean;
};

export default function LockedView(props: Props) {
  return <LockedViewClient {...props} />;
}
