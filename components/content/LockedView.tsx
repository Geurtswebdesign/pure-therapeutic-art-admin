import LockedViewClient from "@/components/content/LockedViewClient";

type Props = {
  contentId: string;
  cost: number;
  balance: number;
  isLoggedIn: boolean;
};

export default function LockedView(props: Props) {
  return <LockedViewClient {...props} />;
}
