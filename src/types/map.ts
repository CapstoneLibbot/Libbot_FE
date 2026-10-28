export type MapArea = {
  id: number
  endpoint_id: number
  code: string
  name: string
  description: string | null
}

export type Floor = {
  id: number
  code: string
  name: string
  description: string | null
  status: string
}

export type MapAisle = {
  id: number
  endpointA_id: number
  endpointB_id: number
  floor_id: number
  code: string
  name: string
  description: string | null
  status: string
}

export type ShelfStatus = 1 | 2 | 3

export type MapShelf = {
  id: number
  endpoint_id: number
  aisle_id: number
  name: string
  code: string
  description: string | null
  status: ShelfStatus
}

export type ShelfLevel = {
  id: number
  shelf_id: number
  name: string
  level_number: number
  status: ShelfStatus
}

export type BookItem = {
  id: number
  expected_shelf_level_id: number
  current_shelf_level_id: number | null
  book_id: number
  barcode: string
  last_inventory_at: string | null
  status: string
}

export type BookCategory = {
  id: number
  name: string
  description: string | null
}

export type Book = {
  id: number
  category_id: number | null
  isbn: string | null
  title: string
  author: string | null
  image_url?: string | null
  description?: string | null
  publisher?: string | null
  publication_year?: number | null
}

export type EndpointLinkedObject = {
  kind: 'AREA' | 'AISLE' | 'SHELF'
  id: number
  name: string
} | null

export type EndpointGroup = {
  id: number
  name: string
  description: string | null
}

export type EndpointGroupMember = {
  id: number
  endpoint_group_id: number
  endpoint_id: number
}
