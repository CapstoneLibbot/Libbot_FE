import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { Bot, Minus, Plus, RotateCcw } from 'lucide-react'
import { load } from 'js-yaml'
import type {
  EndpointGroup,
  EndpointLinkedObject,
  MapAisle,
} from '../../types/map'

export type MapEndpoint = {
  id: number
  map_id: number
  code: string
  name: string
  description: string | null
  position_x: number
  position_y: number
  is_active: boolean
  linked_object: EndpointLinkedObject
  endpoint_groups: EndpointGroup[]
}

export type MapZone = {
  id: number
  map_id: number
  code: string
  name: string
  zone_type: 1 | 2 | 3 | 4
  max_speed: number
  preferred_direction: string
  corridor_width: number
  allow_turnaround: boolean
  description: string
  min_x: number
  min_y: number
  max_x: number
  max_y: number
  is_active: boolean
}

type Point = {
  x: number
  y: number
}

export type MapRoutePoint = Point

type MapViewerProps = {
  yamlUrl: string
  endpoints: MapEndpoint[]
  aisles: MapAisle[]
  zones: MapZone[]
  selectedEndpointId: number | null
  selectedZoneId: number | null
  showEndpoints: boolean
  showZones: boolean
  zoneDrawMode: boolean
  routePoints?: MapRoutePoint[]
  routeProgressRatio?: number
  routeLabel?: string
  animateRoute?: boolean
  showEndpointLabels?: boolean
  onEndpointSelect: (endpointId: number) => void
  onZoneSelect: (zoneId: number) => void
  onMapClick: (point: {
    x: number
    y: number
    screenX: number
    screenY: number
  }) => void
  onZoneDrawComplete: (rect: {
    min_x: number
    min_y: number
    max_x: number
    max_y: number
  }) => void
}

type MapConfig = {
  image: string
  resolution: number
  origin: [number, number, number]
}

type RenderTransform = {
  scale: number
  offsetX: number
  offsetY: number
}

function parseYaml(text: string): MapConfig {
  const parsed = load(text)

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Map YAML must contain a configuration object.')
  }

  const config = parsed as Record<string, unknown>
  const image = config.image
  const resolution = Number(config.resolution)
  const origin = config.origin

  if (typeof image !== 'string' || !image.trim()) {
    throw new Error('Map YAML must specify an image filename.')
  }

  if (!Number.isFinite(resolution) || resolution <= 0) {
    throw new Error('Map YAML must specify a positive resolution.')
  }

  if (
    !Array.isArray(origin) ||
    origin.length < 3 ||
    !origin.slice(0, 3).every((value) => Number.isFinite(Number(value)))
  ) {
    throw new Error('Map YAML must specify a three-value origin.')
  }

  return {
    image,
    resolution,
    origin: [
      Number(origin[0]),
      Number(origin[1]),
      Number(origin[2]),
    ],
  }
}

function readToken(
  bytes: Uint8Array,
  start: number,
): { token: string; next: number } {
  let index = start

  while (index < bytes.length) {
    const char = bytes[index]

    if (char === 35) {
      while (index < bytes.length && bytes[index] !== 10) {
        index += 1
      }
    } else if (char <= 32) {
      index += 1
    } else {
      break
    }
  }

  const tokenStart = index

  while (index < bytes.length && bytes[index] > 32) {
    index += 1
  }

  return {
    token: new TextDecoder().decode(bytes.slice(tokenStart, index)),
    next: index,
  }
}

