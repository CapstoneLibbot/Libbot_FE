import type { PaginationParams } from '@/types/api'
import type { FloorStatus } from '@/types/enums'

export interface FloorAisleSummary {
  id: string
  name: string
}

export interface FloorMapSummary {
  id: string
  name: string
  version: string
  status: string
}

export interface FloorRecord {
  id: string
  name: string
  floorNumber: number
  description: string | null
  status: FloorStatus
  aisles?: FloorAisleSummary[] | null
  maps?: FloorMapSummary[] | null
}

export interface FloorWriteRequest {
  name: string
  floorNumber: number
  description?: string | null
  status?: FloorStatus
}

export interface FloorOptionRecord {
  id: string
  name: string
  floorNumber: number
  status: FloorStatus
}

export interface FloorQueryParams extends PaginationParams {
  status?: FloorStatus | string
  expand?: string
}
