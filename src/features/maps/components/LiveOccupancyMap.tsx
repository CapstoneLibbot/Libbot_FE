import { useEffect, useRef } from 'react';
import { LiveOccupancyGrid, Pose2D } from '../types/runtime';

export function LiveOccupancyMap({ grid, robot }: { grid: LiveOccupancyGrid | null; robot?: Pose2D }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !grid) return;
    canvas.width = grid.width;
    canvas.height = grid.height;
    const image = context.createImageData(grid.width, grid.height);
    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const occupancy = grid.data[(grid.height - y - 1) * grid.width + x] ?? -1;
        const value = occupancy < 0 ? 155 : 250 - Math.round(Math.min(100, occupancy) * 2.25);
        const offset = (y * grid.width + x) * 4;
        image.data[offset] = value;
        image.data[offset + 1] = value;
        image.data[offset + 2] = value;
        image.data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }, [grid]);

  const robotLeft = grid && robot ? ((robot.x - grid.originX) / (grid.width * grid.resolution)) * 100 : null;
  const robotTop = grid && robot ? (1 - (robot.y - grid.originY) / (grid.height * grid.resolution)) * 100 : null;

  return <div className="live-map-frame">
    {grid ? <>
      <canvas ref={canvasRef} className="live-map-canvas" aria-label="Bản đồ occupancy SLAM đang cập nhật" />
      {robot && robotLeft !== null && robotTop !== null && <span className="live-map-robot" style={{ left: `${robotLeft}%`, top: `${robotTop}%`, transform: `translate(-50%, -50%) rotate(${-robot.yaw}rad)` }} aria-label="Vị trí robot"><i /></span>}
      <div className="live-map-caption">{grid.width} × {grid.height} px · {grid.resolution.toFixed(3)} m/px</div>
    </> : <div className="live-map-empty">Chưa nhận được map từ robot. Hãy bắt đầu mapping để xem dữ liệu SLAM.</div>}
  </div>;
}
