import type { PaginationParams } from '@/types/api'

export interface BookCategoryRecord {
  id: string
  name: string
  description?: string | null
}

export interface BookItemRecord {
  id: string
  barcode: string
  expectedShelfLevelId: string | null
  currentShelfLevelId: string | null
  lastInventoryAtUtc: string | null
  status: string
}

export interface BookRecord {
  id: string
  categoryId: string | null
  isbn: string
  title: string
  author: string
  publisher?: string | null
  publicationYear?: number | null
  image?: string | null
  description?: string | null
  totalCopies?: number
  availableCopies?: number
  category?: BookCategoryRecord | null
  items?: BookItemRecord[] | null
}

export interface BookWriteRequest {
  categoryId?: string | null
  isbn: string
  title: string
  author: string
  publisher?: string | null
  publicationYear?: number | null
  image?: string | null
  description?: string | null
}

export interface BookCategoryWriteRequest {
  name: string
  description?: string | null
}

export interface BookQueryParams extends PaginationParams {
  categoryId?: string
}
