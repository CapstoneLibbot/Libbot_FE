import { useRef, type PointerEvent } from 'react'

import type {
  OccupancyMapMetadata,
  PathPoint2D,
  Pose2D,
} from '../types/runtime'
import { mapToPixel, pixelToMap } from '../utils/coordinates'
import { rotatePointAroundCenter } from '../utils/orientation'

type Props = {
  map: OccupancyMapMetadata
  robot?: Pose2D
  draft?: Pose2D | null
  path?: PathPoint2D[] | null
  onDraftChange: (pose: Pose2D) => void
}

export default function OperationsMap2D({
  map,
  robot,
  draft,
  path,
  onDraftChange,
}: Props) {
  const dragStart = useRef<Omit<Pose2D, 'yaw'> | null>(null)
  const rotationAngle = map.verticalRotation ?? 0
  const rotationCosine = Math.abs(Math.cos(rotationAngle))
  const rotationSine = Math.abs(Math.sin(rotationAngle))
  const rotatedWidth = rotationCosine * map.imageWidth + rotationSine * map.imageHeight
  const rotatedHeight = rotationSine * map.imageWidth + rotationCosine * map.imageHeight

  const eventPoint = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return null
    const viewPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const centeredPoint = rotatePointAroundCenter(
      { x: viewPoint.x, y: viewPoint.y },
      { x: rotatedWidth / 2, y: rotatedHeight / 2 },
      -rotationAngle,
    )
    const pixelX = centeredPoint.x + (map.imageWidth - rotatedWidth) / 2
    const pixelY = centeredPoint.y + (map.imageHeight - rotatedHeight) / 2
    if (pixelX < 0 || pixelX > map.imageWidth || pixelY < 0 || pixelY > map.imageHeight) return null
    return pixelToMap(pixelX, pixelY, map)
  }

  const pointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const point = eventPoint(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = point
    onDraftChange({ ...point, yaw: robot?.yaw ?? 0 })
  }

  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragStart.current) return
    const point = eventPoint(event)
    if (!point) return
    const dx = point.x - dragStart.current.x
    const dy = point.y - dragStart.current.y
    const yaw = Math.hypot(dx, dy) > map.resolution
      ? Math.atan2(dy, dx)
      : robot?.yaw ?? 0
    onDraftChange({ ...dragStart.current, yaw })
  }

  const pathPixels = path?.map((point) => mapToPixel(point.x, point.y, map))
  const robotPixel = robot ? mapToPixel(robot.x, robot.y, map) : null
  const draftPixel = draft ? mapToPixel(draft.x, draft.y, map) : null

  return (
    <svg
      className="h-full min-h-0 w-full touch-none cursor-crosshair select-none"
      viewBox={`0 0 ${rotatedWidth} ${rotatedHeight}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={() => { dragStart.current = null }}
      onPointerCancel={() => { dragStart.current = null }}
      role="application"
      aria-label="Robot navigation map"
    >
      <g transform={`translate(${rotatedWidth / 2} ${rotatedHeight / 2}) rotate(${(rotationAngle * 180) / Math.PI}) translate(${-map.imageWidth / 2} ${-map.imageHeight / 2})`}>
      {map.occupancyImage ? (
        <image href={map.occupancyImage} width={map.imageWidth} height={map.imageHeight} preserveAspectRatio="none" className="[image-rendering:pixelated]" />
      ) : (
        <>
          <rect width={map.imageWidth} height={map.imageHeight} fill="#e8edf0" />
          {map.obstacles.map((obstacle, index) => (
            <rect key={`${obstacle.pixelX}-${obstacle.pixelY}-${index}`} x={obstacle.pixelX} y={obstacle.pixelY} width={obstacle.pixelWidth} height={obstacle.pixelHeight} fill="#334852" />
          ))}
        </>
      )}
      {pathPixels && pathPixels.length > 1 && (
        <polyline points={pathPixels.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#22c8f2" strokeWidth="0.8" strokeDasharray="1.5 1" />
      )}
      {draftPixel && draft && (
        <g transform={`translate(${draftPixel.x} ${draftPixel.y}) rotate(${(-draft.yaw * 180) / Math.PI})`}>
          <circle r="2" fill="rgba(250,174,55,.25)" stroke="#faad37" strokeWidth="0.6" />
          <path d="M 0 0 L 5 0 M 5 0 L 3.5 -1 M 5 0 L 3.5 1" stroke="#faad37" strokeWidth="0.7" fill="none" />
        </g>
      )}
      {robotPixel && robot && (
        <g transform={`translate(${robotPixel.x} ${robotPixel.y}) rotate(${(-robot.yaw * 180) / Math.PI})`}>
          <circle r="2.3" fill="#ecfeff" stroke="#0891b2" strokeWidth="0.7" />
          <path d="M 2.8 0 L -1.5 -1.5 L -1.5 1.5 Z" fill="#0891b2" />
        </g>
      )}
      </g>
    </svg>
  )
}
