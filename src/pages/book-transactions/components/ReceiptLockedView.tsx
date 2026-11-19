import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  Barcode,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Layers,
  PackagePlus,
  Printer,
  Warehouse,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { bookTransactionApi } from '@/features/book-transactions'
import type {
  BookReceiptRecord,
  BookReceiptStatus,
  BookReceiptType,
} from '@/features/book-transactions'

interface ReceiptLockedViewProps {
  receipt: BookReceiptRecord
  onUpdate: (updated: BookReceiptRecord) => void
}

function receiptStatusLabel(status: BookReceiptStatus) {
  switch (status) {
    case 'DRAFT': return 'Bản nháp'
    case 'PENDING': return 'Chờ duyệt'
    case 'APPROVED': return 'Đã duyệt'
    case 'COMPLETED': return 'Hoàn tất'
    case 'CANCELLED': return 'Đã hủy'
    default: return status
  }
}

export default function ReceiptLockedView({ receipt, onUpdate }: ReceiptLockedViewProps) {
  const navigate = useNavigate()
  const [actionError, setActionError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Status update handler
  const handleUpdateStatus = async (newStatus: BookReceiptStatus) => {
    setIsUpdating(true)
    setActionError(null)

    try {
      const updated = await bookTransactionApi.updateReceiptStatus(receipt.id, newStatus)
      onUpdate(updated)
    } catch (err: any) {
      setActionError(err?.message || `Không thể cập nhật trạng thái phiếu thành ${receiptStatusLabel(newStatus)}.`)
    } finally {
      setIsUpdating(false)
    }
  }

  // Group receipt details by book title
  const groupedBookTitles = useMemo(() => {
    if (!receipt?.details) return []
    const map = new Map<
      string,
      {
        bookId: string
        title: string
        isbn: string
        copiesCount: number
        shelfSummary: string
        items: typeof receipt.details
      }
    >()

    for (const item of receipt.details) {
      const key = item.bookId || item.title || item.isbn
      if (!map.has(key)) {
        map.set(key, {
          bookId: item.bookId,
          title: item.title,
          isbn: item.isbn,
          copiesCount: 0,
          shelfSummary: item.expectedShelfName || 'Chưa phân kệ',
          items: [],
        })
      }
      const group = map.get(key)!
      group.copiesCount += 1
      group.items.push(item)
    }

    return Array.from(map.values())
  }, [receipt?.details])

  const [expandedTitles, setExpandedTitles] = useState<Record<string, boolean>>({})

  const toggleExpand = (bookId: string) => {
    setExpandedTitles((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }))
  }

  const toggleExpandAll = () => {
    const allExpanded = groupedBookTitles.every((g) => expandedTitles[g.bookId])
    const updated: Record<string, boolean> = {}
    groupedBookTitles.forEach((g) => {
      updated[g.bookId] = !allExpanded
    })
    setExpandedTitles(updated)
  }

  const renderReceiptTypeBadge = (type: BookReceiptType) => {
    if (type === 'NEW_ACQUISITION') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
          <PackagePlus className="h-3.5 w-3.5 text-blue-600" /> Nhập sách mới
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
        <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" /> Sách mượn trả lại
      </span>
    )
  }

  // Stepper steps
  const steps: { key: BookReceiptStatus; label: string }[] = [
    { key: 'DRAFT', label: 'Bản nháp' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'COMPLETED', label: 'Hoàn tất' },
  ]

  const getStepIndex = (st: BookReceiptStatus) => {
    if (st === 'DRAFT') return 0
    if (st === 'PENDING') return 1
    if (st === 'APPROVED') return 2
    if (st === 'COMPLETED') return 3
    return -1
  }

  const currentStepIdx = getStepIndex(receipt.status)

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-6">
      {/* Top Breadcrumb & Controls */}
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
              {renderReceiptTypeBadge(receipt.receiptType)}
            </div>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" /> In phiếu
          </button>

          {receipt.status === 'PENDING' && (
            <>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('DRAFT')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                Trả về bản nháp
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CANCELLED')}
                className="rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Từ chối và hủy
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('APPROVED')}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 shadow-xs transition-colors"
              >
                Duyệt phiếu nhập
              </button>
            </>
          )}

          {receipt.status === 'APPROVED' && (
            <>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CANCELLED')}
                className="rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Hủy phiếu nhập
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('COMPLETED')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Hoàn tất và cập nhật tồn kho
              </button>
            </>
          )}

          {receipt.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Đã kiểm tra và nhập kho
            </span>
          )}

          {receipt.status === 'CANCELLED' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 border border-rose-200">
              <XCircle className="h-4 w-4 text-rose-600" />
              Phiếu nhập đã hủy
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Lifecycle Stepper */}
      {receipt.status !== 'CANCELLED' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Tiến trình phiếu nhập
          </p>
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const isPast = currentStepIdx > idx
              const isCurrent = currentStepIdx === idx

              return (
                <div key={step.key} className="flex-1 relative flex flex-col items-center">
                  {idx > 0 && (
                    <div
                      className={`absolute top-4 -left-1/2 w-full h-0.5 -translate-y-1/2 z-0 ${
                        isPast || isCurrent ? 'bg-primary' : 'bg-slate-200'
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-primary text-white'
                        : isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCurrent ? 'font-bold text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Ngày nhập</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{receipt.receivedDate}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Tổng số bản</p>
          <p className="mt-1 text-base font-semibold text-primary">{receipt.total} bản</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Đầu sách</p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {groupedBookTitles.length} đầu sách
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Trạng thái</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{receiptStatusLabel(receipt.status)}</p>
        </div>
      </div>

      {receipt.note && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ghi chú
          </p>
          <p className="mt-1 text-sm text-slate-700">{receipt.note}</p>
        </div>
      )}

      {/* Book Titles & Copies Accordion List (Read-Only) */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Đầu sách trong phiếu nhập
              <span className="text-xs font-normal text-slate-500">
                ({groupedBookTitles.length} đầu sách • {receipt.total} bản)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phiếu đang ở trạng thái {receiptStatusLabel(receipt.status)}. Chọn đầu sách để xem các bản sách.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleExpandAll}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
          >
            {groupedBookTitles.every((g) => expandedTitles[g.bookId]) ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Thu gọn tất cả
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Mở rộng tất cả
              </>
            )}
          </button>
        </div>

        {/* Grouped Titles Cards */}
        <div className="space-y-3">
          {groupedBookTitles.map((group, groupIdx) => {
            const isExpanded = !!expandedTitles[group.bookId]

            return (
              <div
                key={group.bookId || groupIdx}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all"
              >
                {/* Book Title Master Row */}
                <div
                  onClick={() => toggleExpand(group.bookId)}
                  className={`flex cursor-pointer items-center justify-between p-4 transition-colors ${
                    isExpanded ? 'bg-slate-50/80 border-b border-slate-100' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-100"
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-primary' : ''
                        }`}
                      />
                    </button>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {group.title}
                      </h3>
                      <div className="mt-0.5 text-xs text-slate-500 font-mono">
                        ISBN: {group.isbn || 'Chưa có'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                      <Layers className="h-3.5 w-3.5" />
                      {group.copiesCount} bản
                    </span>
                  </div>
                </div>

                {/* Expanded Copies Sub-Table */}
                {isExpanded && (
                  <div className="bg-white p-4">
                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2.5 w-12">#</th>
                            <th className="px-4 py-2.5">Mã vạch</th>
                            <th className="px-4 py-2.5">
                              {receipt.receiptType === 'NEW_ACQUISITION' ? 'Vị trí kệ dự kiến' : 'Kệ được phân công'}
                            </th>
                            <th className="px-4 py-2.5">Ghi chú bản sách</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.items.map((item, itemIdx) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 text-slate-400 font-mono">
                                {itemIdx + 1}
                              </td>
                              <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-slate-800 border border-slate-200">
                                  <Barcode className="h-3.5 w-3.5 text-slate-500" />
                                  {item.barcode}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                  <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                                  {item.expectedShelfName || 'Chưa phân kệ'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">
                                {item.note || <span className="text-slate-300">-</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
