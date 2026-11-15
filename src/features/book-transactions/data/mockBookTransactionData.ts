import type {
  BarcodeLookupResult,
  BookIssueRecord,
  BookReceiptRecord,
  CreateBookIssueRequest,
  CreateBookReceiptRequest,
  UpdateBookIssueDraftRequest,
  UpdateBookReceiptDraftRequest,
} from '../types/bookTransactions'

// Initial Mock Book Receipts
let mockReceipts: BookReceiptRecord[] = [
  {
    id: 'rcp-001',
    code: 'RCP-2026-001',
    receiptType: 'NEW_ACQUISITION',
    receivedDate: '2026-11-15',
    status: 'COMPLETED',
    total: 3,
    note: 'Procurement of new computer science reference books from Springer.',
    details: [
      {
        id: 'rcpd-001',
        receiptId: 'rcp-001',
        bookItemId: 'item-101',
        bookId: '101',
        barcode: 'BK-0001',
        title: 'Clean Code',
        isbn: '978-0132350884',
        expectedShelfLevelId: '1',
        expectedShelfName: 'Shelf A1 - Level 1',
        note: 'Brand new, hardcover edition.',
      },
      {
        id: 'rcpd-002',
        receiptId: 'rcp-001',
        bookItemId: 'item-102',
        bookId: '102',
        barcode: 'BK-0002',
        title: 'Clean Architecture',
        isbn: '978-0134494166',
        expectedShelfLevelId: '1',
        expectedShelfName: 'Shelf A1 - Level 1',
        note: 'Brand new copy.',
      },
      {
        id: 'rcpd-003',
        receiptId: 'rcp-001',
        bookItemId: 'item-105',
        bookId: '105',
        barcode: 'BK-0005',
        title: 'Effective Java',
        isbn: '978-0134685991',
        expectedShelfLevelId: '2',
        expectedShelfName: 'Shelf A1 - Level 2',
        note: '3rd edition copy.',
      },
    ],
  },
  {
    id: 'rcp-002',
    code: 'RCP-2026-002',
    receiptType: 'BORROW_RETURN',
    receivedDate: '2026-11-15',
    status: 'COMPLETED',
    total: 2,
    note: 'Returned by student John Doe (Student ID: ST-88219). Checked by circulation desk.',
    details: [
      {
        id: 'rcpd-004',
        receiptId: 'rcp-002',
        bookItemId: 'item-108',
        bookId: '108',
        barcode: 'BK-0008',
        title: 'Pride and Prejudice',
        isbn: '978-0141439518',
        expectedShelfLevelId: '3',
        expectedShelfName: 'Shelf A2 - Level 1',
        note: 'Returned in good condition.',
      },
      {
        id: 'rcpd-005',
        receiptId: 'rcp-002',
        bookItemId: 'item-109',
        bookId: '109',
        barcode: 'BK-0009',
        title: 'Nineteen Eighty-Four',
        isbn: '978-0141182803',
        expectedShelfLevelId: '3',
        expectedShelfName: 'Shelf A2 - Level 1',
        note: 'Slight corner tear on front cover.',
      },
    ],
  },
  {
    id: 'rcp-003',
    code: 'RCP-2026-003',
    receiptType: 'NEW_ACQUISITION',
    receivedDate: '2026-11-16',
    status: 'PENDING',
    total: 2,
    note: 'Donation of literature books from Alumni Foundation. Pending supervisor sign-off.',
    details: [
      {
        id: 'rcpd-006',
        receiptId: 'rcp-003',
        bookItemId: 'item-115',
        bookId: '115',
        barcode: 'BK-0015',
        title: 'The Great Gatsby',
        isbn: '978-0141187761',
        expectedShelfLevelId: '3',
        expectedShelfName: 'Shelf A2 - Level 1',
        note: 'Donated copy.',
      },
      {
        id: 'rcpd-007',
        receiptId: 'rcp-003',
        bookItemId: 'item-116',
        bookId: '116',
        barcode: 'BK-0016',
        title: 'To Kill a Mockingbird',
        isbn: '978-0141182704',
        expectedShelfLevelId: '3',
        expectedShelfName: 'Shelf A2 - Level 1',
        note: 'Donated copy.',
      },
    ],
  },
  {
    id: 'rcp-004',
    code: 'RCP-2026-004',
    receiptType: 'BORROW_RETURN',
    receivedDate: '2026-11-16',
    status: 'DRAFT',
    total: 1,
    note: 'Drop-box book return. Pending item condition inspection.',
    details: [
      {
        id: 'rcpd-008',
        receiptId: 'rcp-004',
        bookItemId: 'item-106',
        bookId: '106',
        barcode: 'BK-0006',
        title: 'Programming TypeScript',
        isbn: '978-1491950296',
        expectedShelfLevelId: '2',
        expectedShelfName: 'Shelf A1 - Level 2',
        note: 'Returned via after-hours drop box.',
      },
    ],
  },
  {
    id: 'rcp-005',
    code: 'RCP-2026-005',
    receiptType: 'NEW_ACQUISITION',
    receivedDate: '2026-11-16',
    status: 'APPROVED',
    total: 1,
    note: 'Purchased from Fahasa. Approved by Library Manager, awaiting shelf placement.',
    details: [
      {
        id: 'rcpd-009',
        receiptId: 'rcp-005',
        bookItemId: 'item-107',
        bookId: '107',
        barcode: 'BK-0007',
        title: 'Spring in Action',
        isbn: '978-1617294136',
        expectedShelfLevelId: '3',
        expectedShelfName: 'Shelf A1 - Level 3',
        note: 'Ready to be dispatched to shelf.',
      },
    ],
  },
]

