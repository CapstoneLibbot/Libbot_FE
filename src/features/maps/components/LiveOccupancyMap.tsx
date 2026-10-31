import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type {
  LiveOccupancyGrid,
  Pose2D,
} from '../types/runtime'
import { robotYawToCssRotation } from '../utils/coordinates'
import { inferVerticalRotationAngle, rotatePointAroundCenter } from '../utils/orientation'

export type OccupancyEndpointOverlay = {
  id: string
  name: string
  endpointType: 'WAYPOINT' | 'CHARGER' | 'PARK'
  positionX: number
  positionY: number
  theta: number
  isActive: boolean
}

export type OccupancyEndpointPlacement = {
  positionX: number
  positionY: number
  theta: number
}

export type OccupancyZoneOverlay = {
  id: string
  zoneType: string
  minX: number
  minY: number
  maxX: number
  maxY: number
  width?: number | null
  height?: number | null
  rotationAngle?: number
  isActive: boolean
}

export type OccupancyZoneBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  rotationAngle: number
}

type LiveOccupancyMapProps = {
  grid: LiveOccupancyGrid | null
  orientVertically?: boolean
  robot?: Pose2D
  mappingActive?: boolean
  endpoints?: OccupancyEndpointOverlay[]
  zones?: OccupancyZoneOverlay[]
  showEndpoints?: boolean
  showZones?: boolean
  selectedEndpointId?: string | null
  selectedZoneId?: string | null
  onEndpointSelect?: (id: string) => void
  onZoneSelect?: (id: string) => void
  drawZoneMode?: boolean
  endpointPlacementMode?: boolean
  onZoneDraw?: (bounds: OccupancyZoneBounds) => void
  onEndpointPlace?: (placement: OccupancyEndpointPlacement) => void
}

type MapViewportSize = {
  width: number
  height: number
  contentWidth: number
  contentHeight: number
}

