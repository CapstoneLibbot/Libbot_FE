import type { PaginationParams } from '@/types/api'
import type { BookItemStatus } from '@/types/enums'

export interface ShelfLevelSummary {
  id: string
  shelfId: string
  shelfName?: string
  name: string
  levelNumber: number
}

export interface BookSummary {
  id: string
  title: string
  isbn: string
}

export interface BookItemRecord {
  id: string
  bookId: string
  barcode: string
  status: BookItemStatus | string
  lastInventoryAtUtc: string | null
  expectedShelfLevelId: string | null
  currentShelfLevelId: string | null
  book?: BookSummary | null
  expectedShelfLevel?: ShelfLevelSummary | null
  currentShelfLevel?: ShelfLevelSummary | null
}

export interface BookItemWriteRequest {
  bookId: string
  barcode: string
  expectedShelfLevelId?: string | null
  currentShelfLevelId?: string | null
  lastInventoryAtUtc?: string | null
  status?: BookItemStatus | string
}

export interface BookItemQueryParams extends PaginationParams {
  barcode?: string
  bookId?: string
  status?: BookItemStatus | string
  shelfLevelId?: string
}