// Initial Mock Book Issues
let mockIssues: BookIssueRecord[] = [
  {
    id: 'iss-001',
    code: 'ISS-2026-001',
    issueType: 'BORROW_LOAN',
    issueDate: '2026-11-14',
    status: 'COMPLETED',
    total: 2,
    note: 'Two-week standard academic loan for research seminar (Borrower: Alice Williams).',
    details: [
      {
        id: 'issd-001',
        issueId: 'iss-001',
        bookItemId: 'item-103',
        bookId: '103',
        barcode: 'BK-0003',
        title: 'Design Patterns',
        isbn: '978-0201633610',
        currentShelfName: 'Shelf A1 - Level 2',
        note: 'Due back on Nov 28, 2026.',
      },
      {
        id: 'issd-002',
        issueId: 'iss-001',
        bookItemId: 'item-111',
        bookId: '111',
        barcode: 'BK-0011',
        title: 'The Pragmatic Programmer',
        isbn: '978-0321127426',
        currentShelfName: 'Shelf B1 - Level 2',
        note: 'Due back on Nov 28, 2026.',
      },
    ],
  },
  {
    id: 'iss-002',
    code: 'ISS-2026-002',
    issueType: 'DISPOSAL',
    issueDate: '2026-11-15',
    status: 'COMPLETED',
    total: 1,
    note: 'Decommissioning severely water damaged book beyond preservation.',
    details: [
      {
        id: 'issd-003',
        issueId: 'iss-002',
        bookItemId: 'item-104',
        bookId: '104',
        barcode: 'BK-0004',
        title: 'Oxford Dictionary of Computing',
        isbn: '978-0198601778',
        currentShelfName: 'Archive Storage',
        note: 'Water spill incident, pages mouldy.',
      },
    ],
  },
  {
    id: 'iss-003',
    code: 'ISS-2026-003',
    issueType: 'BORROW_LOAN',
    issueDate: '2026-11-16',
    status: 'PENDING',
    total: 1,
    note: 'Inter-library branch reservation loan (Borrower: Robert Taylor).',
    details: [
      {
        id: 'issd-004',
        issueId: 'iss-003',
        bookItemId: 'item-112',
        bookId: '112',
        barcode: 'BK-0012',
        title: 'Learning React',
        isbn: '978-1492078005',
        currentShelfName: 'Shelf B2 - Level 1',
        note: 'Reserved item pickup.',
      },
    ],
  },
  {
    id: 'iss-004',
    code: 'ISS-2026-004',
    issueType: 'DISPOSAL',
    issueDate: '2026-11-16',
    status: 'DRAFT',
    total: 1,
    note: 'Draft disposal batch for damaged books under review.',
    details: [
      {
        id: 'issd-005',
        issueId: 'iss-004',
        bookItemId: 'item-104',
        bookId: '104',
        barcode: 'BK-0004',
        title: 'Oxford Dictionary of Computing',
        isbn: '978-0198601778',
        currentShelfName: 'Shelf A1 - Level 2',
        note: 'Damaged cover and missing pages.',
      },
    ],
  },
  {
    id: 'iss-005',
    code: 'ISS-2026-005',
    issueType: 'BORROW_LOAN',
    issueDate: '2026-11-16',
    status: 'APPROVED',
    total: 1,
    note: 'Approved loan for Professor Evans department course reserve.',
    details: [
      {
        id: 'issd-006',
        issueId: 'iss-005',
        bookItemId: 'item-101',
        bookId: '101',
        barcode: 'BK-0001',
        title: 'Clean Code',
        isbn: '978-0132350884',
        currentShelfName: 'Shelf A1 - Level 1',
        note: 'Reserved loan approved.',
      },
    ],
  },
]

