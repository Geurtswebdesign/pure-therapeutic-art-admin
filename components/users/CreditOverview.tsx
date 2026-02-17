import { CreditWallet } from "@/lib/users/types";

type Props = {
  wallet: CreditWallet;
};

export default function CreditOverview({ wallet }: Props) {
  return (
    <div className="rounded border bg-white p-4">
      <p className="text-sm text-gray-500">Beschikbare credits</p>
      <p className="text-2xl font-semibold">
        {wallet.credits_available}
      </p>
    </div>
  );
}
