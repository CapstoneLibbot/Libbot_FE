import type { PaginationParams } from '@/types/api'
import type { AisleStatus } from '@/types/enums'

export interface AisleFloorSummary {
  id: string
  name: string
  floorNumber: number
}

export interface AisleShelfSummary {
  id: string
  name: string
}

export interface AisleRecord {
  id: string
  floorId: string
  name: string
  description: string | null
  status: AisleStatus
  floor?: AisleFloorSummary | null
  shelves?: AisleShelfSummary[] | null
}

export interface AisleWriteRequest {
  floorId: string
  name: string
  description?: string | null
  status?: AisleStatus
}

export interface AisleOptionRecord {
  id: string
  floorId: string
  name: string
  status: AisleStatus
}

export interface AisleQueryParams extends PaginationParams {
  floorId?: string
  status?: AisleStatus | string
  expand?: string
}
