// ============================================================================
// Database & Domain Enums
// Strictly aligned with dbo.[BOOK_RECEIPT], dbo.[BOOK_ISSUE], and LiBot.Domain.Enums
// ============================================================================

export type BookReceiptType = 'NEW_ACQUISITION' | 'BORROW_RETURN'
export type BookReceiptStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'

export type BookIssueType = 'BORROW_LOAN' | 'DISPOSAL'
export type BookIssueStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'

// ============================================================================
// Barcode Lookup Result
// Unified model for scanning physical items in receipt/issue forms
// ============================================================================
export interface BarcodeLookupResult {
  bookItemId: string
  bookId: string
  barcode: string
  title: string
  isbn: string
  status: string
  currentShelfLevelId?: string | null
  currentShelfName?: string | null
  expectedShelfLevelId?: string | null
  expectedShelfName?: string | null
}

// ============================================================================
// Book Receipts (Phiếu nhập sách)
// ============================================================================

// Corresponds to dbo.[BOOK_RECEIPT_DETAIL] joined with BOOK_ITEM and BOOK
export interface BookReceiptDetailRecord {
  id: string
  receiptId: string
  bookItemId: string
  bookId: string
  barcode: string
  title: string
  isbn: string
  expectedShelfLevelId?: string | null
  expectedShelfName?: string | null
  note?: string | null
}

// Corresponds to dbo.[BOOK_RECEIPT]
export interface BookReceiptRecord {
  id: string
  code?: string
  receiptType: BookReceiptType
  receivedDate: string
  status: BookReceiptStatus
  total: number
  note?: string | null
  details: BookReceiptDetailRecord[]
}

// Payload for creating receipt details (POST /api/book-receipts)
export interface CreateBookReceiptItemDto {
  bookItemId?: string | null
  bookId: string
  barcode: string
  title?: string
  isbn?: string
  expectedShelfLevelId?: string | null
  note?: string | null
}

// Payload for creating a book receipt (POST /api/book-receipts)
export interface CreateBookReceiptRequest {
  receiptType: BookReceiptType
  receivedDate: string
  status?: BookReceiptStatus
  note?: string | null
  items: CreateBookReceiptItemDto[]
}

// Payload for updating a draft receipt (PUT /api/book-receipts/{id})
export interface UpdateBookReceiptDraftRequest {
  receiptType?: BookReceiptType
  receivedDate?: string
  status?: BookReceiptStatus
  note?: string | null
  items: CreateBookReceiptItemDto[]
}

// Status update payload (PUT /api/book-receipts/{id}/status)
export interface UpdateReceiptStatusRequest {
  status: BookReceiptStatus
}

// Search & filter query for receipts (GET /api/book-receipts)
export interface BookReceiptQuery {
  page?: number
  pageSize?: number
  receiptType?: BookReceiptType | 'ALL'
  status?: BookReceiptStatus | 'ALL'
  search?: string
  fromDate?: string
  toDate?: string
}

// Paginated receipts list response
export interface BookReceiptListResponse {
  items: BookReceiptRecord[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ============================================================================
// Book Issues (Phiếu xuất sách)
// ============================================================================

// Corresponds to dbo.[BOOK_ISSUE_DETAIL] joined with BOOK_ITEM and BOOK
export interface BookIssueDetailRecord {
  id: string
  issueId: string
  bookItemId: string
  bookId: string
  barcode: string
  title: string
  isbn: string
  currentShelfName?: string | null
  note?: string | null
}

// Corresponds to dbo.[BOOK_ISSUE]
export interface BookIssueRecord {
  id: string
  code?: string
  issueType: BookIssueType
  issueDate: string
  status: BookIssueStatus
  total: number
  note?: string | null
  details: BookIssueDetailRecord[]
}

// Payload for creating issue details (POST /api/book-issues)
export interface CreateBookIssueItemDto {
  bookItemId: string
  bookId: string
  barcode: string
  title?: string
  isbn?: string
  currentShelfName?: string | null
  note?: string | null
}

// Payload for creating a book issue (POST /api/book-issues)
export interface CreateBookIssueRequest {
  issueType: BookIssueType
  issueDate: string
  status?: BookIssueStatus
  note?: string | null
  items: CreateBookIssueItemDto[]
}

// Payload for updating a draft issue (PUT /api/book-issues/{id})
export interface UpdateBookIssueDraftRequest {
  issueType?: BookIssueType
  issueDate?: string
  status?: BookIssueStatus
  note?: string | null
  items: CreateBookIssueItemDto[]
}

// Status update payload (PUT /api/book-issues/{id}/status)
export interface UpdateIssueStatusRequest {
  status: BookIssueStatus
}

// Search & filter query for issues (GET /api/book-issues)
export interface BookIssueQuery {
  page?: number
  pageSize?: number
  issueType?: BookIssueType | 'ALL'
  status?: BookIssueStatus | 'ALL'
  search?: string
  fromDate?: string
  toDate?: string
}

// Paginated issues list response
export interface BookIssueListResponse {
  items: BookIssueRecord[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
