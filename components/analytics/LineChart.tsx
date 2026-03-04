type Point = {
  label: string;
  value: number;
};

type Props = {
  data: Point[];
  height?: number;
};

export default function LineChart({ data, height = 200 }: Props) {
  const width = 640;
  const padding = 24;
  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const points = data.map((d, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y =
      padding + (1 - (d.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const areaPoints = [
    `${padding},${height - padding}`,
    ...points,
    `${width - padding},${height - padding}`,
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[220px] w-full"
      role="img"
      aria-label="Line chart"
    >
      <defs>
        <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width={width} height={height} fill="white" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
      />
      <polygon points={areaPoints} fill="url(#lineFill)" />
    </svg>
  );
}
