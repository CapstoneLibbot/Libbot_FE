import { httpClient } from '@/services/http/client'
import { FLOOR_ENDPOINTS } from './endpoints'
import type { PaginatedData } from '@/types/api'
import type {
  FloorOptionRecord,
  FloorQueryParams,
  FloorRecord,
  FloorWriteRequest,
} from '../types/floor'

export const floorApi = {
  /** Lấy danh sách tầng có phân trang và bộ lọc */
  getFloors: (params?: FloorQueryParams): Promise<PaginatedData<FloorRecord>> => {
    return httpClient.get(FLOOR_ENDPOINTS.LIST, {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        search: params?.searchTerm || undefined,
        status: params?.status === 'ALL' ? undefined : params?.status,
        sortBy: params?.sortBy ?? 'floorNumber',
        sortOrder: params?.sortOrder ?? 'asc',
        expand: params?.expand,
      },
    })
  },

  /** Lấy danh sách rút gọn các tầng phục vụ Dropdown / Select box */
  getAllOptions: (status?: string): Promise<FloorOptionRecord[]> => {
    return httpClient.get(FLOOR_ENDPOINTS.ALL, {
      params: { status: status === 'ALL' ? undefined : status },
    })
  },

  /** Lấy chi tiết 1 tầng theo ID */
  getFloorById: (id: string, expand = 'aisles'): Promise<FloorRecord> => {
    return httpClient.get(FLOOR_ENDPOINTS.DETAIL(id), {
      params: { expand },
    })
  },

  /** Tạo tầng mới */
  createFloor: (payload: FloorWriteRequest): Promise<FloorRecord> => {
    return httpClient.post(FLOOR_ENDPOINTS.LIST, payload)
  },

  /** Cập nhật thông tin tầng */
  updateFloor: (id: string, payload: FloorWriteRequest): Promise<FloorRecord> => {
    return httpClient.put(FLOOR_ENDPOINTS.DETAIL(id), payload)
  },

  /** Xóa tầng */
  deleteFloor: (id: string): Promise<void> => {
    return httpClient.delete(FLOOR_ENDPOINTS.DETAIL(id))
  },
}
