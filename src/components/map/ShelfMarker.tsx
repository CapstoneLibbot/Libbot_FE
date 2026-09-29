import { MapObject } from '../../types/map';

export function ShelfMarker({ shelves = [] }: { shelves?: MapObject[] }) {
  return (
    <g>
      {shelves.map((shelf) => (
        <rect
          key={shelf.id}
          x={shelf.x}
          y={shelf.y}
          width={shelf.width ?? 12}
          height={shelf.height ?? 8}
          rx={1}
          fill="#93c5fd"
          stroke="#2563eb"
          strokeWidth={0.5}
          opacity={0.8}
        />
      ))}
    </g>
  );
}
