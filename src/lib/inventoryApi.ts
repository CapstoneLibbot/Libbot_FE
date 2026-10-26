export type InventoryRuntime = 'real' | 'sim'

export interface InventoryScanRequest {
  missionId: string
  runtimeId: InventoryRuntime
  barcode: string
  shelfCode?: string
}

export interface InventoryScanResult {
  barcode: string
  shelfCode: string | null
  shelfLevelId: string | null
  known: boolean
  misplaced: boolean
  expectedShelfCode: string | null
  runtimeId: InventoryRuntime
  scannedAt: string
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
  totalBooksScanned: number
  totalMisplaced: number
  totalMissing: number
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
  generateReport: (request: InventoryReportRequest) =>
    post<InventoryReportResult>('/api/workflow-data/inventory/reports', request),
}
