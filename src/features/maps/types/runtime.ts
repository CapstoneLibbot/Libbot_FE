export type Pose2D = {
  x: number
  y: number
  yaw: number
}

export type PathPoint2D = {
  x: number
  y: number
}

export type MapObstacle = {
  pixelX: number
  pixelY: number
  pixelWidth: number
  pixelHeight: number
  worldX: number
  worldY: number
  worldWidth: number
  worldHeight: number
}

export type OccupancyMapMetadata = {
  imageWidth: number
  imageHeight: number
  resolution: number
  origin: [number, number, number]
  widthMeters: number
  heightMeters: number
  obstacles: MapObstacle[]
  occupancyImage?: string
  verticalRotation?: number
}

export type RobotTelemetry = {
  timestamp: string
  pose: Pose2D
  twist?: {
    linearX: number
    linearY: number
    angularZ: number
  }
  battery?: number | null
  localizationState: string
  navigationState: string
  activeGoalId?: string | null
  plannedPath?: PathPoint2D[] | null
  error?: string | null
  mappingActive?: boolean
  navigationActive?: boolean
  navigationReady?: boolean
  navigationModeState?:
    | 'STOPPED'
    | 'FETCHING_MAP'
    | 'WAITING_INITIAL_POSE'
    | 'LOCALIZING'
    | 'ACTIVATING'
    | 'READY'
    | 'FAILED'
    | 'ERROR'
  activeMapId?: string | null
}

export type RobotRuntime = {
  id: string
  displayName: string
  kind: 'SIM' | 'REAL'
  connected: boolean
  stale: boolean
  armed: boolean
  mappingActive: boolean
  navigationActive: boolean
  armExpiresAt?: string | null
  lastTelemetryAt?: string | null
  telemetry?: RobotTelemetry | null
}

export type LiveOccupancyGrid = {
  timestamp: string
  width: number
  height: number
  resolution: number
  originX: number
  originY: number
  originYaw: number
  data: number[]
}

export type SavedMap = {
  id: string
  name: string
  width: number
  height: number
  version: string
  data?: {
    format?: string
  } | null
}
