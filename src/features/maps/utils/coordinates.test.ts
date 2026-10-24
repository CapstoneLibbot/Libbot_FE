import { describe, expect, it } from 'vitest';
import { mapToPixel, pixelToMap, robotYawToCssRotation } from './coordinates';
import type { OccupancyMapMetadata } from '../types/runtime';

const map: OccupancyMapMetadata = {
  imageWidth: 90,
  imageHeight: 49,
  resolution: 0.05,
  origin: [-2.613, -1.949, 0],
  widthMeters: 4.5,
  heightMeters: 2.45,
  obstacles: []
};

describe('ROS map coordinate conversion', () => {
  it('maps the lower-left image boundary to the ROS origin', () => {
    expect(pixelToMap(0, 49, map)).toEqual({ x: -2.613, y: -1.949 });
  });

  it('round-trips within one floating-point epsilon', () => {
    const world = pixelToMap(37.25, 19.75, map);
    const pixel = mapToPixel(world.x, world.y, map);
    expect(pixel.x).toBeCloseTo(37.25, 10);
    expect(pixel.y).toBeCloseTo(19.75, 10);
  });

  it('moves exactly 0.05 metres per pixel', () => {
    const first = pixelToMap(10, 20, map);
    const second = pixelToMap(11, 19, map);
    expect(second.x - first.x).toBeCloseTo(0.05, 10);
    expect(second.y - first.y).toBeCloseTo(0.05, 10);
  });

  it('renders the robot front relative to a rotated map image', () => {
    expect(robotYawToCssRotation(Math.PI / 2, 0)).toBeCloseTo(-Math.PI / 2, 10);
    expect(robotYawToCssRotation(Math.PI / 2, Math.PI / 4)).toBeCloseTo(-Math.PI / 4, 10);
    expect(robotYawToCssRotation(Math.PI / 4, Math.PI / 4)).toBeCloseTo(0, 10);
  });
});
