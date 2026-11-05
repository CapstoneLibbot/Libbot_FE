import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'

type SceneComponent = {
  name: string
  category: string
  label: string
  worldX: number
  worldY: number
  worldZ: number
  size: [number, number, number]
  color: string
}

type SdfScene = {
  origin: [number, number, number]
  widthMeters: number
  heightMeters: number
  floorThicknessMeters: number
  wallHeightMeters: number
  bookshelfCount: number
  robotSpawn: RobotPose
  simulationBookTarget?: RobotPose & { shelfId: string; label: string }
  areas?: { id: string; type: string; label: string; x: number; y: number; size: [number, number]; color: string }[]
  components: SceneComponent[]
}

type ProjectedPoint = { x: number; y: number }
type RobotPose = { x: number; y: number; yaw: number }

function shadeColor(hex: string, factor: number) {
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) =>
    Math.max(0, Math.min(255, Math.round(parseInt(value.slice(offset, offset + 2), 16) * factor))),
  )
  return `rgb(${channels.join(', ')})`
}

// Start from the open south entrance so the closed walls do not hide the furniture.
const DEFAULT_AZIMUTH = -3 * Math.PI / 4
const DEFAULT_ZOOM = 1
const ELEVATION = Math.PI / 5

function tracePolygon(
  context: CanvasRenderingContext2D,
  points: ProjectedPoint[],
) {
  if (points.length === 0) return

  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) context.lineTo(point.x, point.y)
  context.closePath()
}

function drawBox(
  context: CanvasRenderingContext2D,
  project: (x: number, y: number, z: number) => ProjectedPoint,
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number },
  azimuth: number,
  colors: { top: string; xSide: string; ySide: string; edge: string },
) {
  const { minX, maxX, minY, maxY, minZ, maxZ } = bounds
  const xFace = Math.sin(azimuth) >= 0 ? maxX : minX
  const yFace = Math.cos(azimuth) >= 0 ? maxY : minY
  const faces = [
    {
      points: [
        project(xFace, minY, minZ), project(xFace, maxY, minZ),
        project(xFace, maxY, maxZ), project(xFace, minY, maxZ),
      ],
      color: colors.xSide,
    },
    {
      points: [
        project(minX, yFace, minZ), project(maxX, yFace, minZ),
        project(maxX, yFace, maxZ), project(minX, yFace, maxZ),
      ],
      color: colors.ySide,
    },
  ]

  context.lineWidth = 0.8
  context.strokeStyle = colors.edge
  for (const face of faces) {
    tracePolygon(context, face.points)
    context.fillStyle = face.color
    context.fill()
    context.stroke()
  }

  tracePolygon(context, [
    project(minX, minY, maxZ), project(maxX, minY, maxZ),
    project(maxX, maxY, maxZ), project(minX, maxY, maxZ),
  ])
  context.fillStyle = colors.top
  context.fill()
  context.stroke()
}

