import { httpClient } from '@/services/http/client'
import { BOOK_ITEM_ENDPOINTS } from './endpoints'
import type { PaginatedData } from '@/types/api'
import type {
  BookItemQueryParams,
  BookItemRecord,
  BookItemWriteRequest,
} from '../types/bookItem'

export const bookItemApi = {
  /** Lấy danh sách các bản sách vật lý (có phân trang và bộ lọc) */
  getBookItems: (params?: BookItemQueryParams): Promise<PaginatedData<BookItemRecord>> => {
    return httpClient.get(BOOK_ITEM_ENDPOINTS.LIST, {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 50,
        barcode: params?.barcode || undefined,
        bookId: params?.bookId === 'ALL' ? undefined : params?.bookId,
        status: params?.status === 'ALL' ? undefined : params?.status,
        shelfLevelId: params?.shelfLevelId === 'ALL' ? undefined : params?.shelfLevelId,
      },
    })
  },

  /** Lấy thông tin chi tiết một bản sách theo ID */
  getBookItemById: (id: string): Promise<BookItemRecord> => {
    return httpClient.get(BOOK_ITEM_ENDPOINTS.DETAIL(id))
  },

  /** Tạo mới một bản sách vật lý gắn với đầu sách */
  createBookItem: (payload: BookItemWriteRequest): Promise<BookItemRecord> => {
    return httpClient.post(BOOK_ITEM_ENDPOINTS.LIST, payload)
  },

  /** Cập nhật thông tin bản sách vật lý (barcode, vị trí, trạng thái) */
  updateBookItem: (id: string, payload: BookItemWriteRequest): Promise<BookItemRecord> => {
    return httpClient.put(BOOK_ITEM_ENDPOINTS.DETAIL(id), payload)
  },

  /** Xóa một bản sách khỏi hệ thống */
  deleteBookItem: (id: string): Promise<void> => {
    return httpClient.delete(BOOK_ITEM_ENDPOINTS.DETAIL(id))
  },
}
