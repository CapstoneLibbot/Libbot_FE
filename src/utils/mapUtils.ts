export interface ScreenBounds {
  width: number;
  height: number;
  padding?: number;
}

export function worldToScreen(
  x: number,
  y: number,
  { width, height, padding = 10 }: ScreenBounds
): { x: number; y: number } {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return {
    x: padding + (x / 100) * innerWidth,
    y: padding + (y / 80) * innerHeight
  };
}

export function screenToWorld(
  x: number,
  y: number,
  { width, height, padding = 10 }: ScreenBounds
): { x: number; y: number } {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return {
    x: ((x - padding) / innerWidth) * 100,
    y: ((y - padding) / innerHeight) * 80
  };
}
