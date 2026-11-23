import { httpClient } from '@/services/http/client'
import { BOOK_TRANSACTION_ENDPOINTS } from './endpoints'
import { mockBookTransactionService } from '../data/mockBookTransactionData'
import type {
  BarcodeLookupResult,
  BookIssueQuery,
  BookIssueRecord,
  BookIssueStatus,
  BookReceiptQuery,
  BookReceiptRecord,
  BookReceiptStatus,
  CreateBookIssueRequest,
  CreateBookReceiptRequest,
  UpdateBookIssueDraftRequest,
  UpdateBookReceiptDraftRequest,
} from '../types/bookTransactions'

function normalizeReceipt(raw: any): BookReceiptRecord {
  if (!raw) return raw
  return {
    id: raw.id,
    code: raw.code || (raw.id ? `RCP-${String(raw.id).slice(0, 8).toUpperCase()}` : undefined),
    receiptType: raw.receiptType || raw.type || 'NEW_ACQUISITION',
    receivedDate: raw.receivedDate || (raw.date ? String(raw.date) : new Date().toISOString().split('T')[0]),
    status: raw.status || 'DRAFT',
    total: raw.total ?? (raw.details?.length || 0),
    note: raw.note,
    details: (raw.details || []).map((d: any) => ({
      id: d.id,
      receiptId: d.receiptId || raw.id,
      bookItemId: d.bookItemId,
      bookId: d.bookId,
      barcode: d.barcode,
      title: d.title || 'N/A',
      isbn: d.isbn || 'N/A',
      expectedShelfLevelId: d.expectedShelfLevelId,
      expectedShelfName: d.expectedShelfName || d.shelfLevelName || 'N/A',
      note: d.note,
    })),
  }
}

function normalizeIssue(raw: any): BookIssueRecord {
  if (!raw) return raw
  return {
    id: raw.id,
    code: raw.code || (raw.id ? `ISS-${String(raw.id).slice(0, 8).toUpperCase()}` : undefined),
    issueType: raw.issueType || raw.type || 'BORROW_LOAN',
    issueDate: raw.issueDate || (raw.date ? String(raw.date) : new Date().toISOString().split('T')[0]),
    status: raw.status || 'DRAFT',
    total: raw.total ?? (raw.details?.length || 0),
    note: raw.note,
    details: (raw.details || []).map((d: any) => ({
      id: d.id,
      issueId: d.issueId || raw.id,
      bookItemId: d.bookItemId,
      bookId: d.bookId,
      barcode: d.barcode,
      title: d.title || 'N/A',
      isbn: d.isbn || 'N/A',
      currentShelfLevelId: d.currentShelfLevelId,
      currentShelfName: d.currentShelfName || d.shelfLevelName || 'N/A',
      note: d.note,
    })),
  }
}

function getApiErrorMessage(err: any): string {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.Message ||
    err?.response?.data?.error ||
    err?.message ||
    'An unexpected error occurred.'
  )
}

