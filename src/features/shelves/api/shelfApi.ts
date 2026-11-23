import { httpClient } from '@/services/http/client'
import { SHELF_ENDPOINTS } from './endpoints'
import type { PaginatedData } from '@/types/api'
import type {
  EndpointOptionRecord,
  ShelfLevelRecord,
  ShelfLevelQueryParams,
  ShelfLevelWriteRequest,
  ShelfOptionRecord,
  ShelfQueryParams,
  ShelfRecord,
  ShelfWriteRequest,
} from '../types/shelf'

export const shelfApi = {
  /** Lấy danh sách kệ sách có phân trang và bộ lọc */
  getShelves: async (params?: ShelfQueryParams): Promise<PaginatedData<ShelfRecord>> => {
    const response = await httpClient.get<PaginatedData<ShelfRecord> | ShelfRecord[]>(
      SHELF_ENDPOINTS.LIST,
      {
        params: {
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 20,
          search: params?.searchTerm || undefined,
          aisleId: params?.aisleId === 'ALL' ? undefined : params?.aisleId,
          status: params?.status === 'ALL' ? undefined : params?.status,
          sortBy: params?.sortBy ?? 'name',
          sortOrder: params?.sortOrder ?? 'asc',
          expand: params?.expand ?? 'aisle,levels,endpoints',
        },
      },
    )

    if (Array.isArray(response)) {
      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? response.length

      return {
        items: response,
        page,
        pageSize,
        totalCount: response.length,
        totalPages: pageSize > 0 ? Math.ceil(response.length / pageSize) : 0,
        sortBy: params?.sortBy ?? 'name',
        sortOrder: params?.sortOrder ?? 'asc',
      }
    }

    if (response && Array.isArray(response.items)) {
      return response
    }

    throw new Error('Phản hồi danh sách kệ không hợp lệ.')
  },

  /** Lấy danh sách rút gọn các kệ sách phục vụ Dropdown / Select box */
  getAllOptions: (aisleId?: string): Promise<ShelfOptionRecord[]> => {
    return httpClient.get(SHELF_ENDPOINTS.ALL, {
      params: {
        aisleId: aisleId === 'ALL' ? undefined : aisleId,
      },
    })
  },

  /** Lấy chi tiết 1 kệ sách theo ID */
  getShelfById: (id: string, expand = 'aisle,levels,endpoints'): Promise<ShelfRecord> => {
    return httpClient.get(SHELF_ENDPOINTS.DETAIL(id), {
      params: { expand },
    })
  },

  /** Tạo kệ sách mới */
  createShelf: (payload: ShelfWriteRequest, expand = 'aisle,levels,endpoints'): Promise<ShelfRecord> => {
    return httpClient.post(SHELF_ENDPOINTS.LIST, payload, {
      params: { expand },
    })
  },

  /** Cập nhật thông tin kệ sách */
  updateShelf: (id: string, payload: ShelfWriteRequest, expand = 'aisle,levels,endpoints'): Promise<ShelfRecord> => {
    return httpClient.put(SHELF_ENDPOINTS.DETAIL(id), payload, {
      params: { expand },
    })
  },

  /** Xóa kệ sách */
  deleteShelf: (id: string): Promise<void> => {
    return httpClient.delete(SHELF_ENDPOINTS.DETAIL(id))
  },

  /** Lấy danh sách các tầng kệ của 1 kệ sách */
  getLevelsByShelfId: (shelfId: string, sortOrder: 'asc' | 'desc' = 'asc'): Promise<PaginatedData<ShelfLevelRecord>> => {
    return httpClient.get(SHELF_ENDPOINTS.LEVELS, {
      params: { shelfId, sortOrder },
    })
  },

  /** Lấy danh sách tầng kệ có phân trang và sắp xếp */
  getShelfLevels: (params?: ShelfLevelQueryParams): Promise<PaginatedData<ShelfLevelRecord>> => {
    return httpClient.get(SHELF_ENDPOINTS.LEVELS, {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        shelfId: params?.shelfId,
        sortBy: params?.sortBy ?? 'levelNumber',
        sortOrder: params?.sortOrder ?? 'asc',
      },
    })
  },

  /** Lấy chi tiết 1 tầng kệ theo ID */
  getLevelById: (levelId: string): Promise<ShelfLevelRecord> => {
    return httpClient.get(SHELF_ENDPOINTS.LEVEL_DETAIL(levelId))
  },

  /** Tạo tầng kệ mới cho kệ */
  createLevel: (shelfId: string, payload: ShelfLevelWriteRequest): Promise<ShelfLevelRecord> => {
    return httpClient.post(SHELF_ENDPOINTS.LEVELS, {
      ...payload,
      shelfId,
    })
  },

  /** Cập nhật tầng kệ */
  updateLevel: (levelId: string, payload: ShelfLevelWriteRequest): Promise<ShelfLevelRecord> => {
    return httpClient.put(SHELF_ENDPOINTS.LEVEL_DETAIL(levelId), payload)
  },

  /** Xóa tầng kệ */
  deleteLevel: (levelId: string): Promise<void> => {
    return httpClient.delete(SHELF_ENDPOINTS.LEVEL_DETAIL(levelId))
  },

  /** Lấy danh sách endpoints điều hướng cho thư viện */
  getEndpoints: (): Promise<EndpointOptionRecord[]> => {
    return httpClient.get(SHELF_ENDPOINTS.ENDPOINTS_LIST)
  },
}
