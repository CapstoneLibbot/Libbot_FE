import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Barcode,
  BookOpen,
  Check,
  Clock,
  PackageMinus,
  Save,
  Trash2,
  Warehouse,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { bookTransactionApi } from '@/features/book-transactions'
import type {
  BookIssueRecord,
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

interface IssueDraftEditorProps {
  issue: BookIssueRecord
  onUpdate: (updated: BookIssueRecord) => void
}

export default function IssueDraftEditor({ issue, onUpdate }: IssueDraftEditorProps) {
  const navigate = useNavigate()

  // Form Header State
  const [issueType, setIssueType] = useState<BookIssueType>(issue.issueType)
  const [issueDate, setIssueDate] = useState<string>(
    issue.issueDate || new Date().toISOString().split('T')[0]
  )
  const [generalNote, setGeneralNote] = useState<string>(issue.note || '')

  // Scanner & Item Input State
  const [scanBarcode, setScanBarcode] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  // Map initial details to DraftIssueItem
  const [items, setItems] = useState<DraftIssueItem[]>(() =>
    issue.details.map((d, idx) => ({
      tempId: d.id || `item-${idx}`,
      bookItemId: d.bookItemId,
      bookId: d.bookId,
      barcode: d.barcode,
      title: d.title,
      isbn: d.isbn,
      currentShelfName: d.currentShelfName,
      note: d.note || undefined,
    }))
  )

  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setValidationError(`Barcode ${code} is already added in this issue draft.`)
      return
    }

    const matchedCatalog = await bookTransactionApi.lookupBarcodeAsync(code)
    if (!matchedCatalog) {
      setValidationError(
        `Barcode "${code}" was not found in the library catalog. Please verify the physical tag.`
      )
      return
    }

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
    setActionSuccessMessage(`Added to issue draft: "${matchedCatalog.title}" (${code})`)
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
    setActionSuccessMessage('Removed copy from draft.')
  }

  // Update item note inline
  const handleUpdateItemNote = (tempId: string, noteVal: string) => {
    setItems((prev) =>
      prev.map((it) => (it.tempId === tempId ? { ...it, note: noteVal } : it))
    )
  }

  // Save changes without changing status
  const handleSaveDraft = async () => {
    if (items.length === 0) {
      setValidationError('Please add at least one book copy before saving.')
      return
    }

    setIsSaving(true)
    setValidationError(null)
    setActionSuccessMessage(null)

    try {
      const updated = await bookTransactionApi.updateIssueDraft(issue.id, {
        issueType,
        issueDate,
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
      onUpdate(updated)
      setActionSuccessMessage('Draft changes saved successfully.')
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to update issue draft.')
    } finally {
      setIsSaving(false)
    }
  }

  // Submit Draft to PENDING
  const handleSubmitForApproval = async () => {
    if (items.length === 0) {
      setValidationError('Please add at least one book copy before submitting.')
      return
    }

    setIsSubmitting(true)
    setValidationError(null)
    setActionSuccessMessage(null)

    try {
      await bookTransactionApi.updateIssueDraft(issue.id, {
        issueType,
        issueDate,
        status: 'PENDING',
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
      const updated = await bookTransactionApi.updateIssueStatus(issue.id, 'PENDING')
      onUpdate(updated)
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to submit issue for approval.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Discard draft -> cancel
  const handleDiscardDraft = async () => {
    if (!window.confirm('Are you sure you want to discard and cancel this draft?')) {
      return
    }

    try {
      const cancelled = await bookTransactionApi.updateIssueStatus(issue.id, 'CANCELLED')
      onUpdate(cancelled)
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to discard draft.')
    }
  }

  // Distinct title count in current items
  const distinctTitlesCount = new Set(items.map((it) => it.bookId)).size

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            title="Quay lại"
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
              <span className="font-mono text-primary">
                {issue.code || issue.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                Draft Mode
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {issue.code || issue.id.slice(0, 8).toUpperCase()}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                {issueType === 'BORROW_LOAN' ? (
                  <>
                    <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" /> Borrow Loan
                  </>
                ) : (
                  <>
                    <PackageMinus className="h-3.5 w-3.5 text-amber-700" /> Disposal
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" /> Discard Draft
          </button>

          <button
            type="button"
            disabled={isSaving || isSubmitting}
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            {isSaving ? 'Saving...' : 'Save Draft Changes'}
          </button>

          <button
            type="button"
            disabled={isSubmitting || items.length === 0}
            onClick={handleSubmitForApproval}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>

      {/* Draft Notification Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
        <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-amber-950">Đang chỉnh sửa bản nháp</p>
          <p className="mt-0.5 text-amber-800">
            Phiếu xuất sách hiện ở trạng thái <strong>BẢN NHÁP</strong>. Số lượng tồn kho
            chưa được cập nhật. Bạn có thể quét mã vạch mới, xóa bản sách đã thêm nhầm hoặc cập nhật
            thông tin trước khi gửi quản lý phê duyệt.
          </p>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Form Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Issue Parameters & Summary */}
        <div className="space-y-6 lg:col-span-1">
          {/* Issue Parameters Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
              Issue Parameters
            </h2>

            {/* Issue Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Issue Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIssueType('BORROW_LOAN')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                    issueType === 'BORROW_LOAN'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4 mb-1 text-indigo-600" />
                  Borrow Loan
                </button>

                <button
                  type="button"
                  onClick={() => setIssueType('DISPOSAL')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                    issueType === 'DISPOSAL'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-800 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <PackageMinus className="h-4 w-4 mb-1 text-amber-700" />
                  Disposal
                </button>
              </div>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* General Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Note / Reference
              </label>
              <textarea
                rows={3}
                placeholder="Lý do xuất, mã bạn đọc mượn hoặc thông tin phê duyệt thanh lý..."
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Draft Summary KPI */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Draft Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 text-center border border-slate-100">
                <span className="text-xs text-slate-500 block">Tổng số bản</span>
                <span className="text-2xl font-bold text-primary">{items.length}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center border border-slate-100">
                <span className="text-xs text-slate-500 block">Đầu sách</span>
                <span className="text-2xl font-bold text-slate-800">{distinctTitlesCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Barcode Scanner & Draft Copies Table */}
        <div className="space-y-6 lg:col-span-2">
          {/* Barcode Scanner Input Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Barcode className="h-5 w-5 text-primary" />
                  Scan Book Barcode
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scan or enter physical barcodes to stage book items into this issue draft.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Barcode Number
                </label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ví dụ: BK-0001, BK-0002..."
                    value={scanBarcode}
                    onChange={(e) => setScanBarcode(e.target.value)}
                    onKeyDown={handleKeyDownBarcode}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bìa sách bị mòn nhẹ"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  onKeyDown={handleKeyDownBarcode}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Barcode className="h-3.5 w-3.5" />
                Add Item to Issue
              </button>
            </div>
          </div>

          {/* Draft Items Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-900">
                  Staged Book Copies ({items.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Click trash icon to remove item from draft
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <PackageMinus className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">Chưa có bản sách nào trong bản nháp.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Scan barcodes above to add copies to this issue.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-12">#</th>
                      <th className="px-4 py-3">Mã vạch</th>
                      <th className="px-4 py-3">Tên sách và ISBN</th>
                      <th className="px-4 py-3">Kệ gốc</th>
                      <th className="px-4 py-3">Ghi chú</th>
                      <th className="px-4 py-3 text-right w-16">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={item.tempId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-slate-800 font-mono font-semibold border border-slate-200">
                            <Barcode className="h-3.5 w-3.5 text-slate-500" />
                            {item.barcode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ISBN: {item.isbn || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                            {item.currentShelfName || 'Main Shelf'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Thêm ghi chú cho bản sách..."
                            value={item.note || ''}
                            onChange={(e) => handleUpdateItemNote(item.tempId, e.target.value)}
                            className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-primary focus:bg-white focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.tempId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