export const bookTransactionApi = {
  // --- Book Receipts ---
  getReceipts: async (query?: BookReceiptQuery): Promise<BookReceiptRecord[]> => {
    try {
      const res = await httpClient.get<any>(BOOK_TRANSACTION_ENDPOINTS.RECEIPTS, {
        params: query,
      })
      const items = Array.isArray(res) ? res : (res && Array.isArray(res.items) ? res.items : null)
      if (items !== null) return items.map(normalizeReceipt)
      return []
    } catch (err: any) {
      if (err?.response) {
        throw new Error(getApiErrorMessage(err))
      }
      return []
    }
  },

  getReceiptById: async (id: string): Promise<BookReceiptRecord | null> => {
    try {
      const res = await httpClient.get<any>(
        BOOK_TRANSACTION_ENDPOINTS.RECEIPT_BY_ID(id)
      )
      if (res && res.id) return normalizeReceipt(res)
      return null
    } catch (err: any) {
      if (err?.response) {
        if (err.response.status === 404) return null
        throw new Error(getApiErrorMessage(err))
      }
      return null
    }
  },

  createReceipt: async (payload: CreateBookReceiptRequest): Promise<BookReceiptRecord> => {
    const res = await httpClient.post<any>(
      BOOK_TRANSACTION_ENDPOINTS.RECEIPTS,
      payload
    )
    return normalizeReceipt(res)
  },

  updateReceiptStatus: async (
    id: string,
    status: BookReceiptStatus
  ): Promise<BookReceiptRecord> => {
    const res = await httpClient.put<any>(
      BOOK_TRANSACTION_ENDPOINTS.RECEIPT_STATUS(id),
      { status }
    )
    return normalizeReceipt(res)
  },

  updateReceiptDraft: async (
    id: string,
    payload: UpdateBookReceiptDraftRequest
  ): Promise<BookReceiptRecord> => {
    const res = await httpClient.put<any>(
      BOOK_TRANSACTION_ENDPOINTS.RECEIPT_BY_ID(id),
      payload
    )
    return normalizeReceipt(res)
  },

  // --- Book Issues ---
  getIssues: async (query?: BookIssueQuery): Promise<BookIssueRecord[]> => {
    try {
      const res = await httpClient.get<any>(BOOK_TRANSACTION_ENDPOINTS.ISSUES, {
        params: query,
      })
      const items = Array.isArray(res) ? res : (res && Array.isArray(res.items) ? res.items : null)
      if (items !== null) return items.map(normalizeIssue)
      return []
    } catch (err: any) {
      if (err?.response) {
        throw new Error(getApiErrorMessage(err))
      }
      return []
    }
  },

  getIssueById: async (id: string): Promise<BookIssueRecord | null> => {
    try {
      const res = await httpClient.get<any>(
        BOOK_TRANSACTION_ENDPOINTS.ISSUE_BY_ID(id)
      )
      if (res && res.id) return normalizeIssue(res)
      return null
    } catch (err: any) {
      if (err?.response) {
        if (err.response.status === 404) return null
        throw new Error(getApiErrorMessage(err))
      }
      return null
    }
  },

  createIssue: async (payload: CreateBookIssueRequest): Promise<BookIssueRecord> => {
    const res = await httpClient.post<any>(
      BOOK_TRANSACTION_ENDPOINTS.ISSUES,
      payload
    )
    return normalizeIssue(res)
  },

  updateIssueStatus: async (
    id: string,
    status: BookIssueStatus
  ): Promise<BookIssueRecord> => {
    const res = await httpClient.put<any>(
      BOOK_TRANSACTION_ENDPOINTS.ISSUE_STATUS(id),
      { status }
    )
    return normalizeIssue(res)
  },

  updateIssueDraft: async (
    id: string,
    payload: UpdateBookIssueDraftRequest
  ): Promise<BookIssueRecord> => {
    const res = await httpClient.put<any>(
      BOOK_TRANSACTION_ENDPOINTS.ISSUE_BY_ID(id),
      payload
    )
    return normalizeIssue(res)
  },

  lookupBarcode: (barcode: string): BarcodeLookupResult | null => {
    return mockBookTransactionService.lookupBarcode(barcode)
  },

  lookupBarcodeAsync: async (barcode: string): Promise<BarcodeLookupResult | null> => {
    const trimmed = barcode.trim()
    if (!trimmed) return null

    try {
      const res = await httpClient.get<any>('/books/items', {
        params: { barcode: trimmed },
      })
      const items = Array.isArray(res) ? res : res?.items || []
      const match = items.find(
        (it: any) => it.barcode?.toUpperCase() === trimmed.toUpperCase()
      )
      if (match) {
        let title = match.title || 'Catalog Item'
        let isbn = match.isbn || 'N/A'

        if (match.bookId && (!match.title || match.title === 'Catalog Item')) {
          try {
            const bookRes = await httpClient.get<any>(`/books/${match.bookId}`)
            if (bookRes?.title) {
              title = bookRes.title
              isbn = bookRes.isbn || isbn
            }
          } catch {
            // ignore if book fetch fails
          }
        }

        return {
          bookItemId: match.id,
          bookId: match.bookId,
          barcode: match.barcode,
          title,
          isbn,
          status: match.status || 'AVAILABLE',
          currentShelfLevelId: match.currentShelfLevelId,
          currentShelfName: match.currentShelfName || 'Main Shelf',
          expectedShelfLevelId: match.expectedShelfLevelId,
          expectedShelfName: match.expectedShelfName || 'Main Shelf',
        }
      }
      return mockBookTransactionService.lookupBarcode(trimmed)
    } catch (err: any) {
      if (err?.response) {
        return null
      }
      return mockBookTransactionService.lookupBarcode(trimmed)
    }
  },
}

// Backward-compatibility alias
export const circulationApi = bookTransactionApi
