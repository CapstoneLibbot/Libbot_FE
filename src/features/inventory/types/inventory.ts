export type InventoryRuntime = 'real' | 'sim'
export type InventoryScopeType = 'SHELF'
export type InventoryReportType = 'INVENTORY' | 'MISPLACED_BOOK_DETECTION'

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

export interface InventoryIssueRequest {
  missionId: string
  runtimeId: InventoryRuntime
  barcode: string
  issueType: 'MISPLACED'
  scannedAt: string
}

export interface InventoryReportRequest {
  missionId: string
  runtimeId: InventoryRuntime
  scopeType: InventoryScopeType
  reportType: InventoryReportType
}

export interface InventoryReportResult {
  reportId: string
  reportType: string
  runtimeId: InventoryRuntime
  totalBooksScanned: number
  totalMisplaced: number
  totalMissing: number
}
