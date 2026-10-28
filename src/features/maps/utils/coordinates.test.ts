import { describe, expect, it } from 'vitest'

import type { OccupancyMapMetadata } from '../types/runtime'
import { mapToPixel, pixelToMap } from './coordinates'

const map: OccupancyMapMetadata = {
  imageWidth: 100,
  imageHeight: 80,
  resolution: 0.05,
  origin: [-2.5, -2, 0.2],
  widthMeters: 5,
  heightMeters: 4,
  obstacles: [],
}

describe('map coordinate conversion', () => {
  it('round trips world and pixel coordinates with a rotated origin', () => {
    const world = { x: -0.25, y: 0.75 }
    const pixel = mapToPixel(world.x, world.y, map)
    const result = pixelToMap(pixel.x, pixel.y, map)
    expect(result.x).toBeCloseTo(world.x, 8)
    expect(result.y).toBeCloseTo(world.y, 8)
  })
})
