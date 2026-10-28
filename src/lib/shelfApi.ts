export interface ShelfRecord {
  id: string
  aisleId: string
  endpointId: string | null
  code: string
  name: string
  createdAtUtc: string
  updatedAtUtc: string | null
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