function parsePgm(buffer: ArrayBuffer): ImageData {
  const bytes = new Uint8Array(buffer)

  const magic = readToken(bytes, 0)
  const width = readToken(bytes, magic.next)
  const height = readToken(bytes, width.next)
  const maxValue = readToken(bytes, height.next)

  if (magic.token !== 'P5') {
    throw new Error('Only binary PGM (P5) files are supported.')
  }

  const imageWidth = Number(width.token)
  const imageHeight = Number(height.token)
  const max = Number(maxValue.token)

  let pixelStart = maxValue.next

  if (bytes[pixelStart] === 13 && bytes[pixelStart + 1] === 10) {
    pixelStart += 2
  } else if (bytes[pixelStart] <= 32) {
    pixelStart += 1
  } else {
    throw new Error('PGM header is missing its pixel-data separator.')
  }

  if (
    !Number.isInteger(imageWidth) ||
    !Number.isInteger(imageHeight) ||
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    max !== 255 ||
    bytes.length - pixelStart < imageWidth * imageHeight
  ) {
    throw new Error('PGM dimensions or pixel data are invalid.')
  }

  const imageData = new ImageData(imageWidth, imageHeight)

  for (let i = 0; i < imageWidth * imageHeight; i += 1) {
    const value = bytes[pixelStart + i] ?? 255
    const normalized =
      max === 255 ? value : Math.round((value / max) * 255)

    const offset = i * 4

    imageData.data[offset] = normalized
    imageData.data[offset + 1] = normalized
    imageData.data[offset + 2] = normalized
    imageData.data[offset + 3] = 255
  }

  return imageData
}

function worldToPixel(
  point: Point,
  config: MapConfig,
  _imageWidth: number,
  imageHeight: number,
): Point {
  return {
    x: (point.x - config.origin[0]) / config.resolution,
    y:
      imageHeight -
      (point.y - config.origin[1]) / config.resolution,
  }
}

function pixelToWorld(
  point: Point,
  config: MapConfig,
  _imageWidth: number,
  imageHeight: number,
): Point {
  return {
    x: config.origin[0] + point.x * config.resolution,
    y:
      config.origin[1] +
      (imageHeight - point.y) * config.resolution,
  }
}

function getZoneFill(zoneType: MapZone['zone_type']) {
  switch (zoneType) {
    case 1:
      return 'rgba(220, 38, 38, 0.28)'
    case 2:
      return 'rgba(234, 179, 8, 0.25)'
    case 3:
      return 'rgba(37, 99, 235, 0.24)'
    case 4:
      return 'rgba(124, 58, 237, 0.28)'
  }
}

function getZoneStroke(zoneType: MapZone['zone_type']) {
  switch (zoneType) {
    case 1:
      return '#ef4444'
    case 2:
      return '#eab308'
    case 3:
      return '#3b82f6'
    case 4:
      return '#8b5cf6'
  }
}

