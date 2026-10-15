import { OccupancyMapMetadata, Pose2D } from '../types/runtime';

export function pixelToMap(pixelX: number, pixelY: number, map: OccupancyMapMetadata): Omit<Pose2D, 'yaw'> {
  return {
    x: map.origin[0] + pixelX * map.resolution,
    y: map.origin[1] + (map.imageHeight - pixelY) * map.resolution
  };
}

export function mapToPixel(x: number, y: number, map: OccupancyMapMetadata) {
  return {
    x: (x - map.origin[0]) / map.resolution,
    y: map.imageHeight - (y - map.origin[1]) / map.resolution
  };
}

