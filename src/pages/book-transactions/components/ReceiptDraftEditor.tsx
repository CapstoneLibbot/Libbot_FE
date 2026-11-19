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
  Save,
  Trash2,
  Warehouse,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { bookTransactionApi } from '@/features/book-transactions'
import type {
  BookReceiptRecord,
  BookReceiptType,
} from '@/features/book-transactions'
import { bookApi } from '@/features/books'
import { initialBooks } from '@/lib/mapData'
import { fetchShelfOptions, shelfOptions, type ShelfOption } from '../shelfOptions'

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

interface ReceiptDraftEditorProps {
  receipt: BookReceiptRecord
  onUpdate: (updated: BookReceiptRecord) => void
}

export default function ReceiptDraftEditor({ receipt, onUpdate }: ReceiptDraftEditorProps) {
  const navigate = useNavigate()

  // Form State initialized from existing receipt
  const [receiptType, setReceiptType] = useState<BookReceiptType>(receipt.receiptType)
  const [receivedDate, setReceivedDate] = useState<string>(
    receipt.receivedDate || new Date().toISOString().split('T')[0]
  )
  const [generalNote, setGeneralNote] = useState<string>(receipt.note || '')

  // Dynamic books and shelves
  const [availableBooks, setAvailableBooks] = useState<SelectableBook[]>([])
  const [shelfList, setShelfList] = useState<ShelfOption[]>(shelfOptions)

  // Scanner & Item Input State
  const [scanBarcode, setScanBarcode] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  // Map initial details to DraftReceiptItem
  const [items, setItems] = useState<DraftReceiptItem[]>(() =>
    receipt.details.map((d, idx) => ({
      tempId: d.id || `item-${idx}`,
      bookItemId: d.bookItemId,
      bookId: d.bookId,
      barcode: d.barcode,
      title: d.title,
      isbn: d.isbn,
      expectedShelfLevelId: d.expectedShelfLevelId || undefined,
      expectedShelfName: d.expectedShelfName || undefined,
      note: d.note || undefined,
    }))
  )

  // Book Selection Combobox State
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string>('101')
  const bookComboboxRef = useRef<HTMLDivElement>(null)

  // Shelf Selection State
  const [selectedShelfLevelId, setSelectedShelfLevelId] = useState<string>('1')

  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load dynamic books & shelves from backend API
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

  // Filter Books for Combobox
  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return bookList
    const q = bookSearchQuery.toLowerCase()
    return bookList.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q))
    )
  }, [bookList, bookSearchQuery])

  // Current selected book
  const currentBook = useMemo(() => {
    return bookList.find((b) => String(b.id) === selectedBookId) || bookList[0]
  }, [bookList, selectedBookId])

  // Current selected shelf
  const currentShelf = useMemo(() => {
    return (
      shelfList.find((s) => s.id === selectedShelfLevelId) || shelfList[0]
    )
  }, [shelfList, selectedShelfLevelId])

  // Shelf level buttons for current shelf
  const currentShelfLevels = useMemo(() => {
    return shelfList.filter((s) => s.shelfCode === currentShelf.shelfCode)
  }, [shelfList, currentShelf.shelfCode])

  // Close book combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bookComboboxRef.current &&
        !bookComboboxRef.current.contains(event.target as Node)
      ) {
        setIsBookDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-assign matching shelf silently when book changes
  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId)
    setIsBookDropdownOpen(false)
    setBookSearchQuery('')

    const b = bookList.find((item) => String(item.id) === bookId)
    if (b) {
      const match = shelfList.find((s) => s.targetCategoryId === b.category_id)
      if (match) {
        setSelectedShelfLevelId(match.id)
      }
    }
  }

  // Add Item to Draft
  const handleAddItem = async () => {
    setValidationError(null)
    setActionSuccessMessage(null)

    const code = scanBarcode.trim().toUpperCase()
    if (!code) {
      setValidationError('Please enter or scan a barcode.')
      return
    }

    if (items.some((it) => it.barcode.toUpperCase() === code)) {
      setValidationError(`Barcode ${code} is already added in this receipt draft.`)
      return
    }

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
    setActionSuccessMessage(`Scanned & added: "${bookTitle}" (${code})`)
    setScanBarcode('')
    setItemNote('')
  }

  const handleKeyDownBarcode = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem()
    }
  }

  // Remove Item from Draft
  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId))
  }

  // Save changes to Draft without submitting
  const handleSaveDraft = async () => {
    setIsSaving(true)
    setValidationError(null)
    setActionSuccessMessage(null)

    try {
      const updated = await bookTransactionApi.updateReceiptDraft(receipt.id, {
        receiptType,
        receivedDate,
        status: 'DRAFT',
        note: generalNote.trim() || null,
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
      onUpdate(updated)
      setActionSuccessMessage('Draft changes saved successfully.')
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save draft.')
    } finally {
      setIsSaving(false)
    }
  }

  // Submit Draft for Approval (transitions to PENDING)
  const handleSubmitForApproval = async () => {
    if (items.length === 0) {
      setValidationError('Please add at least one book item before submitting for approval.')
      return
    }

    setIsSubmitting(true)
    setValidationError(null)

    try {
      await bookTransactionApi.updateReceiptDraft(receipt.id, {
        receiptType,
        receivedDate,
        status: 'PENDING',
        note: generalNote.trim() || null,
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
      const updated = await bookTransactionApi.updateReceiptStatus(receipt.id, 'PENDING')
      onUpdate(updated)
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to submit draft for approval.')
      setIsSubmitting(false)
    }
  }

  // Discard Draft (transitions to CANCELLED)
  const handleDiscardDraft = async () => {
    if (!window.confirm('Are you sure you want to cancel and discard this draft receipt?')) return
    try {
      const updated = await bookTransactionApi.updateReceiptStatus(receipt.id, 'CANCELLED')
      onUpdate(updated)
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to discard draft.')
    }
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
              <span className="text-primary font-mono">{receipt.code || receipt.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {receipt.code || receipt.id.slice(0, 8).toUpperCase()}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                <Clock className="h-3 w-3" /> Draft Mode (Editable)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-50 transition-colors"
          >
            Discard Draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            {isSaving ? 'Saving...' : 'Save Draft Changes'}
          </button>
          <button
            type="button"
            disabled={isSubmitting || items.length === 0}
            onClick={handleSubmitForApproval}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>

      {/* Stepper Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Receipt Lifecycle & Workflow
          </p>
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
            Step 1 of 4: Add or remove copies below, then submit for approval.
          </span>
        </div>
        <div className="flex items-center justify-between">
          {[
            { key: 'DRAFT', label: 'Draft' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((step, idx) => {
            const isCurrent = idx === 0
            return (
              <div key={step.key} className="flex-1 relative flex flex-col items-center">
                {idx > 0 && (
                  <div className="absolute top-4 -left-1/2 w-full h-0.5 -translate-y-1/2 z-0 bg-slate-200" />
                )}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`mt-2 text-xs font-medium ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Column Metadata, Right Column Scanner & Items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Receipt Metadata */}
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
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      receiptType === 'NEW_ACQUISITION'
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <PackagePlus className="h-5 w-5" />
                    <span className="text-xs font-semibold">Nhập mới</span>
                    <span className="text-[10px] text-slate-400">Mua và quyên tặng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptType('BORROW_RETURN')}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      receiptType === 'BORROW_RETURN'
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <ArrowDownLeft className="h-5 w-5" />
                    <span className="text-xs font-semibold">Trả sách mượn</span>
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
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Đơn mua hàng PO-8839 từ nhà xuất bản Pearson"
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Tóm tắt</h2>
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
                <span>Trạng thái hiện tại:</span>
                <span className="font-semibold text-slate-700">BẢN NHÁP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan & Add Book Copies */}
        <div className="space-y-6 lg:col-span-8">
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
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                  {/* Book Combobox */}
                  <div className="sm:col-span-1 relative" ref={bookComboboxRef}>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Book Title Reference
                      </label>
                    </div>
                    <div className="relative mt-1.5">
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Tìm theo tên sách, tác giả hoặc ISBN..."
                          value={isBookDropdownOpen ? bookSearchQuery : currentBook?.title || ''}
                          onFocus={() => {
                            setIsBookDropdownOpen(true)
                            setBookSearchQuery('')
                          }}
                          onChange={(e) => {
                            setBookSearchQuery(e.target.value)
                            setIsBookDropdownOpen(true)
                          }}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setIsBookDropdownOpen(!isBookDropdownOpen)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>

                      {isBookDropdownOpen && (
                        <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {filteredBooks.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No books match "{bookSearchQuery}"
                              </div>
                            ) : (
                              filteredBooks.map((b) => (
                                <div
                                  key={b.id}
                                  onClick={() => handleSelectBook(String(b.id))}
                                  className={`flex items-start justify-between p-2.5 text-xs cursor-pointer transition-colors ${
                                    String(b.id) === selectedBookId
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="truncate font-medium">{b.title}</p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {b.author || 'Unknown author'} • ISBN: {b.isbn || 'N/A'}
                                    </p>
                                  </div>
                                  {String(b.id) === selectedBookId && (
                                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Target Shelf Destination (Only for New Acquisition) */}
                  <div className="sm:col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Target Shelf Destination
                      </label>
                    </div>
                    <div className="mt-1.5 space-y-2">
                      <div className="relative">
                        <Warehouse className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                          value={selectedShelfLevelId}
                          onChange={(e) => setSelectedShelfLevelId(e.target.value)}
                          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary truncate font-medium"
                        >
                          {shelfOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.shelfName} • {s.levelName} ({s.floorName} / {s.aisleName})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>

                      {/* Level Quick Select Pills */}
                      {currentShelfLevels.length > 1 && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400">Tầng:</span>
                          {currentShelfLevels.map((lvl) => (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => setSelectedShelfLevelId(lvl.id)}
                              className={`rounded px-2.5 py-0.5 font-medium transition-colors ${
                                lvl.id === selectedShelfLevelId
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Level {lvl.levelNumber}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Copy Note */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Copy Note (Optional)
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
          </div>

          {/* Draft Copies Table with Delete Action */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-900">
                Book Copies in this Draft ({items.length})
              </h2>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Clear All Copies
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Barcode className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">Chưa thêm bản sách nào vào bản nháp</p>
                <p className="text-xs text-slate-400">
                  Scan a barcode above or select standard sample codes (e.g. BK-0001, BK-0002).
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
                        <td className="px-4 py-3 text-slate-600">{it.expectedShelfName || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{it.note || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.tempId)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Xóa bản sách khỏi bản nháp"
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
