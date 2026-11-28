export interface ShelfRecord {
  id: string
  aisleId: string
  endpointId: string | null
  code: string
  name: string
  createdAtUtc: string
  updatedAtUtc: string | null
}

export interface InventoryShelfRecord {
  id: string
  aisleId: string
  startEndpointId: string
  endEndpointId: string
  name: string
  status: string
}

export interface InventoryAisleRecord {
  id: string
  floorId: string
  name: string
  status: string
}

export interface InventoryShelfLevelRecord {
  id: string
  shelfId: string
  levelNumber: number
  status: string
}

export interface AisleRecord {
  id: string
  floorId: string
  endpointId: string | null
  code: string
  name: string
  description: string | null
}

export interface ShelfWriteRequest {
  aisleId: string
  endpointId: string | null
  code: string
  name: string
}

export interface EndpointRecord {
  id: string
  mapId: string
  name: string
  endpointType: 'WAYPOINT' | 'CHARGER' | 'PARK'
  positionX: number
  positionY: number
  theta: number
  isActive: boolean
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json() as { message?: string; detail?: string; title?: string }
      message = body.message ?? body.detail ?? body.title ?? message
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const shelfApi = {
  list: () => request<ShelfRecord[]>('/api/shelves'),
  listAisles: () => request<AisleRecord[]>('/api/aisles'),
  listInventoryShelves: () => request<InventoryShelfRecord[]>('/api/shelves'),
  listInventoryShelfLevels: async () => {
    const allItems: InventoryShelfLevelRecord[] = []
    const pageSize = 100
    let page = 1
    let totalPages = 1
    do {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      const response = await request<{ data?: { items?: InventoryShelfLevelRecord[]; totalPages?: number } }>(
        `/api/shelf-levels?${query}`,
      )
      const result = response.data
      allItems.push(...(result?.items ?? []))
      totalPages = result?.totalPages ?? page
      page += 1
    } while (page <= totalPages)
    return allItems
  },
  listInventoryAisles: async (floorId?: string | null) => {
    const allItems: InventoryAisleRecord[] = []
    const pageSize = 100
    let page = 1
    let totalPages = 1
    do {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (floorId) query.set('floorId', floorId)
      const response = await request<{ data?: { items?: InventoryAisleRecord[]; totalPages?: number } }>(`/api/aisles?${query}`)
      const result = response.data
      allItems.push(...(result?.items ?? []))
      totalPages = result?.totalPages ?? page
      page += 1
    } while (page <= totalPages)
    return allItems
  },
  listEndpoints: () => request<EndpointRecord[]>('/api/endpoints'),
  create: (shelf: ShelfWriteRequest) => request<ShelfRecord>('/api/shelves', {
    method: 'POST',
    body: JSON.stringify(shelf),
  }),
  update: (id: string, shelf: ShelfWriteRequest) => request<ShelfRecord>(`/api/shelves/${id}`, {
    method: 'PUT',
    body: JSON.stringify(shelf),
  }),
  delete: (id: string) => request<void>(`/api/shelves/${id}`, { method: 'DELETE' }),
}
