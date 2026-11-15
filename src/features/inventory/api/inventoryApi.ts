import { httpClient } from '@/services/http/client'
import { INVENTORY_ENDPOINTS } from './endpoints'
import type {
  InventoryIssueRequest,
  InventoryReportRequest,
  InventoryReportResult,
  InventoryScanRequest,
  InventoryScanResult,
} from '../types/inventory'

export const inventoryApi = {
  /** Ghi nhận một mã vạch quét được trong nhiệm vụ kiểm kê */
  recordScan: (request: InventoryScanRequest): Promise<InventoryScanResult> => {
    return httpClient.post(INVENTORY_ENDPOINTS.SCAN, request)
  },

  /** Đánh dấu một sự cố sách sai vị trí sau lượt quét */
  recordIssue: (request: InventoryIssueRequest): Promise<unknown> => {
    return httpClient.post(INVENTORY_ENDPOINTS.ISSUES, request)
  },

  /** Tổng hợp báo cáo kiểm kê khi hoàn thành nhiệm vụ */
  generateReport: (request: InventoryReportRequest): Promise<InventoryReportResult> => {
    return httpClient.post(INVENTORY_ENDPOINTS.REPORTS, request)
  },
}
