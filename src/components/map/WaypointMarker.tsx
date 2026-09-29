import { MapObject } from '../../types/map';

export function WaypointMarker({ waypoints = [] }: { waypoints?: MapObject[] }) {
  return (
    <g>
      {waypoints.map((point) => (
        <circle key={point.id} cx={point.x} cy={point.y} r={1.8} fill="#fbbf24" stroke="#7c2d12" strokeWidth={0.3} />
      ))}
    </g>
  );
}
