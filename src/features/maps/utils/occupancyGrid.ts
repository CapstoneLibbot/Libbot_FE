import { LiveOccupancyGrid, MapObstacle, OccupancyMapMetadata } from '../types/runtime';

const OCCUPIED_THRESHOLD = 65;

export function occupancyGridToMapMetadata(grid: LiveOccupancyGrid): OccupancyMapMetadata {
  const canvas = document.createElement('canvas');
  canvas.width = grid.width;
  canvas.height = grid.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không thể dựng ảnh occupancy grid.');

  const image = context.createImageData(grid.width, grid.height);
  const obstacles: MapObstacle[] = [];
  const cosYaw = Math.cos(grid.originYaw);
  const sinYaw = Math.sin(grid.originYaw);

  for (let gridY = 0; gridY < grid.height; gridY += 1) {
    const imageY = grid.height - gridY - 1;
    let runStart = -1;

    for (let x = 0; x <= grid.width; x += 1) {
      const occupancy = x < grid.width ? grid.data[gridY * grid.width + x] : -1;
      const isOccupied = x < grid.width && occupancy >= OCCUPIED_THRESHOLD;

      if (isOccupied && runStart < 0) runStart = x;
      if (!isOccupied && runStart >= 0) {
        const runLength = x - runStart;
        const localX = (runStart + runLength / 2) * grid.resolution;
        const localY = (gridY + 0.5) * grid.resolution;
        obstacles.push({
          pixelX: runStart,
          pixelY: imageY,
          pixelWidth: runLength,
          pixelHeight: 1,
          worldX: grid.originX + cosYaw * localX - sinYaw * localY,
          worldY: grid.originY + sinYaw * localX + cosYaw * localY,
          worldWidth: runLength * grid.resolution,
          worldHeight: grid.resolution,
        });
        runStart = -1;
      }

      if (x < grid.width) {
        const shade = occupancy < 0
          ? 155
          : 250 - Math.round((Math.min(100, occupancy) / 100) * 225);
        const offset = (imageY * grid.width + x) * 4;
        image.data[offset] = shade;
        image.data[offset + 1] = shade;
        image.data[offset + 2] = shade;
        image.data[offset + 3] = 255;
      }
    }
  }

  context.putImageData(image, 0, 0);

  return {
    imageWidth: grid.width,
    imageHeight: grid.height,
    resolution: grid.resolution,
    origin: [grid.originX, grid.originY, grid.originYaw],
    widthMeters: grid.width * grid.resolution,
    heightMeters: grid.height * grid.resolution,
    obstacles,
    occupancyImage: canvas.toDataURL('image/png'),
  };
}
