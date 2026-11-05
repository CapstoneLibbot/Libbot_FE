export function robotYawToCssRotation(
  robotYaw: number,
  mapOriginYaw: number,
) {
  return -(robotYaw - mapOriginYaw)
}

import type { OccupancyMapMetadata } from '../types/runtime'

export function mapToPixel(
  x: number,
  y: number,
  map: OccupancyMapMetadata,
) {
  const dx = x - map.origin[0]
  const dy = y - map.origin[1]
  const cosine = Math.cos(map.origin[2])
  const sine = Math.sin(map.origin[2])
  const localX = cosine * dx + sine * dy
  const localY = -sine * dx + cosine * dy

  return {
    x: localX / map.resolution,
    y: map.imageHeight - localY / map.resolution,
  }
}

export function pixelToMap(
  pixelX: number,
  pixelY: number,
  map: OccupancyMapMetadata,
) {
  const localX = pixelX * map.resolution
  const localY = (map.imageHeight - pixelY) * map.resolution
  const cosine = Math.cos(map.origin[2])
  const sine = Math.sin(map.origin[2])

  return {
    x: map.origin[0] + cosine * localX - sine * localY,
    y: map.origin[1] + sine * localX + cosine * localY,
  }
}
