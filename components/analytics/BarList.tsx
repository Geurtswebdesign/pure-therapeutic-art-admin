type BarItem = {
  label: string;
  value: number;
};

type Props = {
  data: BarItem[];
};

export default function BarList({ data }: Props) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <ul className="space-y-2">
      {data.map((item) => (
        <li key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="truncate">{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-2 w-full rounded bg-gray-100">
            <div
              className="h-2 rounded bg-blue-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
