export function MapBackground() {
  const gridCells = Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <g>
      <rect x={0} y={0} width={100} height={80} fill="#111827" stroke="#334155" strokeWidth={0.7} />
      {gridCells.map((value) => (
        <g key={value}>
          <line x1={value * 8} y1={0} x2={value * 8} y2={80} stroke="#475569" strokeDasharray="1 2.5" opacity={0.45} />
          <line x1={0} y1={value * 6.5} x2={100} y2={value * 6.5} stroke="#475569" strokeDasharray="1 2.5" opacity={0.45} />
        </g>
      ))}

      <rect x={18} y={10} width={62} height={52} fill="rgba(14, 116, 144, 0.12)" stroke="rgba(103, 232, 249, 0.45)" strokeDasharray="2 2" strokeWidth={0.5} />
    </g>
  );
}