// Mock Barcode Catalog Lookup for instant scanner experience
export const mockKnownCatalogItems = [
  {
    bookItemId: 'item-101',
    bookId: '101',
    barcode: 'BK-0001',
    title: 'Clean Code',
    isbn: '978-0132350884',
    author: 'Robert C. Martin',
    currentShelfName: 'Shelf A1 - Level 1',
    shelfLevelId: '1',
    status: 'AVAILABLE',
  },
  {
    bookItemId: 'item-102',
    bookId: '102',
    barcode: 'BK-0002',
    title: 'Clean Architecture',
    isbn: '978-0134494166',
    author: 'Robert C. Martin',
    currentShelfName: 'Shelf A1 - Level 1',
    shelfLevelId: '1',
    status: 'AVAILABLE',
  },
  {
    bookItemId: 'item-103',
    bookId: '103',
    barcode: 'BK-0003',
    title: 'Design Patterns',
    isbn: '978-0201633610',
    author: 'Erich Gamma',
    currentShelfName: 'Shelf A1 - Level 2',
    shelfLevelId: '2',
    status: 'AVAILABLE',
  },
  {
    bookItemId: 'item-104',
    bookId: '104',
    barcode: 'BK-0004',
    title: 'Oxford Dictionary of Computing',
    isbn: '978-0198601778',
    author: 'Oxford Reference',
    currentShelfName: 'Shelf A1 - Level 2',
    shelfLevelId: '2',
    status: 'DAMAGED',
  },
  {
    bookItemId: 'item-105',
    bookId: '105',
    barcode: 'BK-0005',
    title: 'Effective Java',
    isbn: '978-0134685991',
    author: 'Joshua Bloch',
    currentShelfName: 'Shelf A1 - Level 2',
    shelfLevelId: '2',
    status: 'AVAILABLE',
  },
  {
    bookItemId: 'item-106',
    bookId: '106',
    barcode: 'BK-0006',
    title: 'Programming TypeScript',
    isbn: '978-1491950296',
    author: 'Boris Cherny',
    currentShelfName: 'Shelf A1 - Level 2',
    shelfLevelId: '2',
    status: 'AVAILABLE',
  },
  {
    bookItemId: 'item-107',
    bookId: '107',
    barcode: 'BK-0007',
    title: 'Spring in Action',
    isbn: '978-1617294136',
    author: 'Craig Walls',
    currentShelfName: 'Shelf A1 - Level 3',
    shelfLevelId: '3',
    status: 'AVAILABLE',
  },
  {
    bookItemId: 'item-108',
    bookId: '108',
    barcode: 'BK-0008',
    title: 'Pride and Prejudice',
    isbn: '978-0141439518',
    author: 'Jane Austen',
    currentShelfName: 'Shelf A2 - Level 1',
    shelfLevelId: '3',
    status: 'AVAILABLE',
  },
  {
    bookItemId: 'item-109',
    bookId: '109',
    barcode: 'BK-0009',
    title: 'Nineteen Eighty-Four',
    isbn: '978-0141182803',
    author: 'George Orwell',
    currentShelfName: 'Shelf A2 - Level 1',
    shelfLevelId: '3',
    status: 'AVAILABLE',
  },
  {
    bookItemId: 'item-110',
    bookId: '110',
    barcode: 'BK-0010',
    title: 'Library Management Handbook',
    isbn: '978-1119456339',
    author: 'Susan Carter',
    currentShelfName: 'Shelf B1 - Level 1',
    shelfLevelId: '4',
    status: 'AVAILABLE',
  },
]