function drawScene(
  canvas: HTMLCanvasElement,
  scene: SdfScene,
  azimuth: number,
  zoom: number,
  liveRobotPose?: RobotPose | null,
) {
  const context = canvas.getContext('2d')
  if (!context) return

  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width === 0 || height === 0) return

  const pixelRatio = window.devicePixelRatio || 1
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#0c0d10'
  context.fillRect(0, 0, width, height)

  const [originX, originY] = scene.origin
  const centerX = originX + scene.widthMeters / 2
  const centerY = originY + scene.heightMeters / 2
  const sineAzimuth = Math.sin(azimuth)
  const cosineAzimuth = Math.cos(azimuth)
  const sineElevation = Math.sin(ELEVATION)
  const cosineElevation = Math.cos(ELEVATION)
  const projectRaw = (x: number, y: number, z: number): ProjectedPoint => {
    const relativeX = x - centerX
    const relativeY = y - centerY
    const horizontal = relativeX * cosineAzimuth - relativeY * sineAzimuth
    const depth = relativeX * sineAzimuth + relativeY * cosineAzimuth
    return {
      x: horizontal,
      y: depth * sineElevation - z * cosineElevation,
    }
  }

  const mapCorners = [
    [originX, originY],
    [originX + scene.widthMeters, originY],
    [originX + scene.widthMeters, originY + scene.heightMeters],
    [originX, originY + scene.heightMeters],
  ]
  const highZ = Math.max(
    scene.wallHeightMeters,
    ...scene.components.map((component) => component.worldZ + component.size[2] / 2),
  )
  const projectedBounds = [
    ...mapCorners.flatMap(([x, y]) => [
      projectRaw(x, y, -scene.floorThicknessMeters),
      projectRaw(x, y, 0),
      projectRaw(x, y, highZ),
    ]),
    ...scene.components.flatMap((component) => {
      const [sizeX, sizeY, sizeZ] = component.size
      return [
        projectRaw(component.worldX - sizeX / 2, component.worldY - sizeY / 2, component.worldZ - sizeZ / 2),
        projectRaw(component.worldX + sizeX / 2, component.worldY + sizeY / 2, component.worldZ + sizeZ / 2),
      ]
    }),
  ]
  const minProjectedX = Math.min(...projectedBounds.map((point) => point.x))
  const maxProjectedX = Math.max(...projectedBounds.map((point) => point.x))
  const minProjectedY = Math.min(...projectedBounds.map((point) => point.y))
  const maxProjectedY = Math.max(...projectedBounds.map((point) => point.y))
  const sceneWidth = Math.max(maxProjectedX - minProjectedX, 0.01)
  const sceneHeight = Math.max(maxProjectedY - minProjectedY, 0.01)
  const margin = 72
  const scale = Math.min(
    (width - margin * 2) / sceneWidth,
    (height - margin * 2) / sceneHeight,
  ) * zoom
  const midpointX = (minProjectedX + maxProjectedX) / 2
  const midpointY = (minProjectedY + maxProjectedY) / 2
  const project = (x: number, y: number, z: number): ProjectedPoint => {
    const point = projectRaw(x, y, z)
    return {
      x: width / 2 + (point.x - midpointX) * scale,
      y: height / 2 + (point.y - midpointY) * scale,
    }
  }

  drawBox(context, project, {
    minX: originX,
    maxX: originX + scene.widthMeters,
    minY: originY,
    maxY: originY + scene.heightMeters,
    minZ: -scene.floorThicknessMeters,
    maxZ: 0,
  }, azimuth, {
    top: '#dce3df',
    xSide: '#808b89',
    ySide: '#667270',
    edge: '#aeb9b4',
  })

  context.save()
  context.beginPath()
  tracePolygon(context, [
    project(originX, originY, 0.004),
    project(originX + scene.widthMeters, originY, 0.004),
    project(originX + scene.widthMeters, originY + scene.heightMeters, 0.004),
    project(originX, originY + scene.heightMeters, 0.004),
  ])
  context.clip()
  context.strokeStyle = 'rgba(32, 45, 43, 0.18)'
  context.lineWidth = 0.7
  const gridStep = 1
  for (let x = Math.ceil(originX / gridStep) * gridStep; x < originX + scene.widthMeters; x += gridStep) {
    const start = project(x, originY, 0.005)
    const end = project(x, originY + scene.heightMeters, 0.005)
    context.beginPath()
    context.moveTo(start.x, start.y)
    context.lineTo(end.x, end.y)
    context.stroke()
  }
  for (let y = Math.ceil(originY / gridStep) * gridStep; y < originY + scene.heightMeters; y += gridStep) {
    const start = project(originX, y, 0.005)
    const end = project(originX + scene.widthMeters, y, 0.005)
    context.beginPath()
    context.moveTo(start.x, start.y)
    context.lineTo(end.x, end.y)
    context.stroke()
  }
  context.restore()

  const components = [...scene.components].sort((left, right) => {
    const leftDepth = left.worldX * sineAzimuth + left.worldY * cosineAzimuth
    const rightDepth = right.worldX * sineAzimuth + right.worldY * cosineAzimuth
    return leftDepth - rightDepth
  })
  for (const component of components) {
    const [sizeX, sizeY, sizeZ] = component.size
    drawBox(context, project, {
      minX: component.worldX - sizeX / 2,
      maxX: component.worldX + sizeX / 2,
      minY: component.worldY - sizeY / 2,
      maxY: component.worldY + sizeY / 2,
      minZ: component.worldZ - sizeZ / 2,
      maxZ: component.worldZ + sizeZ / 2,
    }, azimuth, {
      top: shadeColor(component.color, 1.15),
      xSide: shadeColor(component.color, 0.72),
      ySide: shadeColor(component.color, 0.58),
      edge: shadeColor(component.color, 0.45),
    })
  }

  for (const area of scene.areas ?? []) {
    const labelPoint = project(area.x, area.y, 0.08)
    context.font = '700 12px Inter, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    const labelWidth = context.measureText(area.label).width
    context.fillStyle = 'rgba(255, 255, 255, 0.88)'
    context.fillRect(labelPoint.x - labelWidth / 2 - 7, labelPoint.y - 11, labelWidth + 14, 22)
    context.strokeStyle = 'rgba(30, 41, 59, 0.65)'
    context.lineWidth = 1
    context.strokeRect(labelPoint.x - labelWidth / 2 - 7, labelPoint.y - 11, labelWidth + 14, 22)
    context.fillStyle = '#1f2937'
    context.fillText(area.label, labelPoint.x, labelPoint.y)
  }
  context.textAlign = 'start'
  context.textBaseline = 'alphabetic'

  if (scene.simulationBookTarget) {
    const target = scene.simulationBookTarget
    const marker = project(target.x, target.y, 0.08)
    context.beginPath()
    context.arc(marker.x, marker.y, 11, 0, Math.PI * 2)
    context.strokeStyle = '#22d3ee'
    context.lineWidth = 3
    context.stroke()
    context.beginPath()
    context.arc(marker.x, marker.y, 3, 0, Math.PI * 2)
    context.fillStyle = '#22d3ee'
    context.fill()
    context.font = '700 12px Inter, sans-serif'
    context.textAlign = 'center'
    context.fillStyle = '#cffafe'
    context.fillText(target.label, marker.x, marker.y - 16)
    context.textAlign = 'start'
  }

  const robot = liveRobotPose ?? scene.robotSpawn
  if (robot) {
    const bodyLength = 0.7
    const bodyWidth = 0.52
    const bodyHeight = 0.3
    const bodyCenterZ = bodyHeight / 2 + 0.03
    drawBox(context, project, {
      minX: robot.x - bodyLength / 2,
      maxX: robot.x + bodyLength / 2,
      minY: robot.y - bodyWidth / 2,
      maxY: robot.y + bodyWidth / 2,
      minZ: 0.03,
      maxZ: bodyHeight + 0.03,
    }, azimuth, {
      top: '#f97316',
      xSide: '#c2410c',
      ySide: '#9a3412',
      edge: '#fff7ed',
    })

    const marker = project(robot.x, robot.y, bodyCenterZ + 0.04)
    const heading = project(
      robot.x + Math.cos(robot.yaw) * 0.8,
      robot.y + Math.sin(robot.yaw) * 0.8,
      bodyCenterZ + 0.04,
    )
    context.beginPath()
    context.moveTo(marker.x, marker.y)
    context.lineTo(heading.x, heading.y)
    context.strokeStyle = '#fff7ed'
    context.lineWidth = 3
    context.lineCap = 'round'
    context.stroke()

    const directionX = heading.x - marker.x
    const directionY = heading.y - marker.y
    const directionLength = Math.hypot(directionX, directionY) || 1
    const unitX = directionX / directionLength
    const unitY = directionY / directionLength
    const perpendicularX = -unitY
    const perpendicularY = unitX
    context.beginPath()
    context.moveTo(heading.x + unitX * 5, heading.y + unitY * 5)
    context.lineTo(heading.x - unitX * 5 + perpendicularX * 4, heading.y - unitY * 5 + perpendicularY * 4)
    context.lineTo(heading.x - unitX * 5 - perpendicularX * 4, heading.y - unitY * 5 - perpendicularY * 4)
    context.closePath()
    context.fillStyle = '#fff7ed'
    context.fill()

    context.beginPath()
    context.arc(marker.x, marker.y, 8, 0, Math.PI * 2)
    context.fillStyle = '#ea580c'
    context.fill()
    context.lineWidth = 2
    context.strokeStyle = '#fff'
    context.stroke()
  }
}

