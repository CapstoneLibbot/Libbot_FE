import { MapDefinition } from '../../types/map';

export function MapWalls({ walls = [] }: { walls?: MapDefinition['walls'] }) {
  return (
    <g>
      {walls.map((wall, index) => (
        <line
          key={`${wall.x1}-${wall.y1}-${index}`}
          x1={wall.x1}
          y1={wall.y1}
          x2={wall.x2}
          y2={wall.y2}
          stroke="#d1d5db"
          strokeWidth={1.1}
          opacity={0.85}
        />
      ))}
    </g>
  );
}
