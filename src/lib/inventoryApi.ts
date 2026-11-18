export type InventoryRuntime = 'real' | 'sim'

export interface InventoryScanRequest {
  missionId: string
  runtimeId: InventoryRuntime
  qrCode: string
  shelfCode?: string
  levelNumber?: 1 | 2
}

export interface InventoryScanResult {
  barcode: string
  qrCode?: string
  shelfCode: string | null
  shelfLevelId: string | null
  levelNumber?: number | null
  known: boolean
  misplaced: boolean
  expectedShelfCode: string | null
  runtimeId: InventoryRuntime
  scannedAt: string
  status?: string
}

export interface InventoryReportRequest {
  missionId: string
  runtimeId: InventoryRuntime
  scopeType: 'SHELF' | 'AREA'
  reportType: 'INVENTORY' | 'MISPLACED_BOOK_DETECTION'
}

export interface InventoryReportResult {
  reportId: string
  reportType: string
  runtimeId: InventoryRuntime
  missionId?: string
  totalShelves?: number
  totalBooksScanned: number
  totalAvailable?: number
  totalMisplaced: number
  totalMissing: number
  totalUnknown?: number
  details?: InventoryReportDetails
  createdAtUtc?: string
}

export interface InventoryReportDetails {
  shelves?: {
    shelf_id: string
    shelf_code: string
    levels: { shelf_level_id: string; level_number: number; scanned_qr_codes: string[] }[]
  }[]
  misplaced_qr_codes?: string[]
  missing_qr_codes?: string[]
  unknown_qr_codes?: string[]
  ambiguous_qr_codes?: string[]
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const payload = await response.json() as { message?: string; title?: string; detail?: string }
      message = payload.message ?? payload.detail ?? payload.title ?? message
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export const inventoryApi = {
  recordScan: (request: InventoryScanRequest) =>
    post<InventoryScanResult>('/api/workflow-data/inventory/scan', request),
  getScans: async (missionId: string, runtimeId: InventoryRuntime) => {
    const response = await fetch(
      `/api/workflow-data/inventory/scans/${encodeURIComponent(missionId)}?runtimeId=${runtimeId}`,
    )
    if (!response.ok) {
      let message = `Request failed (${response.status})`
      try {
        const payload = await response.json() as { message?: string; title?: string; detail?: string }
        message = payload.message ?? payload.detail ?? payload.title ?? message
      } catch {
        // Keep the HTTP status message when the server response is not JSON.
      }
      throw new Error(message)
    }
    return response.json() as Promise<InventoryScanResult[]>
  },
  generateReport: (request: InventoryReportRequest) =>
    post<InventoryReportResult>('/api/workflow-data/inventory/reports', request),
  getReport: async (missionId: string, runtimeId: InventoryRuntime) => {
    const response = await fetch(`/api/workflow-data/inventory/reports/${encodeURIComponent(missionId)}?runtimeId=${runtimeId}`)
    if (!response.ok) {
      let message = `Request failed (${response.status})`
      try {
        const payload = await response.json() as { message?: string; title?: string; detail?: string }
        message = payload.message ?? payload.detail ?? payload.title ?? message
      } catch {
        // Keep the HTTP status message when the server response is not JSON.
      }
      throw new Error(message)
    }
    return response.json() as Promise<InventoryReportResult>
  },
}
