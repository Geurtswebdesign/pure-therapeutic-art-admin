type Slice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  data: Slice[];
  size?: number;
};

export default function DonutChart({ data, size = 160 }: Props) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((slice, index) => {
    const fraction = slice.value / total;
    const dash = fraction * circumference;
    const dashArray = `${dash} ${circumference - dash}`;
    const previousDashTotal = data
      .slice(0, index)
      .reduce((sum, item) => sum + (item.value / total) * circumference, 0);

    return {
      ...slice,
      dashArray,
      dashOffset: -previousDashTotal,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2} ${size / 2})`}>
        {segments.map((slice) => (
          <circle
            key={slice.label}
            r={radius}
            cx="0"
            cy="0"
            fill="transparent"
            stroke={slice.color}
            strokeWidth="14"
            strokeDasharray={slice.dashArray}
            strokeDashoffset={slice.dashOffset}
          />
        ))}
      </g>
    </svg>
  );
}
