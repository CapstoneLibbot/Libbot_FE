import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import type {
  LiveOccupancyGrid,
  Pose2D,
} from '../types/runtime'
import { robotYawToCssRotation } from '../utils/coordinates'

type LiveOccupancyMapProps = {
  grid: LiveOccupancyGrid | null
  robot?: Pose2D
  mappingActive?: boolean
}

export default function LiveOccupancyMap({
  grid,
  robot,
  mappingActive = false,
}: LiveOccupancyMapProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const frame = frameRef.current

    if (!frame || !grid || grid.width <= 0 || grid.height <= 0) {
      return
    }

    const updateViewportSize = () => {
      const style = window.getComputedStyle(frame)
      const horizontalPadding =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight)
      const verticalPadding =
        Number.parseFloat(style.paddingTop) +
        Number.parseFloat(style.paddingBottom)
      const availableWidth = Math.max(
        0,
        frame.clientWidth - horizontalPadding,
      )
      const availableHeight = Math.max(
        0,
        frame.clientHeight - verticalPadding - 24,
      )
      const scale = Math.min(
        availableWidth / grid.width,
        availableHeight / grid.height,
      )

      setViewportSize({
        width: Math.max(0, grid.width * scale),
        height: Math.max(0, grid.height * scale),
      })
    }

    const observer = new ResizeObserver(updateViewportSize)
    observer.observe(frame)
    updateViewportSize()

    return () => observer.disconnect()
  }, [grid])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context || !grid) {
      return
    }

    canvas.width = grid.width
    canvas.height = grid.height

    const image = context.createImageData(grid.width, grid.height)

    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const occupancy =
          grid.data[(grid.height - y - 1) * grid.width + x] ?? -1
        const value =
          occupancy < 0
            ? 155
            : 250 - Math.round(Math.min(100, occupancy) * 2.25)
        const offset = (y * grid.width + x) * 4

        image.data[offset] = value
        image.data[offset + 1] = value
        image.data[offset + 2] = value
        image.data[offset + 3] = 255
      }
    }

    context.putImageData(image, 0, 0)
  }, [grid])

  const deltaX = grid && robot ? robot.x - grid.originX : null
  const deltaY = grid && robot ? robot.y - grid.originY : null
  const cosine = grid ? Math.cos(grid.originYaw) : 1
  const sine = grid ? Math.sin(grid.originYaw) : 0
  const mapX =
    deltaX !== null && deltaY !== null
      ? cosine * deltaX + sine * deltaY
      : null
  const mapY =
    deltaX !== null && deltaY !== null
      ? -sine * deltaX + cosine * deltaY
      : null
  const robotLeft =
    grid && mapX !== null
      ? (mapX / (grid.width * grid.resolution)) * 100
      : null
  const robotTop =
    grid && mapY !== null
      ? (1 - mapY / (grid.height * grid.resolution)) * 100
      : null
  const robotRotation =
    grid && robot
      ? robotYawToCssRotation(robot.yaw, grid.originYaw)
      : null

  return (
    <div
      ref={frameRef}
      className="relative grid min-h-[360px] place-items-center overflow-hidden bg-[#101820] p-5 [background-image:linear-gradient(#33415555_1px,transparent_1px),linear-gradient(90deg,#33415555_1px,transparent_1px)] [background-size:28px_28px] lg:min-h-[560px]"
    >
      {grid ? (
        <div
          className="relative flex max-h-[540px] max-w-full items-center justify-center"
          style={{
            width: `${viewportSize.width}px`,
            height: `${viewportSize.height}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full [image-rendering:pixelated]"
            aria-label="Bản đồ occupancy SLAM đang cập nhật"
          />

          {robot && robotLeft !== null && robotTop !== null && (
            <span
              className="pointer-events-none absolute z-10 h-6 w-6 rounded-full border-2 border-white bg-primary shadow-[0_0_0_5px_rgb(0_86_210_/_25%),0_0_18px_rgb(0_86_210_/_55%)]"
              style={{
                left: `${robotLeft}%`,
                top: `${robotTop}%`,
                transform: `translate(-50%, -50%) rotate(${robotRotation}rad)`,
              }}
              aria-label="Vị trí robot"
            >
              <span className="absolute -right-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />
            </span>
          )}
        </div>
      ) : (
        <div className="max-w-sm text-center text-sm leading-6 text-slate-300">
          {mappingActive
            ? 'SLAM đang chạy nhưng backend chưa nhận topic /map. Kiểm tra SLAM Toolbox và topic /scan trên robot.'
            : 'Chưa nhận được map từ robot. Hãy bật mapping để xem dữ liệu SLAM.'}
        </div>
      )}

      {grid && (
        <div className="absolute bottom-3 left-3 rounded-md bg-slate-950/80 px-2 py-1 font-mono text-[11px] text-slate-200">
          {grid.width} × {grid.height} px · {grid.resolution.toFixed(3)} m/px
        </div>
      )}
    </div>
  )
}