function SdfScene3D({ liveRobotPose = null }: { liveRobotPose?: RobotPose | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ pointerX: number; azimuth: number } | null>(null)
  const [scene, setScene] = useState<SdfScene | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [azimuth, setAzimuth] = useState(DEFAULT_AZIMUTH)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/maps/library-map.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<SdfScene>
      })
      .then(setScene)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        setError('Không tải được cấu hình 3D. Hãy chạy lại tools/generate_library_layout.py.')
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !scene) return

    const render = () => drawScene(canvas, scene, azimuth, zoom, liveRobotPose)
    const observer = new ResizeObserver(render)
    observer.observe(canvas)
    render()
    return () => observer.disconnect()
  }, [scene, azimuth, zoom, liveRobotPose?.x, liveRobotPose?.y, liveRobotPose?.yaw])

  const robot = liveRobotPose ?? scene?.robotSpawn

  const resetView = () => {
    setAzimuth(DEFAULT_AZIMUTH)
    setZoom(DEFAULT_ZOOM)
  }

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-[#0c0d10]">
      {scene && !error && (
        <canvas
          ref={canvasRef}
          aria-label={liveRobotPose ? 'Gazebo library layout with live robot position' : 'Gazebo library layout with robot spawn position'}
          className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={(event) => {
            dragRef.current = { pointerX: event.clientX, azimuth }
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (!dragRef.current) return
            setAzimuth(dragRef.current.azimuth + (event.clientX - dragRef.current.pointerX) * 0.008)
          }}
          onPointerUp={() => { dragRef.current = null }}
          onPointerCancel={() => { dragRef.current = null }}
          onWheel={(event) => {
            event.preventDefault()
            setZoom((current) => Math.max(0.65, Math.min(2.4, current * (event.deltaY < 0 ? 1.08 : 0.92))))
          }}
        />
      )}

      <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/10 bg-[#121318]/90 px-3 py-2 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold text-white">Gazebo · library layout</p>
        {scene && (
          <p className="mt-1 text-[11px] text-white/50">
            {scene.widthMeters.toFixed(1)} × {scene.heightMeters.toFixed(1)} m · {scene.bookshelfCount} kệ sách · khu đọc · quầy thủ thư
          </p>
        )}
      </div>

      {scene && (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-[#121318]/85 px-3 py-2 text-[11px] text-white/50">
          Kéo để xoay · cuộn để phóng to/thu nhỏ
          {robot && <span className="mt-1 block text-orange-200">Robot {liveRobotPose ? 'trực tiếp' : 'vị trí khởi tạo'} · X {robot.x.toFixed(1)} m · Y {robot.y.toFixed(1)} m</span>}
        </div>
      )}

      {scene && (
        <button
          type="button"
          onClick={resetView}
          title="Đặt lại góc nhìn"
          aria-label="Đặt lại góc nhìn 3D"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#121318]/90 text-white/75 shadow-lg hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}

      {!scene && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
          Đang tải cấu hình SDF…
        </div>
      )}
      {error && (
        <div role="alert" className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-rose-300">
          {error}
        </div>
      )}
    </div>
  )
}

export default SdfScene3D
