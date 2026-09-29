export function GoalMarker({ x = 68, y = 50 }: { x?: number; y?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={2.4} fill="#dc2626" stroke="#7f1d1d" strokeWidth={0.5} />
      <text x={x + 2.8} y={y - 1.8} fill="#7f1d1d" fontSize={2.5} fontWeight={700}>GOAL</text>
    </g>
  );
}
