import type { CreditTransaction } from '@/lib/credits/types';
import CreditHistoryTable from '@/components/users/CreditHistoryTable';

type Props = {
  transactions: CreditTransaction[];
};

export default function CreditTransactions({ transactions }: Props) {
  return (
    <section className="rounded border p-4 space-y-4">
      <h2 className="text-lg font-semibold">Transacties</h2>
      <CreditHistoryTable transactions={transactions} />
    </section>
  );
}