function MapViewer({
  yamlUrl,
  endpoints,
  aisles,
  zones,
  selectedEndpointId,
  selectedZoneId,
  showEndpoints,
  showZones,
  zoneDrawMode,
  routePoints = [],
  routeProgressRatio,
  routeLabel,
  animateRoute = false,
  showEndpointLabels = true,
  onEndpointSelect,
  onZoneSelect,
  onMapClick,
  onZoneDrawComplete,
}: MapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const imageDataRef = useRef<ImageData | null>(null)
  const configRef = useRef<MapConfig | null>(null)
  const transformRef = useRef<RenderTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })
  const viewRef = useRef({ zoom: 1, panX: 0, panY: 0 })
  const drawRef = useRef<(() => void) | null>(null)

  const dragStartRef = useRef<Point | null>(null)
  const panStartRef = useRef<{
    x: number
    y: number
    panX: number
    panY: number
  } | null>(null)
  const draggingRef = useRef(false)
  const suppressClickRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewRect, setPreviewRect] = useState<{
    start: Point
    end: Point
  } | null>(null)
  const [clickedPosition, setClickedPosition] =
    useState<Point | null>(null)
  const [robotPosition, setRobotPosition] = useState<{
    x: number
    y: number
    angle: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMap() {
      try {
        setLoading(true)
        setError(null)

        const yamlResponse = await fetch(yamlUrl)

        if (!yamlResponse.ok) {
          throw new Error('Unable to load map YAML.')
        }

        const yamlText = await yamlResponse.text()
        const config = parseYaml(yamlText)

        const imageUrl = new URL(
          config.image,
          new URL(yamlUrl, window.location.origin),
        ).toString()

        const pgmResponse = await fetch(imageUrl)

        if (!pgmResponse.ok) {
          throw new Error('Unable to load map PGM.')
        }

        const buffer = await pgmResponse.arrayBuffer()
        const parsedImage = parsePgm(buffer)

        if (cancelled) {
          return
        }

        configRef.current = config
        imageDataRef.current = parsedImage
        viewRef.current = { zoom: 1, panX: 0, panY: 0 }

        setLoading(false)
      } catch (err) {
        if (cancelled) {
          return
        }

        setLoading(false)
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load map.',
        )
      }
    }

    void loadMap()

    return () => {
      cancelled = true
    }
  }, [yamlUrl])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current

    if (!container || !canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const draw = () => {
      const imageData = imageDataRef.current
      const config = configRef.current

      if (!imageData || !config) {
        return
      }

      const width = container.clientWidth
      const height = container.clientHeight

      if (!width || !height) {
        return
      }

      const devicePixelRatio = window.devicePixelRatio || 1

      canvas.width = Math.floor(width * devicePixelRatio)
      canvas.height = Math.floor(height * devicePixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

      context.fillStyle = '#0c0d10'
      context.fillRect(0, 0, width, height)

      const fitScale = Math.min(
        width / imageData.width,
        height / imageData.height,
      )
      const scale = fitScale * viewRef.current.zoom

      const drawWidth = imageData.width * scale
      const drawHeight = imageData.height * scale

      const offsetX =
        (width - drawWidth) / 2 + viewRef.current.panX
      const offsetY =
        (height - drawHeight) / 2 + viewRef.current.panY

      transformRef.current = {
        scale,
        offsetX,
        offsetY,
      }

      const bitmapCanvas = document.createElement('canvas')
      bitmapCanvas.width = imageData.width
      bitmapCanvas.height = imageData.height

      const bitmapContext = bitmapCanvas.getContext('2d')

      if (!bitmapContext) {
        return
      }

      bitmapContext.putImageData(imageData, 0, 0)

      context.imageSmoothingEnabled = false

      context.drawImage(
        bitmapCanvas,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight,
      )

      context.strokeStyle = 'rgba(0, 0, 0, 0.12)'
      context.lineWidth = 1

      const gridSize = 50 * scale

      if (gridSize > 8) {
        for (
          let x = offsetX % gridSize;
          x < width;
          x += gridSize
        ) {
          context.beginPath()
          context.moveTo(x, offsetY)
          context.lineTo(x, offsetY + drawHeight)
          context.stroke()
        }

        for (
          let y = offsetY % gridSize;
          y < height;
          y += gridSize
        ) {
          context.beginPath()
          context.moveTo(offsetX, y)
          context.lineTo(offsetX + drawWidth, y)
          context.stroke()
        }
      }

      if (showZones) {
        for (const zone of zones) {
          const topLeft = worldToPixel(
            { x: zone.min_x, y: zone.max_y },
            config,
            imageData.width,
            imageData.height,
          )

          const bottomRight = worldToPixel(
            { x: zone.max_x, y: zone.min_y },
            config,
            imageData.width,
            imageData.height,
          )

          const x = offsetX + topLeft.x * scale
          const y = offsetY + topLeft.y * scale
          const zoneWidth = (bottomRight.x - topLeft.x) * scale
          const zoneHeight = (bottomRight.y - topLeft.y) * scale

          context.fillStyle = getZoneFill(zone.zone_type)
          context.strokeStyle =
            selectedZoneId === zone.id
              ? '#ffffff'
              : getZoneStroke(zone.zone_type)

          context.lineWidth =
            selectedZoneId === zone.id ? 3 : 2

          context.fillRect(x, y, zoneWidth, zoneHeight)
          context.strokeRect(x, y, zoneWidth, zoneHeight)

          context.fillStyle = '#111827'
          context.font = '600 12px Inter, sans-serif'
          context.fillText(zone.code, x + 6, y + 16)
        }
      }

      if (previewRect) {
        const start = worldToPixel(
          previewRect.start,
          config,
          imageData.width,
          imageData.height,
        )

        const end = worldToPixel(
          previewRect.end,
          config,
          imageData.width,
          imageData.height,
        )

        const x = offsetX + Math.min(start.x, end.x) * scale
        const y = offsetY + Math.min(start.y, end.y) * scale
        const rectWidth = Math.abs(end.x - start.x) * scale
        const rectHeight = Math.abs(end.y - start.y) * scale

        context.fillStyle = 'rgba(0, 86, 210, 0.2)'
        context.strokeStyle = '#0056d2'
        context.lineWidth = 2
        context.setLineDash([6, 4])
        context.fillRect(x, y, rectWidth, rectHeight)
        context.strokeRect(x, y, rectWidth, rectHeight)
        context.setLineDash([])
      }

      if (showEndpoints) {
        for (const aisle of aisles) {
          const endpointA = endpoints.find(
            (endpoint) => endpoint.id === aisle.endpointA_id,
          )
          const endpointB = endpoints.find(
            (endpoint) => endpoint.id === aisle.endpointB_id,
          )

          if (!endpointA || !endpointB) {
            continue
          }

          const pointA = worldToPixel(
            { x: endpointA.position_x, y: endpointA.position_y },
            config,
            imageData.width,
            imageData.height,
          )
          const pointB = worldToPixel(
            { x: endpointB.position_x, y: endpointB.position_y },
            config,
            imageData.width,
            imageData.height,
          )
          const screenAX = offsetX + pointA.x * scale
          const screenAY = offsetY + pointA.y * scale
          const screenBX = offsetX + pointB.x * scale
          const screenBY = offsetY + pointB.y * scale
          const midpointX = (screenAX + screenBX) / 2
          const midpointY = (screenAY + screenBY) / 2

          context.beginPath()
          context.moveTo(screenAX, screenAY)
          context.lineTo(screenBX, screenBY)
          context.lineCap = 'round'
          context.strokeStyle = 'rgba(15, 23, 42, 0.9)'
          context.lineWidth = 7
          context.stroke()
          context.strokeStyle = aisle.status.toUpperCase() === 'ACTIVE'
            ? '#f59e0b'
            : '#9ca3af'
          context.lineWidth = 3
          context.stroke()

          context.font = '600 11px Inter, sans-serif'
          context.lineWidth = 4
          context.strokeStyle = 'rgba(15, 23, 42, 0.95)'
          context.strokeText(aisle.code, midpointX + 5, midpointY - 5)
          context.fillStyle = '#fef3c7'
          context.fillText(aisle.code, midpointX + 5, midpointY - 5)
        }

        if (routePoints.length > 1) {
          const routePixels = routePoints.map((point) => {
            const pixel = worldToPixel(point, config, imageData.width, imageData.height)
            return { x: offsetX + pixel.x * scale, y: offsetY + pixel.y * scale }
          })
          const progressRatio = Math.max(0, Math.min(1, routeProgressRatio ?? 1))
          const totalLength = routePixels.slice(1).reduce((total, point, index) =>
            total + Math.hypot(point.x - routePixels[index].x, point.y - routePixels[index].y), 0,
          )
          const splitDistance = totalLength * progressRatio
          const completedPixels = [routePixels[0]]
          const upcomingPixels: Point[] = []
          let traversedDistance = 0

          for (let index = 0; index < routePixels.length - 1; index += 1) {
            const start = routePixels[index]
            const end = routePixels[index + 1]
            const segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
            if (traversedDistance + segmentLength <= splitDistance) {
              completedPixels.push(end)
              traversedDistance += segmentLength
              continue
            }

            const segmentProgress = segmentLength === 0
              ? 0
              : Math.max(0, (splitDistance - traversedDistance) / segmentLength)
            const splitPoint = {
              x: start.x + (end.x - start.x) * segmentProgress,
              y: start.y + (end.y - start.y) * segmentProgress,
            }
            if (segmentProgress > 0) completedPixels.push(splitPoint)
            upcomingPixels.push(splitPoint, end, ...routePixels.slice(index + 2))
            break
          }

          const strokeRoute = (points: Point[], dashed: boolean, color: string) => {
            if (points.length < 2) return
            context.beginPath()
            context.moveTo(points[0].x, points[0].y)
            points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
            context.lineJoin = 'round'
            context.lineCap = 'round'
            context.setLineDash(dashed ? [9, 8] : [])
            context.strokeStyle = 'rgba(255, 255, 255, 0.95)'
            context.lineWidth = 10
            context.stroke()
            context.strokeStyle = color
            context.lineWidth = 5
            context.stroke()
            context.setLineDash([])
          }

          context.save()
          strokeRoute(completedPixels, false, '#ea580c')
          strokeRoute(upcomingPixels, true, '#f59e0b')

          let distanceSinceArrow = 0
          for (let index = 0; index < routePixels.length - 1; index += 1) {
            const start = routePixels[index]
            const end = routePixels[index + 1]
            const deltaX = end.x - start.x
            const deltaY = end.y - start.y
            const segmentLength = Math.hypot(deltaX, deltaY)
            distanceSinceArrow += segmentLength

            if (distanceSinceArrow < 58 && index < routePixels.length - 2) continue
            distanceSinceArrow = 0

            const midpointX = (start.x + end.x) / 2
            const midpointY = (start.y + end.y) / 2
            context.save()
            context.translate(midpointX, midpointY)
            context.rotate(Math.atan2(deltaY, deltaX))
            context.beginPath()
            context.moveTo(9, 0)
            context.lineTo(-7, -7)
            context.lineTo(-4, 0)
            context.lineTo(-7, 7)
            context.closePath()
            context.fillStyle = '#c2410c'
            context.strokeStyle = '#ffffff'
            context.lineWidth = 1.5
            context.fill()
            context.stroke()
            context.restore()
          }

          const routeStart = routePixels[0]
          const routeEnd = routePixels[routePixels.length - 1]
          context.beginPath()
          context.arc(routeStart.x, routeStart.y, 8, 0, Math.PI * 2)
          context.fillStyle = '#16a34a'
          context.fill()
          context.lineWidth = 2
          context.strokeStyle = '#ffffff'
          context.stroke()
          context.beginPath()
          context.arc(routeEnd.x, routeEnd.y, 9, 0, Math.PI * 2)
          context.fillStyle = '#ea580c'
          context.fill()
          context.lineWidth = 2
          context.strokeStyle = '#ffffff'
          context.stroke()
          context.restore()
        }

        for (const endpoint of endpoints) {
          const pixel = worldToPixel(
            {
              x: endpoint.position_x,
              y: endpoint.position_y,
            },
            config,
            imageData.width,
            imageData.height,
          )

          const screenX = offsetX + pixel.x * scale
          const screenY = offsetY + pixel.y * scale

          const selected =
            endpoint.id === selectedEndpointId

          context.beginPath()
          context.arc(
            screenX,
            screenY,
            selected ? 9 : 7,
            0,
            Math.PI * 2,
          )

          context.fillStyle = endpoint.is_active
            ? '#22c55e'
            : '#6b7280'

          context.fill()

          context.lineWidth = selected ? 3 : 2
          context.strokeStyle = selected
            ? '#ffffff'
            : '#111827'

          context.stroke()

          if (selected) {
            context.beginPath()
            context.arc(
              screenX,
              screenY,
              14,
              0,
              Math.PI * 2,
            )

            context.strokeStyle = 'rgba(0, 86, 210, 0.8)'
            context.lineWidth = 2
            context.stroke()
          }

          if (showEndpointLabels) {
            context.fillStyle = '#111827'
            context.font = '600 11px Inter, sans-serif'
            context.fillText(
              endpoint.name || endpoint.code,
              screenX + 10,
              screenY - 10,
              220,
            )
          }
        }
      }
    }

    drawRef.current = draw
    draw()

    const observer = new ResizeObserver(draw)
    observer.observe(container)

    return () => {
      observer.disconnect()
      if (drawRef.current === draw) {
        drawRef.current = null
      }
    }
  }, [
    endpoints,
    aisles,
    zones,
    routePoints,
    routeProgressRatio,
    selectedEndpointId,
    selectedZoneId,
    showEndpointLabels,
    showEndpoints,
    showZones,
    previewRect,
    loading,
  ])

  useEffect(() => {
    if ((!animateRoute && routeProgressRatio === undefined) || loading || routePoints.length < 2) {
      setRobotPosition(null)
      return
    }

    const imageData = imageDataRef.current
    const config = configRef.current
    const container = containerRef.current
    if (!imageData || !config || !container) return

    const segmentLengths = routePoints.slice(1).map((point, index) =>
      Math.hypot(point.x - routePoints[index].x, point.y - routePoints[index].y),
    )
    const totalLength = segmentLengths.reduce((total, length) => total + length, 0)
    if (totalLength === 0) return

    const placeRobotAtProgress = (progressRatio: number) => {
      let distance = Math.max(0, Math.min(1, progressRatio)) * totalLength
      let segmentIndex = 0
      while (segmentIndex < segmentLengths.length - 1 && distance > segmentLengths[segmentIndex]) {
        distance -= segmentLengths[segmentIndex]
        segmentIndex += 1
      }
      const start = routePoints[segmentIndex]
      const end = routePoints[segmentIndex + 1]
      const segmentLength = segmentLengths[segmentIndex]
      const progress = segmentLength ? distance / segmentLength : 0
      const point = {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
      }
      const pixel = worldToPixel(point, config, imageData.width, imageData.height)
      const transform = transformRef.current
      setRobotPosition({
        x: transform.offsetX + pixel.x * transform.scale,
        y: transform.offsetY + pixel.y * transform.scale,
        angle: Math.atan2(-(end.y - start.y), end.x - start.x) * 180 / Math.PI + 90,
      })
    }

    if (!animateRoute) {
      let frameId = requestAnimationFrame(() => placeRobotAtProgress(routeProgressRatio ?? 0))
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(frameId)
        frameId = requestAnimationFrame(() => placeRobotAtProgress(routeProgressRatio ?? 0))
      })
      observer.observe(container)
      return () => {
        observer.disconnect()
        cancelAnimationFrame(frameId)
      }
    }

    let frameId = 0
    let lastUpdate = 0
    const startedAt = performance.now()
    const durationMs = 18_000

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdate >= 40) {
        lastUpdate = timestamp
        placeRobotAtProgress(((timestamp - startedAt) % durationMs) / durationMs)
      }

      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frameId)
      setRobotPosition(null)
    }
  }, [animateRoute, loading, routePoints, routeProgressRatio])

  const screenToWorld = (
    screenX: number,
    screenY: number,
  ): Point | null => {
    const imageData = imageDataRef.current
    const config = configRef.current

    if (!imageData || !config) {
      return null
    }

    const { scale, offsetX, offsetY } = transformRef.current

    const pixelX = (screenX - offsetX) / scale
    const pixelY = (screenY - offsetY) / scale

    if (
      pixelX < 0 ||
      pixelY < 0 ||
      pixelX > imageData.width ||
      pixelY > imageData.height
    ) {
      return null
    }

    return pixelToWorld(
      {
        x: pixelX,
        y: pixelY,
      },
      config,
      imageData.width,
      imageData.height,
    )
  }

  const getEndpointAt = (screenX: number, screenY: number) => {
    const imageData = imageDataRef.current
    const config = configRef.current

    if (!imageData || !config) {
      return undefined
    }

    const { scale, offsetX, offsetY } = transformRef.current

    return endpoints.find((endpoint) => {
      const pixel = worldToPixel(
        {
          x: endpoint.position_x,
          y: endpoint.position_y,
        },
        config,
        imageData.width,
        imageData.height,
      )

      const endpointX = offsetX + pixel.x * scale
      const endpointY = offsetY + pixel.y * scale
      const distance = Math.hypot(
        screenX - endpointX,
        screenY - endpointY,
      )

      return distance <= 16
    })
  }

  const zoomAt = (
    factor: number,
    requestedX?: number,
    requestedY?: number,
  ) => {
    const container = containerRef.current
    const imageData = imageDataRef.current

    if (!container || !imageData) {
      return
    }

    const centerX = container.clientWidth / 2
    const centerY = container.clientHeight / 2
    const screenX = requestedX ?? centerX
    const screenY = requestedY ?? centerY
    const currentZoom = viewRef.current.zoom
    const nextZoom = Math.min(8, Math.max(1, currentZoom * factor))

    if (nextZoom === currentZoom) {
      return
    }

    const ratio = nextZoom / currentZoom
    const currentTransform = transformRef.current
    const nextScale = currentTransform.scale * ratio
    const nextOffsetX =
      screenX - (screenX - currentTransform.offsetX) * ratio
    const nextOffsetY =
      screenY - (screenY - currentTransform.offsetY) * ratio

    viewRef.current = {
      zoom: nextZoom,
      panX:
        nextZoom === 1
          ? 0
          : nextOffsetX -
            (container.clientWidth - imageData.width * nextScale) / 2,
      panY:
        nextZoom === 1
          ? 0
          : nextOffsetY -
            (container.clientHeight - imageData.height * nextScale) / 2,
    }

    drawRef.current?.()
  }

  const resetView = () => {
    viewRef.current = { zoom: 1, panX: 0, panY: 0 }
    drawRef.current?.()
  }

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    zoomAt(
      event.deltaY < 0 ? 1.15 : 1 / 1.15,
      event.clientX - rect.left,
      event.clientY - rect.top,
    )
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (zoneDrawMode) {
      const rect = event.currentTarget.getBoundingClientRect()

      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const world = screenToWorld(x, y)

      if (!world) {
        return
      }

      dragStartRef.current = world
      draggingRef.current = true

      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (viewRef.current.zoom <= 1) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    panStartRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      panX: viewRef.current.panX,
      panY: viewRef.current.panY,
    }
    draggingRef.current = false
    event.currentTarget.style.cursor = 'grabbing'

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (zoneDrawMode && draggingRef.current) {
      const rect = event.currentTarget.getBoundingClientRect()

      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const world = screenToWorld(x, y)

      if (!world || !dragStartRef.current) {
        return
      }

      setPreviewRect({
        start: dragStartRef.current,
        end: world,
      })
      return
    }

    if (!panStartRef.current) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const deltaX = x - panStartRef.current.x
    const deltaY = y - panStartRef.current.y

    if (Math.hypot(deltaX, deltaY) > 3) {
      draggingRef.current = true
      viewRef.current.panX = panStartRef.current.panX + deltaX
      viewRef.current.panY = panStartRef.current.panY + deltaY
      drawRef.current?.()
    }
  }

  const handlePointerUp = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (!zoneDrawMode) {
      panStartRef.current = null
      if (draggingRef.current) {
        suppressClickRef.current = true
        draggingRef.current = false
      }
      event.currentTarget.style.cursor =
        viewRef.current.zoom > 1 ? 'grab' : 'pointer'
      return
    }

    if (!draggingRef.current) {
      return
    }

    draggingRef.current = false

    const rect = event.currentTarget.getBoundingClientRect()

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const world = screenToWorld(x, y)

    if (!world || !dragStartRef.current) {
      dragStartRef.current = null
      setPreviewRect(null)
      return
    }

    const start = dragStartRef.current

    const min_x = Math.min(start.x, world.x)
    const max_x = Math.max(start.x, world.x)
    const min_y = Math.min(start.y, world.y)
    const max_y = Math.max(start.y, world.y)

    if (
      Math.abs(max_x - min_x) > 0.2 &&
      Math.abs(max_y - min_y) > 0.2
    ) {
      onZoneDrawComplete({
        min_x,
        min_y,
        max_x,
        max_y,
      })
    }

    dragStartRef.current = null
    setPreviewRect(null)
  }

  const handleCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    if (zoneDrawMode) {
      return
    }

    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()

    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top

    const world = screenToWorld(screenX, screenY)

    if (!world) {
      return
    }

    setClickedPosition(world)

    const config = configRef.current
    const imageData = imageDataRef.current

    if (!config || !imageData) {
      return
    }

    if (showEndpoints) {
      const hitEndpoint = getEndpointAt(screenX, screenY)

      if (hitEndpoint) {
        onEndpointSelect(hitEndpoint.id)
        return
      }
    }

    if (showZones) {
      const hitZone = zones.find(
        (zone) =>
          world.x >= zone.min_x &&
          world.x <= zone.max_x &&
          world.y >= zone.min_y &&
          world.y <= zone.max_y,
      )

      if (hitZone) {
        onZoneSelect(hitZone.id)
        return
      }
    }

    if (showZones) {
      onMapClick({
        x: world.x,
        y: world.y,
        screenX,
        screenY,
      })
    }
  }

  const handleCanvasDoubleClick = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    if (!showEndpoints || zoneDrawMode || suppressClickRef.current) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const world = screenToWorld(screenX, screenY)

    if (!world || getEndpointAt(screenX, screenY)) {
      return
    }

    onMapClick({
      x: world.x,
      y: world.y,
      screenX,
      screenY,
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0d10] text-sm text-white/60">
        Loading library map...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0d10] p-6 text-center">
        <div>
          <p className="text-sm font-medium text-red-400">
            Unable to load map
          </p>
          <p className="mt-1 text-xs text-white/50">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#0c0d10]"
    >
      <canvas
        ref={canvasRef}
        className={`block h-full w-full ${
          zoneDrawMode ? 'cursor-crosshair' : 'cursor-pointer'
        }`}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {robotPosition && (
        <div
          aria-label={animateRoute ? 'Robot moving along completed route' : 'Robot current position'}
          className="pointer-events-none absolute z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#ea580c] text-white shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
          style={{
            left: robotPosition.x,
            top: robotPosition.y,
            transform: `translate(-50%, -50%) rotate(${robotPosition.angle}deg)`,
          }}
        >
          <Bot className="h-5 w-5" strokeWidth={2.5} />
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-white/10 bg-black/60 px-3 py-2 text-xs text-white/60 backdrop-blur">
        {routeLabel
          ? `${animateRoute ? 'Completed route' : routeProgressRatio !== undefined ? 'Live route' : 'Planned route'} · ${routeLabel}`
          : zoneDrawMode
          ? 'Drag on the map to draw a zone'
          : showEndpoints
            ? 'Double-click an empty location to create an endpoint'
            : 'Map view'}
      </div>

      {routePoints.length < 2 && (
        <div className="pointer-events-none absolute bottom-4 left-4 w-[204px] rounded-md border border-white/15 bg-[#17181d]/90 px-3 py-2 font-mono text-xs leading-5 text-white/70 shadow-xl backdrop-blur">
          <p>X: {clickedPosition ? `${clickedPosition.x.toFixed(3)} m` : '--'}</p>
          <p>Y: {clickedPosition ? `${clickedPosition.y.toFixed(3)} m` : '--'}</p>
        </div>
      )}

      <div className={`absolute right-4 flex items-center gap-1 rounded-md border border-white/10 bg-black/60 p-1 backdrop-blur ${routePoints.length > 1 ? 'top-4' : 'bottom-4'}`}>
        <button
          type="button"
          onClick={() => zoomAt(1.25)}
          title="Zoom in"
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded text-white/75 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomAt(0.8)}
          title="Zoom out"
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded text-white/75 hover:bg-white/10 hover:text-white"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          title="Reset map view"
          aria-label="Reset map view"
          className="flex h-8 w-8 items-center justify-center rounded text-white/75 hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default MapViewer