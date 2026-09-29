import { PropsWithChildren } from 'react';

interface MapCanvasProps extends PropsWithChildren {
  width?: number;
  height?: number;
}

export function MapCanvas({ width = 100, height = 80, children }: MapCanvasProps) {
  return (
    <svg className="map-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-label="Robot map canvas">
      {children}
    </svg>
  );
}
