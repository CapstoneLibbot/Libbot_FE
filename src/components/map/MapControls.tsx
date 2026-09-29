import { PropsWithChildren } from 'react';

export function MapControls({ children }: PropsWithChildren) {
  return <div className="map-toolbar">{children}</div>;
}
