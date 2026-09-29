export function StartMarker({ x = 10, y = 10 }: { x?: number; y?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={2.2} fill="#16a34a" stroke="#14532d" strokeWidth={0.5} />
      <text x={x + 2.4} y={y - 1.4} fill="#14532d" fontSize={2.5} fontWeight={700}>START</text>
    </g>
  );
}
