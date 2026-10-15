import { PointerEvent, useRef } from 'react';
import { OccupancyMapMetadata, PathPoint2D, Pose2D } from '../types/runtime';
import { mapToPixel, pixelToMap } from '../utils/coordinates';

interface Props {
  map: OccupancyMapMetadata;
  robot?: Pose2D;
  draft?: Pose2D | null;
  path?: PathPoint2D[] | null;
  onDraftChange: (pose: Pose2D) => void;
}

export function OperationsMap2D({ map, robot, draft, path, onDraftChange }: Props) {
  const dragStart = useRef<Omit<Pose2D, 'yaw'> | null>(null);

  const eventPoint = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pixelX = ((event.clientX - bounds.left) / bounds.width) * map.imageWidth;
    const pixelY = ((event.clientY - bounds.top) / bounds.height) * map.imageHeight;
    return pixelToMap(pixelX, pixelY, map);
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = eventPoint(event);
    dragStart.current = point;
    onDraftChange({ ...point, yaw: robot?.yaw ?? 0 });
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragStart.current) return;
    const point = eventPoint(event);
    const dx = point.x - dragStart.current.x;
    const dy = point.y - dragStart.current.y;
    const yaw = Math.hypot(dx, dy) > map.resolution ? Math.atan2(dy, dx) : robot?.yaw ?? 0;
    onDraftChange({ ...dragStart.current, yaw });
  };

  const pathPixels = path?.map((point) => mapToPixel(point.x, point.y, map));
  const robotPixel = robot ? mapToPixel(robot.x, robot.y, map) : null;
  const draftPixel = draft ? mapToPixel(draft.x, draft.y, map) : null;

  return (
    <svg
      className="operations-map"
      viewBox={`0 0 ${map.imageWidth} ${map.imageHeight}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { dragStart.current = null; }}
      onPointerCancel={() => { dragStart.current = null; }}
      role="application"
      aria-label="Bản đồ điều khiển robot"
    >
      <rect width={map.imageWidth} height={map.imageHeight} fill="#e8edf0" />
      {map.obstacles.map((obstacle, index) => (
        <rect key={index} x={obstacle.pixelX} y={obstacle.pixelY} width={obstacle.pixelWidth} height={obstacle.pixelHeight} fill="#334852" />
      ))}
      {pathPixels && pathPixels.length > 1 && (
        <polyline points={pathPixels.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#20b8d8" strokeWidth="0.8" strokeDasharray="1.5 1" />
      )}
      {draftPixel && draft && (
        <g transform={`translate(${draftPixel.x} ${draftPixel.y}) rotate(${(-draft.yaw * 180) / Math.PI})`}>
          <circle r="2" fill="rgba(250,174,55,.25)" stroke="#faad37" strokeWidth="0.6" />
          <path d="M 0 0 L 5 0 M 5 0 L 3.5 -1 M 5 0 L 3.5 1" stroke="#faad37" strokeWidth="0.7" fill="none" />
        </g>
      )}
      {robotPixel && robot && (
        <g transform={`translate(${robotPixel.x} ${robotPixel.y}) rotate(${(-robot.yaw * 180) / Math.PI})`}>
          <circle r="2.3" fill="#ecfeff" stroke="#0891b2" strokeWidth="0.7" />
          <path d="M 2.8 0 L -1.5 -1.5 L -1.5 1.5 Z" fill="#0891b2" />
        </g>
      )}
    </svg>
  );
}

