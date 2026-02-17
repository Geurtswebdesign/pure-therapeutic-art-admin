import type { CreditWallet } from "@/lib/credits/types";

export default function UserCreditsBox({
  wallet,
}: {
  wallet: CreditWallet | null;
}) {
  return (
    <div className="bg-white border rounded">
      <div className="border-b px-4 py-3 font-medium">
        Credits
      </div>

      <div className="p-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span>Beschikbaar</span>
          <strong>{wallet?.credits_available ?? 0}</strong>
        </div>

        <div className="flex justify-between">
          <span>Gekocht</span>
          <strong>{wallet?.credits_total_purchased ?? 0}</strong>
        </div>
      </div>
    </div>
  );
}
