import { httpClient } from '@/services/http/client'
import { AISLE_ENDPOINTS } from './endpoints'
import type { PaginatedData } from '@/types/api'
import type {
  AisleOptionRecord,
  AisleQueryParams,
  AisleRecord,
  AisleWriteRequest,
} from '../types/aisle'

export const aisleApi = {
  /** Lấy danh sách lối đi có phân trang và bộ lọc */
  getAisles: (params?: AisleQueryParams): Promise<PaginatedData<AisleRecord>> => {
    return httpClient.get(AISLE_ENDPOINTS.LIST, {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        search: params?.searchTerm || undefined,
        floorId: params?.floorId === 'ALL' ? undefined : params?.floorId,
        status: params?.status === 'ALL' ? undefined : params?.status,
        sortBy: params?.sortBy ?? 'name',
        sortOrder: params?.sortOrder ?? 'asc',
        expand: params?.expand ?? 'floor,shelves',
      },
    })
  },

  /** Lấy danh sách rút gọn các lối đi phục vụ Dropdown / Select box */
  getAllOptions: (floorId?: string, status?: string): Promise<AisleOptionRecord[]> => {
    return httpClient.get(AISLE_ENDPOINTS.ALL, {
      params: {
        floorId: floorId === 'ALL' ? undefined : floorId,
        status: status === 'ALL' ? undefined : status,
      },
    })
  },

  /** Lấy chi tiết 1 lối đi theo ID */
  getAisleById: (id: string, expand = 'floor,shelves'): Promise<AisleRecord> => {
    return httpClient.get(AISLE_ENDPOINTS.DETAIL(id), {
      params: { expand },
    })
  },

  /** Tạo lối đi mới */
  createAisle: (payload: AisleWriteRequest): Promise<AisleRecord> => {
    return httpClient.post(AISLE_ENDPOINTS.LIST, payload)
  },

  /** Cập nhật thông tin lối đi */
  updateAisle: (id: string, payload: AisleWriteRequest): Promise<AisleRecord> => {
    return httpClient.put(AISLE_ENDPOINTS.DETAIL(id), payload)
  },

  /** Xóa lối đi */
  deleteAisle: (id: string): Promise<void> => {
    return httpClient.delete(AISLE_ENDPOINTS.DETAIL(id))
  },
}
