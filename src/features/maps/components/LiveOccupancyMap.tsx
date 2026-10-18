import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LiveOccupancyGrid, Pose2D } from '../types/runtime';

export function LiveOccupancyMap({ grid, robot, mappingActive = false }: { grid: LiveOccupancyGrid | null; robot?: Pose2D; mappingActive?: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || !grid || grid.width <= 0 || grid.height <= 0) return;

    const updateViewportSize = () => {
      const style = window.getComputedStyle(frame);
      const horizontalPadding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
      const verticalPadding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
      const availableWidth = Math.max(0, frame.clientWidth - horizontalPadding);
      const availableHeight = Math.max(0, frame.clientHeight - verticalPadding - 24);
      const scale = Math.min(availableWidth / grid.width, availableHeight / grid.height);

      setViewportSize({
        width: Math.max(0, grid.width * scale),
        height: Math.max(0, grid.height * scale),
      });
    };

    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(frame);
    updateViewportSize();
    return () => observer.disconnect();
  }, [grid?.width, grid?.height]);

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

  const deltaX = grid && robot ? robot.x - grid.originX : null;
  const deltaY = grid && robot ? robot.y - grid.originY : null;
  const cosine = grid ? Math.cos(grid.originYaw) : 1;
  const sine = grid ? Math.sin(grid.originYaw) : 0;
  const mapX = deltaX !== null && deltaY !== null ? cosine * deltaX + sine * deltaY : null;
  const mapY = deltaX !== null && deltaY !== null ? -sine * deltaX + cosine * deltaY : null;
  const robotLeft = grid && mapX !== null ? (mapX / (grid.width * grid.resolution)) * 100 : null;
  const robotTop = grid && mapY !== null ? (1 - mapY / (grid.height * grid.resolution)) * 100 : null;

  return <div ref={frameRef} className="live-map-frame">
    {grid ? (
      <div
        className="live-map-viewport"
        style={{
          width: `${viewportSize.width}px`,
          height: `${viewportSize.height}px`,
        }}
      >
        <canvas ref={canvasRef} className="live-map-canvas" aria-label="Bản đồ occupancy SLAM đang cập nhật" />
        {robot && robotLeft !== null && robotTop !== null && (
          <span
            className="live-map-robot"
            style={{
              left: `${robotLeft}%`,
              top: `${robotTop}%`,
              transform: `translate(-50%, -50%) rotate(${-robot.yaw}rad)`,
            }}
            aria-label="Vị trí robot"
          >
            <i />
          </span>
        )}
      </div>
    ) : (
      <div className="live-map-empty">{mappingActive ? 'SLAM đang chạy nhưng BE chưa nhận topic /map. Kiểm tra SLAM Toolbox và topic /scan trên robot.' : 'Chưa nhận được map từ robot. Hãy bật mapping để xem dữ liệu SLAM.'}</div>
    )}
    {grid && (
      <div className="live-map-caption">{grid.width} × {grid.height} px · {grid.resolution.toFixed(3)} m/px</div>
    )}
  </div>;
}
