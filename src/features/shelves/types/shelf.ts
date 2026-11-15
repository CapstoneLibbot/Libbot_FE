import type { PaginationParams } from '@/types/api'
import type { ShelfStatus, ShelfLevelStatus } from '@/types/enums'

export interface ShelfAisleSummary {
  id: string
  name: string
  floorId: string
}

export interface ShelfLevelRecord {
  id: string
  shelfId: string
  name: string
  levelNumber: number
  status: ShelfLevelStatus
}

export interface ShelfRecord {
  id: string
  aisleId: string
  startEndpointId: string
  endEndpointId: string
  name: string
  description: string | null
  status: ShelfStatus
  aisle?: ShelfAisleSummary | null
  levels?: ShelfLevelRecord[] | null
}

export interface ShelfWriteRequest {
  aisleId: string
  startEndpointId: string
  endEndpointId: string
  name: string
  description?: string | null
  status?: ShelfStatus
}

export interface ShelfLevelWriteRequest {
  shelfId?: string
  levelNumber: number
  name?: string | null
  status?: ShelfLevelStatus
}

export interface ShelfOptionRecord {
  id: string
  aisleId: string
  name: string
  status: ShelfStatus
}

export interface ShelfQueryParams extends PaginationParams {
  aisleId?: string
  floorId?: string
  status?: ShelfStatus | string
  expand?: string
}

export interface EndpointOptionRecord {
  id: string
  mapId: string
  name: string
  endpointType: string
  positionX: number
  positionY: number
  theta: number
  isActive: boolean
}
