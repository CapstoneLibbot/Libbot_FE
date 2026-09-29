import { PathPoint } from '../../types/map';

interface PathLineProps {
  path?: PathPoint[];
  variant?: 'area' | 'robot';
}

export function PathLine({ path = [], variant = 'robot' }: PathLineProps) {
  if (path.length < 2) {
    return null;
  }

  const points = path.map((point) => `${point.x},${point.y}`).join(' ');
  const arrowMarkers = [] as Array<{ id: string; x: number; y: number; angle: number }>;
  const routeColor = variant === 'area' ? '#1595b8' : '#fbbf24';
  const arrowColor = variant === 'area' ? '#76d9f2' : '#fff0a6';

  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segmentLength = Math.hypot(dx, dy);
    const arrowCount = Math.max(1, Math.floor(segmentLength / 8));
    const angle = Math.atan2(dy, dx);

    for (let arrowIndex = 0; arrowIndex < arrowCount; arrowIndex += 1) {
      const progress = (arrowIndex + 0.5) / arrowCount;
      arrowMarkers.push({
        id: `${index}-${arrowIndex}`,
        x: start.x + dx * progress,
        y: start.y + dy * progress,
        angle
      });
    }
  }

  return (
    <g>
      <polyline
        points={points}
        fill="none"
        stroke={routeColor}
        strokeWidth={variant === 'area' ? 0.55 : 1.1}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={variant === 'area' ? 0.68 : 1}
      />

      {arrowMarkers.map((arrow) => {
        const arrowLength = 2.8;

        return (
          <g key={arrow.id} transform={`translate(${arrow.x} ${arrow.y}) rotate(${(arrow.angle * 180) / Math.PI})`}>
            <path d={`M ${-arrowLength} -1.6 L 0 0 L ${-arrowLength} 1.6`} fill="none" stroke={arrowColor} strokeWidth={variant === 'area' ? 0.65 : 0.9} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
}
