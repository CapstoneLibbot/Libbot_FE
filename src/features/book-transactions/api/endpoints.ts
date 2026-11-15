export const BOOK_TRANSACTION_ENDPOINTS = {
  RECEIPTS: '/book-receipts',
  RECEIPT_BY_ID: (id: string) => `/book-receipts/${id}`,
  RECEIPT_STATUS: (id: string) => `/book-receipts/${id}/status`,
  RECEIPT_COMPLETE: (id: string) => `/book-receipts/${id}/complete`,

  ISSUES: '/book-issues',
  ISSUE_BY_ID: (id: string) => `/book-issues/${id}`,
  ISSUE_STATUS: (id: string) => `/book-issues/${id}/status`,
  ISSUE_COMPLETE: (id: string) => `/book-issues/${id}/complete`,
}

// Backward-compatibility alias
export const CIRCULATION_ENDPOINTS = BOOK_TRANSACTION_ENDPOINTS
