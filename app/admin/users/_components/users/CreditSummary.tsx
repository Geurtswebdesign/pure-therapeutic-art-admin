type Props = {
  wallet: {
    credits_available: number;
    credits_total_purchased: number;
  } | null;
};

export default function CreditsSummary({ wallet }: Props) {
  return (
    <div className="border rounded p-4">
      <div className="text-sm text-gray-500">Huidige credits</div>
      <div className="text-2xl font-semibold">
        {wallet ? wallet.credits_available : "—"}
      </div>
    </div>
  );
}
