import type {
  LiveOccupancyGrid,
  MapObstacle,
  OccupancyMapMetadata,
} from '../types/runtime'

const OCCUPIED_THRESHOLD = 65

type SimulationMapFile = {
  imageWidth: number
  imageHeight: number
  resolution: number
  origin: [number, number, number]
  widthMeters: number
  heightMeters: number
  components?: Array<{
    worldX: number
    worldY: number
    size: [number, number, number]
  }>
}

export function simulationMapToMetadata(input: SimulationMapFile): OccupancyMapMetadata {
  const [originX, originY] = input.origin
  const components = Array.isArray(input.components) ? input.components : []
  return {
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
    resolution: input.resolution,
    origin: input.origin,
    widthMeters: input.widthMeters,
    heightMeters: input.heightMeters,
    obstacles: components.map((component) => {
      const worldWidth = component.size[0]
      const worldHeight = component.size[1]
      return {
        pixelX: (component.worldX - worldWidth / 2 - originX) / input.resolution,
        pixelY: input.imageHeight - (component.worldY + worldHeight / 2 - originY) / input.resolution,
        pixelWidth: worldWidth / input.resolution,
        pixelHeight: worldHeight / input.resolution,
        worldX: component.worldX,
        worldY: component.worldY,
        worldWidth,
        worldHeight,
      }
    }),
  }
}

export function occupancyGridToMapMetadata(
  grid: LiveOccupancyGrid,
): OccupancyMapMetadata {
  const obstacles: MapObstacle[] = []
  const cosine = Math.cos(grid.originYaw)
  const sine = Math.sin(grid.originYaw)

  for (let gridY = 0; gridY < grid.height; gridY += 1) {
    let runStart = -1
    for (let x = 0; x <= grid.width; x += 1) {
      const occupancy = x < grid.width ? grid.data[gridY * grid.width + x] : -1
      const occupied = x < grid.width && occupancy >= OCCUPIED_THRESHOLD
      if (occupied && runStart < 0) runStart = x
      if (!occupied && runStart >= 0) {
        const length = x - runStart
        const localX = (runStart + length / 2) * grid.resolution
        const localY = (gridY + 0.5) * grid.resolution
        obstacles.push({
          pixelX: runStart,
          pixelY: grid.height - gridY - 1,
          pixelWidth: length,
          pixelHeight: 1,
          worldX: grid.originX + cosine * localX - sine * localY,
          worldY: grid.originY + sine * localX + cosine * localY,
          worldWidth: length * grid.resolution,
          worldHeight: grid.resolution,
        })
        runStart = -1
      }
    }
  }

  return {
    imageWidth: grid.width,
    imageHeight: grid.height,
    resolution: grid.resolution,
    origin: [grid.originX, grid.originY, grid.originYaw],
    widthMeters: grid.width * grid.resolution,
    heightMeters: grid.height * grid.resolution,
    obstacles,
    occupancyImage: occupancyGridImage(grid),
  }
}

function occupancyGridImage(grid: LiveOccupancyGrid): string | undefined {
  if (typeof document === 'undefined') return undefined
  const canvas = document.createElement('canvas')
  canvas.width = grid.width
  canvas.height = grid.height
  const context = canvas.getContext('2d')
  if (!context) return undefined
  const image = context.createImageData(grid.width, grid.height)
  for (let gridY = 0; gridY < grid.height; gridY += 1) {
    const imageY = grid.height - gridY - 1
    for (let x = 0; x < grid.width; x += 1) {
      const occupancy = grid.data[gridY * grid.width + x] ?? -1
      const shade = occupancy < 0
        ? 155
        : 250 - Math.round((Math.min(100, occupancy) / 100) * 225)
      const offset = (imageY * grid.width + x) * 4
      image.data[offset] = shade
      image.data[offset + 1] = shade
      image.data[offset + 2] = shade
      image.data[offset + 3] = 255
    }
  }
  context.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}
