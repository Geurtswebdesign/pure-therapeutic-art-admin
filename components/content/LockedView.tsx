import LockedViewClient from "./LockedViewClient";

type Props = {
  contentId: string;
  cost: number;
  balance: number;
};

export default function LockedView(props: Props) {
  return <LockedViewClient {...props} />;
}
