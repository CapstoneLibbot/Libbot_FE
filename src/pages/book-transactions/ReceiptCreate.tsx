import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  Barcode,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Warehouse,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { bookTransactionApi } from '@/features/book-transactions'
import type {
  BookReceiptType,
} from '@/features/book-transactions'
import { bookApi } from '@/features/books'
import { initialBooks } from '../../lib/mapData'
import { fetchShelfOptions, shelfOptions, type ShelfOption } from './shelfOptions'

interface DraftReceiptItem {
  tempId: string
  bookItemId?: string
  bookId: string
  barcode: string
  title: string
  isbn: string
  expectedShelfLevelId?: string
  expectedShelfName?: string
  note?: string
}

interface SelectableBook {
  id: string
  title: string
  isbn: string
  author?: string
  category_id?: number | string | null
}

export default function ReceiptCreate() {
  const navigate = useNavigate()

  // Form Header State
  const [receiptType, setReceiptType] = useState<BookReceiptType>('NEW_ACQUISITION')
  const [receivedDate, setReceivedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [generalNote, setGeneralNote] = useState<string>('')

  // Scanner & Item Input State
  const [scanBarcode, setScanBarcode] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null)

  // Dynamic books & shelves from API
  const [availableBooks, setAvailableBooks] = useState<SelectableBook[]>([])
  const [shelfList, setShelfList] = useState<ShelfOption[]>(shelfOptions)

  // 1. Searchable Book Combobox State
  const [selectedBookId, setSelectedBookId] = useState<string>('101')
  const [bookSearchQuery, setBookSearchQuery] = useState<string>('Clean Code')
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false)
  const bookDropdownRef = useRef<HTMLDivElement>(null)

  // 2. Searchable Shelf Combobox State
  const [selectedShelfLevelId, setSelectedShelfLevelId] = useState<string>('1')
  const [shelfSearchQuery, setShelfSearchQuery] = useState('')
  const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false)
  const shelfDropdownRef = useRef<HTMLDivElement>(null)

  // Added Items List
  const [items, setItems] = useState<DraftReceiptItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch real books and shelves from API
  useEffect(() => {
    let isMounted = true

    Promise.all([
      bookApi.getBooks({ page: 1, pageSize: 100 }).catch(() => null),
      fetchShelfOptions().catch(() => shelfOptions),
    ]).then(([booksData, shelvesData]) => {
      if (!isMounted) return

      if (booksData?.items?.length) {
        const mapped: SelectableBook[] = booksData.items.map((b: any) => ({
          id: String(b.id),
          title: b.title,
          isbn: b.isbn || 'N/A',
          author: b.author || undefined,
          category_id: b.categoryId,
        }))
        setAvailableBooks(mapped)
        setSelectedBookId(mapped[0].id)
        setBookSearchQuery(mapped[0].title)
      }

      if (shelvesData?.length) {
        setShelfList(shelvesData)
        setSelectedShelfLevelId(shelvesData[0].id)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bookDropdownRef.current &&
        !bookDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBookDropdownOpen(false)
      }
      if (
        shelfDropdownRef.current &&
        !shelfDropdownRef.current.contains(event.target as Node)
      ) {
        setIsShelfDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const bookList: SelectableBook[] = useMemo(() => {
    if (availableBooks.length > 0) return availableBooks
    return initialBooks.map((b) => ({
      id: String(b.id),
      title: b.title,
      isbn: b.isbn || 'N/A',
      author: b.author || undefined,
      category_id: b.category_id,
    }))
  }, [availableBooks])

  // Currently selected book object
  const currentBook = useMemo(() => {
    return bookList.find((b) => String(b.id) === selectedBookId) || bookList[0]
  }, [bookList, selectedBookId])

  // Currently selected shelf level object
  const currentShelf = useMemo(() => {
    return shelfList.find((s) => s.id === selectedShelfLevelId) || shelfList[0]
  }, [shelfList, selectedShelfLevelId])

  // Filtered books list for searchable combobox
  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return bookList
    const q = bookSearchQuery.toLowerCase()
    return bookList.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
    )
  }, [bookList, bookSearchQuery])

  // Filtered shelves list for searchable combobox
  const filteredShelves = useMemo(() => {
    if (!shelfSearchQuery.trim()) return shelfList
    const q = shelfSearchQuery.toLowerCase()
    return shelfList.filter(
      (s) =>
        s.shelfName.toLowerCase().includes(q) ||
        s.shelfCode.toLowerCase().includes(q) ||
        s.levelName.toLowerCase().includes(q) ||
        s.aisleName.toLowerCase().includes(q) ||
        s.floorName.toLowerCase().includes(q)
    )
  }, [shelfList, shelfSearchQuery])

  // Handle select book from combobox
  const handleSelectBook = (book: SelectableBook) => {
    setSelectedBookId(String(book.id))
    setBookSearchQuery(book.title)
    setIsBookDropdownOpen(false)

    // Smart auto-suggest: if target shelf doesn't match book's category, suggest it
    const rec = shelfList.find((s) => s.targetCategoryId === book.category_id)
    if (rec) {
      setSelectedShelfLevelId(rec.id)
    }
  }

  // Handle add scanned copy
  const handleAddItem = async () => {
    setValidationError(null)
    setScanSuccessMessage(null)

    const code = scanBarcode.trim().toUpperCase()
    if (!code) {
      setValidationError('Please enter or scan a barcode.')
      return
    }

    // Check duplicate in current draft
    if (items.some((it) => it.barcode.toUpperCase() === code)) {
      setValidationError(`Barcode ${code} is already added in this receipt draft.`)
      return
    }

    // Lookup in known catalog if exists
    const matchedCatalog = await bookTransactionApi.lookupBarcodeAsync(code)

    const isNewAcq = receiptType === 'NEW_ACQUISITION'

    // For Borrow Return, the item MUST already exist in the library catalog
    if (!isNewAcq && !matchedCatalog) {
      setValidationError(
        `Barcode "${code}" was not found in the library catalog. Only registered books can be processed for return.`
      )
      return
    }

    let bookTitle = isNewAcq ? (currentBook ? currentBook.title : 'Unknown Title') : ''
    let bookIsbn = isNewAcq ? (currentBook && currentBook.isbn ? currentBook.isbn : 'N/A') : ''
    let bId = selectedBookId

    if (matchedCatalog) {
      bookTitle = matchedCatalog.title
      bookIsbn = matchedCatalog.isbn
      bId = matchedCatalog.bookId
    }

    const shelfLabel = isNewAcq
      ? `${currentShelf.shelfName} • ${currentShelf.levelName} (${currentShelf.floorName} / ${currentShelf.aisleName})`
      : matchedCatalog?.currentShelfName || matchedCatalog?.expectedShelfName || undefined

    const newItem: DraftReceiptItem = {
      tempId: `item-${Date.now()}`,
      bookItemId: matchedCatalog?.bookItemId,
      bookId: bId,
      barcode: code,
      title: bookTitle,
      isbn: bookIsbn,
      expectedShelfLevelId: isNewAcq ? selectedShelfLevelId : (matchedCatalog?.expectedShelfLevelId || undefined),
      expectedShelfName: shelfLabel,
      note: itemNote.trim() || undefined,
    }

    setItems((prev) => [newItem, ...prev])
    setScanSuccessMessage(`Scanned & added: "${bookTitle}" (${code})`)
    setScanBarcode('')
    setItemNote('')
  }

  const handleKeyDownBarcode = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem()
    }
  }

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId))
  }

  const handleSubmit = async (targetStatus: 'DRAFT' | 'PENDING' = 'PENDING') => {
    if (items.length === 0) {
      setValidationError('Please add at least one book item before saving.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await bookTransactionApi.createReceipt({
        receiptType,
        receivedDate,
        status: targetStatus,
        note: generalNote,
        items: items.map((it) => ({
          bookItemId: it.bookItemId,
          bookId: it.bookId,
          barcode: it.barcode,
          title: it.title,
          isbn: it.isbn,
          expectedShelfLevelId: it.expectedShelfLevelId,
          note: it.note,
        })),
      })
      navigate(`/book-transactions/receipts/${created.id}`)
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create receipt.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/book-transactions')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Giao dịch sách</span>
              <span>/</span>
              <span>Phiếu nhập sách</span>
              <span>/</span>
              <span className="text-primary">Tạo phiếu nhập</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create Book Receipt
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/book-transactions')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || items.length === 0}
            onClick={() => handleSubmit('DRAFT')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <Clock className="h-4 w-4 text-slate-500" />
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting || items.length === 0}
            onClick={() => handleSubmit('PENDING')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Book Receipt'}
          </button>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Grid Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: General Receipt Information */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Thông tin phiếu nhập</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Select receipt type and received date.
            </p>

            <div className="mt-4 space-y-4">
              {/* Receipt Type Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Receipt Type
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiptType('NEW_ACQUISITION')}
                    className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                      receiptType === 'NEW_ACQUISITION'
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <PackagePlus className="h-5 w-5" />
                    <span className="mt-1 text-xs font-semibold">Nhập mới</span>
                    <span className="text-[10px] text-slate-400">Mua và quyên tặng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptType('BORROW_RETURN')}
                    className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                      receiptType === 'BORROW_RETURN'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="h-5 w-5" />
                    <span className="mt-1 text-xs font-semibold">Trả sách mượn</span>
                    <span className="text-[10px] text-slate-400">Bạn đọc trả sách</span>
                  </button>
                </div>
              </div>

              {/* Received Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Received Date
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    receiptType === 'NEW_ACQUISITION'
                      ? 'e.g. Purchase order PO-8839 from Pearson Publisher'
                      : 'e.g. Returned by student Sarah Connor (ID: ST-1002)'
                  }
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Tóm tắt</h3>
            <div className="mt-3 divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2 text-slate-600">
                <span>Loại phiếu nhập:</span>
                <span className="font-semibold text-slate-900">
                  {receiptType === 'NEW_ACQUISITION' ? 'New Acquisition' : 'Borrow Return'}
                </span>
              </div>
              <div className="flex justify-between py-2 text-slate-600">
                <span>Tổng số bản:</span>
                <span className="font-bold text-primary">{items.length} copies</span>
              </div>
              <div className="flex justify-between py-2 text-slate-600">
                <span>Trạng thái khi gửi:</span>
                <span className="font-medium text-amber-700">Đang chờ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan & Items Table */}
        <div className="space-y-6 lg:col-span-8">
          {/* Barcode Scanner & Input Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-slate-900">Quét và thêm bản sách</h2>
              </div>
              <span className="text-xs text-slate-400">
                Mẹo: Nhấn <kbd className="rounded border bg-slate-100 px-1 py-0.5 font-mono">Enter</kbd> để thêm mã vạch đã quét
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Barcode Input */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Barcode Scanner Input <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5 flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Quét hoặc nhập mã vạch (ví dụ: BK-0001, BK-0002, BK-0005)..."
                      value={scanBarcode}
                      onChange={(e) => setScanBarcode(e.target.value)}
                      onKeyDown={handleKeyDownBarcode}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              </div>

              {/* For Borrow Return: Helper Notice */}
              {receiptType === 'BORROW_RETURN' && (
                <div className="sm:col-span-2 flex items-center gap-2 rounded-lg bg-emerald-50/70 border border-emerald-200 p-3 text-xs text-emerald-800">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    Patron book return: Scan barcode on book tag. Book title, ISBN, and catalog details are retrieved automatically.
                  </span>
                </div>
              )}

              {/* Show Book Title Reference and Target Shelf Destination ONLY for New Acquisition */}
              {receiptType === 'NEW_ACQUISITION' && (
                <>
                  {/* 1. Improved Book Title Reference Combobox (Searchable + Max 3 items visible + scroll) */}
                  <div className="relative" ref={bookDropdownRef}>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Book Title Reference
                      </label>
                    </div>
                    <div className="relative mt-1.5">
                      <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={bookSearchQuery}
                        onFocus={() => setIsBookDropdownOpen(true)}
                        onChange={(e) => {
                          setBookSearchQuery(e.target.value)
                          setIsBookDropdownOpen(true)
                        }}
                        placeholder="Tìm theo tên sách, tác giả hoặc ISBN..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setIsBookDropdownOpen((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Dropdown Popover: 3 items height + smooth scroll */}
                    {isBookDropdownOpen && (
                      <div className="absolute left-0 right-0 z-30 mt-1 max-h-[160px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg divide-y divide-slate-100">
                        {filteredBooks.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No book matches "{bookSearchQuery}"
                          </div>
                        ) : (
                          filteredBooks.map((b) => (
                            <div
                              key={b.id}
                              onClick={() => handleSelectBook(b)}
                              className={`cursor-pointer px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                                String(b.id) === selectedBookId ? 'bg-primary/5 text-primary' : ''
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-800">
                                  {b.title}
                                </p>
                                <p className="truncate text-[11px] text-slate-500">
                                  {b.author || 'Unknown author'} • ISBN: {b.isbn || 'N/A'}
                                </p>
                              </div>
                              {String(b.id) === selectedBookId && (
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Target Shelf Destination (Only for New Acquisition) */}
                  <div className="relative" ref={shelfDropdownRef}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Target Shelf Destination
                    </label>

                    <div className="relative mt-1.5">
                      <Warehouse className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setIsShelfDropdownOpen((prev) => !prev)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary flex items-center justify-between"
                      >
                        <span className="truncate">
                          <span className="font-semibold text-slate-900">{currentShelf.shelfName}</span>
                          <span className="text-slate-500"> • {currentShelf.levelName}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({currentShelf.aisleName})</span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    </div>

                    {/* Dropdown Popover: 3 items height + search filter + smooth scroll */}
                    {isShelfDropdownOpen && (
                      <div className="absolute left-0 right-0 z-30 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Lọc kệ hoặc tầng..."
                              value={shelfSearchQuery}
                              onChange={(e) => setShelfSearchQuery(e.target.value)}
                              className="h-7 w-full rounded border border-slate-200 bg-white pl-7 pr-2 text-xs text-slate-800 focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>

                        <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-100 py-1">
                          {filteredShelves.map((s) => {
                            const isRecommended = s.targetCategoryId === currentBook.category_id
                            const isSelected = s.id === selectedShelfLevelId

                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  setSelectedShelfLevelId(s.id)
                                  setIsShelfDropdownOpen(false)
                                }}
                                className={`cursor-pointer px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                                  isSelected ? 'bg-primary/5' : ''
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs text-slate-900">
                                      {s.shelfName}
                                    </span>
                                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-600">
                                      {s.shelfCode}
                                    </span>
                                    {isRecommended && (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700 border border-amber-200">
                                        <Sparkles className="h-2.5 w-2.5" /> Recommended
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {s.levelName} (Level {s.levelNumber}) • {s.floorName} / {s.aisleName}
                                  </p>
                                </div>
                                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Level Switch Pills */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-400">Tầng:</span>
                      {[1, 2, 3].map((lvl) => {
                        const matchedLevel = shelfOptions.find(
                          (s) => s.shelfCode === currentShelf.shelfCode && s.levelNumber === lvl
                        )
                        if (!matchedLevel) return null
                        const isCurrentLvl = matchedLevel.id === selectedShelfLevelId

                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSelectedShelfLevelId(matchedLevel.id)}
                            className={`rounded px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                              isCurrentLvl
                                ? 'bg-slate-800 text-white font-semibold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Level {lvl}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Note */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ấn bản đặc biệt, ghi chú người tặng, tình trạng sách..."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {scanSuccessMessage && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                <span>{scanSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Scanned Copies Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <h3 className="text-sm font-bold text-slate-900">
                Scanned Copies in this Receipt ({items.length})
              </h3>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Barcode className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">Chưa quét bản sách nào</p>
                <p className="text-xs text-slate-400">
                  Scan a barcode above or enter sample codes: BK-0001, BK-0002, BK-0005.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Mã vạch</th>
                      <th className="px-4 py-3">Tên sách</th>
                      <th className="px-4 py-3">ISBN</th>
                      <th className="px-4 py-3">
                        {receiptType === 'NEW_ACQUISITION' ? 'Target Shelf' : 'Assigned Shelf'}
                      </th>
                      <th className="px-4 py-3">Ghi chú</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={it.tempId} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                          {it.barcode}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{it.title}</td>
                        <td className="px-4 py-3 text-slate-500">{it.isbn}</td>
                        <td className="px-4 py-3 text-slate-600">{it.expectedShelfName}</td>
                        <td className="px-4 py-3 text-slate-500">{it.note || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.tempId)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