export default function LiveOccupancyMap({
  grid,
  orientVertically = true,
  robot,
  mappingActive = false,
  endpoints = [],
  zones = [],
  showEndpoints = false,
  showZones = false,
  selectedEndpointId,
  selectedZoneId,
  onEndpointSelect,
  onZoneSelect,
  drawZoneMode = false,
  endpointPlacementMode = false,
  onZoneDraw,
  onEndpointPlace,
}: LiveOccupancyMapProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewportSize, setViewportSize] = useState<MapViewportSize>({
    width: 0,
    height: 0,
    contentWidth: 0,
    contentHeight: 0,
  })
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null)
  const orientationAngle = useMemo(
    () => (orientVertically && grid
      ? inferVerticalRotationAngle(grid.width, grid.height, (index) => (grid.data[index] ?? -1) >= 0)
      : 0),
    [grid, orientVertically],
  )

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
      const cosine = Math.abs(Math.cos(orientationAngle))
      const sine = Math.abs(Math.sin(orientationAngle))
      const rotatedWidth = cosine * grid.width + sine * grid.height
      const rotatedHeight = sine * grid.width + cosine * grid.height
      const scale = Math.min(availableWidth / rotatedWidth, availableHeight / rotatedHeight)

      setViewportSize({
        width: Math.max(0, rotatedWidth * scale),
        height: Math.max(0, rotatedHeight * scale),
        contentWidth: Math.max(0, grid.width * scale),
        contentHeight: Math.max(0, grid.height * scale),
      })
    }

    const observer = new ResizeObserver(updateViewportSize)
    observer.observe(frame)
    updateViewportSize()

    return () => observer.disconnect()
  }, [grid, orientationAngle])

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

  const toGridPoint = (x: number, y: number) => {
    if (!grid) return { x: 0, y: 0 }
    const dx = x - grid.originX
    const dy = y - grid.originY
    const localX = cosine * dx + sine * dy
    const localY = -sine * dx + cosine * dy
    return {
      x: localX / grid.resolution,
      y: grid.height - localY / grid.resolution,
    }
  }

  const toDisplayGridPoint = (point: { x: number; y: number }) => {
    if (!grid) return point
    return rotatePointAroundCenter(
      point,
      { x: grid.width / 2, y: grid.height / 2 },
      orientationAngle,
    )
  }

  const toMapGridPoint = (point: { x: number; y: number }) => {
    if (!grid) return point
    return rotatePointAroundCenter(
      point,
      { x: grid.width / 2, y: grid.height / 2 },
      -orientationAngle,
    )
  }

  const getZoneCorners = (start: { x: number; y: number }, end: { x: number; y: number }) => [
    { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
    { x: Math.max(start.x, end.x), y: Math.min(start.y, end.y) },
    { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
    { x: Math.min(start.x, end.x), y: Math.max(start.y, end.y) },
  ].map(toMapGridPoint)

  const getSvgPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget
    const matrix = svg.getScreenCTM()
    if (!matrix) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const transformed = point.matrixTransform(matrix.inverse())
    return { x: transformed.x, y: transformed.y }
  }

  const toWorldPoint = (point: { x: number; y: number }) => {
    if (!grid) return { x: 0, y: 0 }
    const localX = point.x * grid.resolution
    const localY = (grid.height - point.y) * grid.resolution
    return {
      x: grid.originX + cosine * localX - sine * localY,
      y: grid.originY + sine * localX + cosine * localY,
    }
  }

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
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: `${viewportSize.contentWidth}px`,
              height: `${viewportSize.contentHeight}px`,
              transform: `translate(-50%, -50%) rotate(${(orientationAngle * 180) / Math.PI}deg)`,
            }}
          >
          <canvas
            ref={canvasRef}
            className="block h-full w-full [image-rendering:pixelated]"
            aria-label="Bản đồ occupancy SLAM đang cập nhật"
          />

          {(showEndpoints || showZones) && (
            <svg
              viewBox={`0 0 ${grid.width} ${grid.height}`}
              preserveAspectRatio="none"
              className={`absolute inset-0 h-full w-full overflow-visible ${drawZoneMode || endpointPlacementMode ? 'pointer-events-auto cursor-crosshair touch-none' : 'pointer-events-none'}`}
              aria-label={showEndpoints ? 'Map endpoints' : 'Map zones'}
              onPointerDown={(event) => {
                if (!drawZoneMode && !endpointPlacementMode) return
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                const point = getSvgPoint(event)
                const dragPoint = drawZoneMode ? toDisplayGridPoint(point) : point
                setDrawStart(dragPoint)
                setDrawCurrent(dragPoint)
              }}
              onPointerMove={(event) => {
                if (!drawStart) return
                const point = getSvgPoint(event)
                setDrawCurrent(drawZoneMode ? toDisplayGridPoint(point) : point)
              }}
              onPointerUp={(event) => {
                if (!drawZoneMode && endpointPlacementMode && drawStart) {
                  const end = getSvgPoint(event)
                  const dragDistance = Math.hypot(end.x - drawStart.x, end.y - drawStart.y)
                  if (dragDistance > 2) {
                    const startWorld = toWorldPoint(drawStart)
                    const endWorld = toWorldPoint(end)
                    onEndpointPlace?.({
                      positionX: startWorld.x,
                      positionY: startWorld.y,
                      theta: Math.atan2(endWorld.y - startWorld.y, endWorld.x - startWorld.x),
                    })
                  }
                  setDrawStart(null)
                  setDrawCurrent(null)
                  return
                }
                if (!drawZoneMode || !drawStart) return
                const end = toDisplayGridPoint(getSvgPoint(event))
                if (Math.abs(end.x - drawStart.x) > 2 && Math.abs(end.y - drawStart.y) > 2) {
                  const worldCorners = getZoneCorners(drawStart, end).map(toWorldPoint)
                  const widthVector = {
                    x: worldCorners[1].x - worldCorners[0].x,
                    y: worldCorners[1].y - worldCorners[0].y,
                  }
                  const heightVector = {
                    x: worldCorners[3].x - worldCorners[0].x,
                    y: worldCorners[3].y - worldCorners[0].y,
                  }
                  onZoneDraw?.({
                    minX: Math.min(...worldCorners.map((point) => point.x)),
                    minY: Math.min(...worldCorners.map((point) => point.y)),
                    maxX: Math.max(...worldCorners.map((point) => point.x)),
                    maxY: Math.max(...worldCorners.map((point) => point.y)),
                    width: Math.hypot(widthVector.x, widthVector.y),
                    height: Math.hypot(heightVector.x, heightVector.y),
                    rotationAngle: Math.atan2(widthVector.y, widthVector.x),
                  })
                }
                setDrawStart(null)
                setDrawCurrent(null)
              }}
              onPointerCancel={() => {
                setDrawStart(null)
                setDrawCurrent(null)
              }}
            >
              {showZones && zones.map((zone) => {
                const hasOrientedGeometry = zone.width != null && zone.height != null
                const centerX = (zone.minX + zone.maxX) / 2
                const centerY = (zone.minY + zone.maxY) / 2
                const halfWidth = (zone.width ?? 0) / 2
                const halfHeight = (zone.height ?? 0) / 2
                const angle = zone.rotationAngle ?? 0
                const cosine = Math.cos(angle)
                const sine = Math.sin(angle)
                const worldCorners = hasOrientedGeometry
                  ? [
                      [-halfWidth, -halfHeight],
                      [halfWidth, -halfHeight],
                      [halfWidth, halfHeight],
                      [-halfWidth, halfHeight],
                    ].map(([localX, localY]) => ({
                      x: centerX + cosine * localX - sine * localY,
                      y: centerY + sine * localX + cosine * localY,
                    }))
                  : [
                      { x: zone.minX, y: zone.minY },
                      { x: zone.maxX, y: zone.minY },
                      { x: zone.maxX, y: zone.maxY },
                      { x: zone.minX, y: zone.maxY },
                    ]
                const corners = worldCorners.map((point) => toGridPoint(point.x, point.y))
                const selected = zone.id === selectedZoneId
                const zoneColor = !zone.isActive
                  ? '#64748b'
                  : zone.zoneType === 'KEEP_OUT'
                    ? '#ef4444'
                    : zone.zoneType === 'SPEED_LIMIT'
                      ? '#f59e0b'
                      : '#8b5cf6'
                const zoneLabel = zone.zoneType.replaceAll('_', ' ')
                const zoneLabelWidth = Math.max(10, Math.min(24, zoneLabel.length * 1.15 + 2))
                const zoneLabelX = Math.max(1, Math.min(...corners.map((point) => point.x)) + 1)
                const zoneLabelY = Math.max(1, Math.min(...corners.map((point) => point.y)) + 1)
                return (
                  <g
                    key={zone.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select zone ${zone.zoneType}`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => {
                      if (!drawZoneMode) onZoneSelect?.(zone.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') onZoneSelect?.(zone.id)
                    }}
                  >
                    <polygon
                      points={corners.map((point) => `${point.x},${point.y}`).join(' ')}
                      fill={zoneColor}
                      fillOpacity={selected ? 0.35 : 0.2}
                      stroke={selected ? '#fef08a' : zoneColor}
                      strokeWidth={selected ? 0.8 : 0.35}
                    />
                    <rect
                      x={Math.min(zoneLabelX, grid.width - zoneLabelWidth - 1)}
                      y={Math.min(zoneLabelY, grid.height - 4.7)}
                      width={zoneLabelWidth}
                      height="3.7"
                      rx="0.9"
                      fill="#ffffff"
                      fillOpacity="0.92"
                      stroke={zoneColor}
                      strokeWidth="0.22"
                    />
                    <text
                      x={Math.min(zoneLabelX, grid.width - zoneLabelWidth - 1) + 1}
                      y={Math.min(zoneLabelY, grid.height - 4.7) + 2.5}
                      fill="#334155"
                      fontSize="1.75"
                      fontWeight="700"
                    >
                      {zoneLabel}
                    </text>
                  </g>
                )
              })}

              {showEndpoints && endpoints.map((endpoint) => {
                const point = toGridPoint(endpoint.positionX, endpoint.positionY)
                const mapTheta = endpoint.theta - (grid?.originYaw ?? 0)
                const headingLength = 4
                const heading = {
                  x: point.x + Math.cos(mapTheta) * headingLength,
                  y: point.y - Math.sin(mapTheta) * headingLength,
                }
                const selected = endpoint.id === selectedEndpointId
                const endpointColor = !endpoint.isActive
                  ? '#64748b'
                  : endpoint.endpointType === 'CHARGER'
                    ? '#f97316'
                    : endpoint.endpointType === 'PARK'
                      ? '#8b5cf6'
                      : '#047857'
                const endpointLabel = endpoint.name.trim().slice(0, 16)
                const endpointLabelWidth = Math.max(10, Math.min(24, endpointLabel.length * 1.25 + 2))
                const endpointLabelX = point.x > grid.width - endpointLabelWidth - 3
                  ? point.x - endpointLabelWidth - 2
                  : point.x + 2
                const endpointLabelY = point.y < 6 ? point.y + 2.2 : point.y - 5
                return (
                  <g
                    key={endpoint.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select endpoint ${endpoint.name}`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => onEndpointSelect?.(endpoint.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') onEndpointSelect?.(endpoint.id)
                    }}
                  >
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={heading.x}
                      y2={heading.y}
                      stroke={endpointColor}
                      strokeWidth="0.7"
                      strokeLinecap="round"
                    />
                    <circle cx={heading.x} cy={heading.y} r="0.75" fill={endpointColor} />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="2.3"
                      fill={endpointColor}
                      fillOpacity="0.16"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={selected ? 1.5 : 1.1}
                      fill={endpoint.isActive ? '#ecfdf5' : '#f1f5f9'}
                      stroke={selected ? '#fef08a' : endpointColor}
                      strokeWidth={selected ? 0.8 : 0.55}
                    />
                    <rect
                      x={endpointLabelX}
                      y={endpointLabelY}
                      width={endpointLabelWidth}
                      height="3.7"
                      rx="0.9"
                      fill="#f0fdf4"
                      stroke="#86efac"
                      strokeWidth="0.22"
                    />
                    <text
                      x={endpointLabelX + 1}
                      y={endpointLabelY + 2.5}
                      fill="#166534"
                      fontSize="1.75"
                      fontWeight="700"
                    >
                      {endpointLabel}
                    </text>
                  </g>
                )
              })}

              {drawZoneMode && drawStart && drawCurrent && (
                <polygon
                  points={getZoneCorners(drawStart, drawCurrent)
                    .map((point) => `${point.x},${point.y}`)
                    .join(' ')}
                  fill="#3b82f6"
                  fillOpacity="0.2"
                  stroke="#60a5fa"
                  strokeWidth="0.4"
                  strokeDasharray="1.5 1"
                  className="pointer-events-none"
                />
              )}

              {endpointPlacementMode && drawStart && drawCurrent && (
                <g className="pointer-events-none">
                  <circle
                    cx={drawStart.x}
                    cy={drawStart.y}
                    r="1.5"
                    fill="#ecfdf5"
                    stroke="#34d399"
                    strokeWidth="0.6"
                  />
                  <line
                    x1={drawStart.x}
                    y1={drawStart.y}
                    x2={drawCurrent.x}
                    y2={drawCurrent.y}
                    stroke="#34d399"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeDasharray="1.5 0.8"
                  />
                  <circle cx={drawCurrent.x} cy={drawCurrent.y} r="0.8" fill="#34d399" />
                </g>
              )}
            </svg>
          )}

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