export const mockBookTransactionService = {
  // Receipts
  getReceipts: (): Promise<BookReceiptRecord[]> => {
    return Promise.resolve([...mockReceipts])
  },

  getReceiptById: (id: string): Promise<BookReceiptRecord | null> => {
    const found = mockReceipts.find((r) => r.id === id || r.code === id)
    return Promise.resolve(found ? { ...found } : null)
  },

  createReceipt: (payload: CreateBookReceiptRequest): Promise<BookReceiptRecord> => {
    const nextSeq = mockReceipts.length + 1
    const code = `RCP-2026-${String(nextSeq).padStart(3, '0')}`
    const id = `rcp-${Date.now()}`

    const newReceipt: BookReceiptRecord = {
      id,
      code,
      receiptType: payload.receiptType,
      receivedDate: payload.receivedDate,
      status: payload.status || 'PENDING',
      total: payload.items.length,
      note: payload.note || null,
      details: payload.items.map((item, index) => ({
        id: `rcpd-${Date.now()}-${index}`,
        receiptId: id,
        bookItemId: item.bookItemId || `item-${Date.now()}-${index}`,
        bookId: item.bookId,
        barcode: item.barcode,
        title: item.title || 'Untitled Book',
        isbn: item.isbn || 'N/A',
        expectedShelfLevelId: item.expectedShelfLevelId || null,
        expectedShelfName: item.expectedShelfLevelId ? `Shelf Level ${item.expectedShelfLevelId}` : 'Unassigned',
        note: item.note || null,
      })),
    }

    mockReceipts = [newReceipt, ...mockReceipts]
    return Promise.resolve(newReceipt)
  },

  updateReceiptStatus: (
    id: string,
    status: BookReceiptRecord['status']
  ): Promise<BookReceiptRecord> => {
    const target = mockReceipts.find((r) => r.id === id || r.code === id)
    if (!target) {
      return Promise.reject(new Error(`Receipt with ID ${id} not found.`))
    }
    target.status = status
    return Promise.resolve({ ...target })
  },

  updateReceiptDraft: (
    id: string,
    payload: UpdateBookReceiptDraftRequest
  ): Promise<BookReceiptRecord> => {
    const target = mockReceipts.find((r) => r.id === id || r.code === id)
    if (!target) {
      return Promise.reject(new Error(`Receipt with ID ${id} not found.`))
    }
    if (payload.receiptType) target.receiptType = payload.receiptType
    if (payload.receivedDate) target.receivedDate = payload.receivedDate
    if (payload.status) target.status = payload.status
    if (payload.note !== undefined) target.note = payload.note
    target.total = payload.items.length
    target.details = payload.items.map((item, index) => ({
      id: item.bookItemId ? `rcpd-${item.bookItemId}` : `rcpd-${Date.now()}-${index}`,
      receiptId: target.id,
      bookItemId: item.bookItemId || `item-${Date.now()}-${index}`,
      bookId: item.bookId,
      barcode: item.barcode,
      title: item.title || 'Untitled Book',
      isbn: item.isbn || 'N/A',
      expectedShelfLevelId: item.expectedShelfLevelId || null,
      expectedShelfName: item.expectedShelfLevelId ? `Shelf Level ${item.expectedShelfLevelId}` : 'Unassigned',
      note: item.note || null,
    }))
    return Promise.resolve({ ...target })
  },

  // Issues
  getIssues: (): Promise<BookIssueRecord[]> => {
    return Promise.resolve([...mockIssues])
  },

  getIssueById: (id: string): Promise<BookIssueRecord | null> => {
    const found = mockIssues.find((i) => i.id === id || i.code === id)
    return Promise.resolve(found ? { ...found } : null)
  },

  createIssue: (payload: CreateBookIssueRequest): Promise<BookIssueRecord> => {
    const nextSeq = mockIssues.length + 1
    const code = `ISS-2026-${String(nextSeq).padStart(3, '0')}`
    const id = `iss-${Date.now()}`

    const newIssue: BookIssueRecord = {
      id,
      code,
      issueType: payload.issueType,
      issueDate: payload.issueDate,
      status: payload.status || 'PENDING',
      total: payload.items.length,
      note: payload.note || null,
      details: payload.items.map((item, index) => ({
        id: `issd-${Date.now()}-${index}`,
        issueId: id,
        bookItemId: item.bookItemId,
        bookId: item.bookId,
        barcode: item.barcode,
        title: item.title || 'Untitled Book',
        isbn: item.isbn || 'N/A',
        currentShelfName: item.currentShelfName || 'Main Stack',
        note: item.note || null,
      })),
    }

    mockIssues = [newIssue, ...mockIssues]
    return Promise.resolve(newIssue)
  },

  updateIssueStatus: (
    id: string,
    status: BookIssueRecord['status']
  ): Promise<BookIssueRecord> => {
    const target = mockIssues.find((i) => i.id === id || i.code === id)
    if (!target) {
      return Promise.reject(new Error(`Issue with ID ${id} not found.`))
    }
    target.status = status
    return Promise.resolve({ ...target })
  },

  updateIssueDraft: (
    id: string,
    payload: UpdateBookIssueDraftRequest
  ): Promise<BookIssueRecord> => {
    const target = mockIssues.find((i) => i.id === id || i.code === id)
    if (!target) {
      return Promise.reject(new Error(`Issue with ID ${id} not found.`))
    }
    if (payload.issueType) target.issueType = payload.issueType
    if (payload.issueDate) target.issueDate = payload.issueDate
    if (payload.status) target.status = payload.status
    if (payload.note !== undefined) target.note = payload.note
    target.total = payload.items.length
    target.details = payload.items.map((item, index) => ({
      id: `issd-${Date.now()}-${index}`,
      issueId: target.id,
      bookItemId: item.bookItemId,
      bookId: item.bookId,
      barcode: item.barcode,
      title: item.title || 'Untitled Book',
      isbn: item.isbn || 'N/A',
      currentShelfName: item.currentShelfName || 'Main Stack',
      note: item.note || null,
    }))
    return Promise.resolve({ ...target })
  },

  lookupBarcode: (barcode: string): BarcodeLookupResult | null => {
    const trimmed = barcode.trim().toUpperCase()
    return mockKnownCatalogItems.find((item) => item.barcode.toUpperCase() === trimmed) || null
  },
}

// Backward-compatibility alias
export const mockCirculationService = mockBookTransactionService
