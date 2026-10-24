import { OccupancyMapMetadata, Pose2D } from '../types/runtime';

export function pixelToMap(pixelX: number, pixelY: number, map: OccupancyMapMetadata): Omit<Pose2D, 'yaw'> {
  const localX = pixelX * map.resolution;
  const localY = (map.imageHeight - pixelY) * map.resolution;
  const yaw = map.origin[2] ?? 0;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  return {
    x: map.origin[0] + cosYaw * localX - sinYaw * localY,
    y: map.origin[1] + sinYaw * localX + cosYaw * localY
  };
}

export function mapToPixel(x: number, y: number, map: OccupancyMapMetadata) {
  const dx = x - map.origin[0];
  const dy = y - map.origin[1];
  const yaw = map.origin[2] ?? 0;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const localX = cosYaw * dx + sinYaw * dy;
  const localY = -sinYaw * dx + cosYaw * dy;
  return {
    x: localX / map.resolution,
    y: map.imageHeight - localY / map.resolution
  };
}

export function robotYawToCssRotation(robotYaw: number, mapOriginYaw: number) {
  return -(robotYaw - mapOriginYaw);
}

