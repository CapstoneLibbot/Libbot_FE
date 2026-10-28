import { describe, expect, it } from 'vitest'

import { occupancyGridToMapMetadata, simulationMapToMetadata } from './occupancyGrid'

describe('occupancyGridToMapMetadata', () => {
  it('groups adjacent occupied cells into obstacle runs', () => {
    const result = occupancyGridToMapMetadata({
      timestamp: '2026-01-01T00:00:00Z',
      width: 4,
      height: 2,
      resolution: 0.5,
      originX: 1,
      originY: 2,
      originYaw: 0,
      data: [0, 70, 100, 0, -1, 0, 80, 0],
    })
    expect(result.imageWidth).toBe(4)
    expect(result.widthMeters).toBe(2)
    expect(result.obstacles).toHaveLength(2)
    expect(result.obstacles[0]).toMatchObject({ pixelX: 1, pixelWidth: 2 })
  })
})

describe('simulationMapToMetadata', () => {
  it('converts simulation components into map obstacles', () => {
    const result = simulationMapToMetadata({
      imageWidth: 100,
      imageHeight: 100,
      resolution: 0.1,
      origin: [-5, -5, 0],
      widthMeters: 10,
      heightMeters: 10,
      components: [{ worldX: 0, worldY: 0, size: [2, 1, 2] }],
    })
    expect(result.obstacles[0]).toMatchObject({
      pixelX: 40,
      pixelY: 45,
      pixelWidth: 20,
      pixelHeight: 10,
    })
  })
})
