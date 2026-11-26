import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Barcode,
  Check,
  Clock,
  PackageMinus,
  Plus,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { bookTransactionApi } from '@/features/book-transactions'
import type {
  BookIssueType,
} from '@/features/book-transactions'

interface DraftIssueItem {
  tempId: string
  bookItemId: string
  bookId: string
  barcode: string
  title: string
  isbn: string
  currentShelfName?: string | null
  note?: string
}

export default function IssueCreate() {
  const navigate = useNavigate()

  // Form Header State
  const [issueType, setIssueType] = useState<BookIssueType>('BORROW_LOAN')
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [generalNote, setGeneralNote] = useState<string>('')

  // Scanner & Item Input State
  const [scanBarcode, setScanBarcode] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null)

  // Added Items List
  const [items, setItems] = useState<DraftIssueItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add Item Handler
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
      setValidationError(`Barcode ${code} is already added in this issue draft.`)
      return
    }

    // Lookup in catalog
    const matchedCatalog = await bookTransactionApi.lookupBarcodeAsync(code)
    if (!matchedCatalog) {
      setValidationError(
        `Barcode "${code}" was not found in the library catalog. Please verify the physical tag.`
      )
      return
    }

    // Validation: for Borrow Loan, item status should ideally be AVAILABLE
    if (issueType === 'BORROW_LOAN' && matchedCatalog.status.trim().toUpperCase() !== 'AVAILABLE') {
      setValidationError(
        `Warning: Item "${code}" has current status "${matchedCatalog.status}". Only AVAILABLE items can be loaned.`
      )
      return
    }

    const newItem: DraftIssueItem = {
      tempId: `item-${Date.now()}`,
      bookItemId: matchedCatalog.bookItemId,
      bookId: matchedCatalog.bookId,
      barcode: matchedCatalog.barcode,
      title: matchedCatalog.title,
      isbn: matchedCatalog.isbn,
      currentShelfName: matchedCatalog.currentShelfName,
      note: itemNote.trim() || undefined,
    }

    setItems((prev) => [newItem, ...prev])
    setScanSuccessMessage(`Added to issue: "${matchedCatalog.title}" (${code})`)
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
      const created = await bookTransactionApi.createIssue({
        issueType,
        issueDate,
        status: targetStatus,
        note: generalNote,
        items: items.map((it) => ({
          bookItemId: it.bookItemId,
          bookId: it.bookId,
          barcode: it.barcode,
          title: it.title,
          isbn: it.isbn,
          currentShelfName: it.currentShelfName,
          note: it.note,
        })),
      })
      navigate(`/book-transactions/issues/${created.id}`)
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create book issue.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/book-transactions?tab=issues')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Giao dịch sách</span>
              <span>/</span>
              <span>Phiếu xuất sách</span>
              <span>/</span>
              <span className="text-primary">Tạo phiếu xuất</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create Book Issue
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/book-transactions?tab=issues')}
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
            {isSubmitting ? 'Submitting...' : 'Submit Book Issue'}
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
        {/* Left Column: Issue Metadata */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Thông tin phiếu xuất</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Select transaction type and date.
            </p>

            <div className="mt-4 space-y-4">
              {/* Issue Type Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Issue Type
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueType('BORROW_LOAN')}
                    className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                      issueType === 'BORROW_LOAN'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="h-5 w-5" />
                    <span className="mt-1 text-xs font-semibold">Cho mượn</span>
                    <span className="text-[10px] text-slate-400">Bạn đọc mượn sách</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIssueType('DISPOSAL')}
                    className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                      issueType === 'DISPOSAL'
                        ? 'border-amber-600 bg-amber-50 text-amber-800 ring-1 ring-amber-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <PackageMinus className="h-5 w-5" />
                    <span className="mt-1 text-xs font-semibold">Thanh lý</span>
                    <span className="text-[10px] text-slate-400">Loại khỏi kho</span>
                  </button>
                </div>
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
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
                    issueType === 'BORROW_LOAN'
                      ? 'e.g. Standard 14-day checkout, due Dec 01, 2026'
                      : 'e.g. Decommissioning copies approved by Library Board'
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
                <span>Loại phiếu xuất:</span>
                <span className="font-semibold text-slate-900">
                  {issueType === 'BORROW_LOAN' ? 'Borrow Loan' : 'Disposal'}
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-slate-900">Quét bản sách để xuất</h2>
              </div>
              <span className="text-xs text-slate-400">
                Mẹo: Nhấn <kbd className="rounded border bg-slate-100 px-1 py-0.5 font-mono">Enter</kbd> để thêm
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      placeholder="Quét hoặc nhập mã vạch (ví dụ: BK-0001, BK-0002, BK-0003, BK-0005)..."
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

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hạn trả sau 2 tuần hoặc lý do thanh lý..."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                Copies to Issue ({items.length})
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
                <p className="mt-2 text-sm font-medium text-slate-600">Chưa thêm bản sách nào</p>
                <p className="text-xs text-slate-400">
                  Scan available copies to loan or liquidate (Sample codes: BK-0001, BK-0002, BK-0003).
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
                      <th className="px-4 py-3">Kệ hiện tại</th>
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
                        <td className="px-4 py-3 text-slate-600">{it.currentShelfName || 'Kệ chính'}</td>
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
