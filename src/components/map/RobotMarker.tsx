export function RobotMarker({ x = 10, y = 10, angle = 0 }: { x?: number; y?: number; angle?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${(angle * 180) / Math.PI})`}>
      <circle r={1.35} fill="#f8fafc" stroke="#22c8f2" strokeWidth={0.45} />
      <path d="M 0 -1.8 L 1.15 1 L -1.15 1 Z" fill="#0891b2" stroke="#ecfeff" strokeWidth={0.2} />
    </g>
  );
}
