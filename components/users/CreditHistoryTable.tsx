type Props = {
  transactions: {
    id: string;
    delta: number;
    reason: string;
    created_at: string;
  }[];
};

export default function CreditsHistoryTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Geen transacties gevonden.
      </div>
    );
  }

  return (
    <table className="w-full text-sm border">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1 text-left">Datum</th>
          <th className="border px-2 py-1 text-right">Credits</th>
          <th className="border px-2 py-1 text-left">Reden</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(t => (
          <tr key={t.id}>
            <td className="border px-2 py-1">
              {new Date(t.created_at).toLocaleString("nl-NL")}
            </td>
            <td
              className={`border px-2 py-1 text-right ${
                t.delta > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {t.delta > 0 ? `+${t.delta}` : t.delta}
            </td>
            <td className="border px-2 py-1">{t.reason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
