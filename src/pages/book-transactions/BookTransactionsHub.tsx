import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  PackageMinus,
  PackagePlus,
  Plus,
  Search,
  XCircle,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import { bookTransactionApi } from '@/features/book-transactions'
import type {
  BookIssueRecord,
  BookIssueStatus,
  BookIssueType,
  BookReceiptRecord,
  BookReceiptStatus,
  BookReceiptType,
} from '@/features/book-transactions'

export default function BookTransactionsHub() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'issues' ? 'issues' : 'receipts'

  const [receipts, setReceipts] = useState<BookReceiptRecord[]>([])
  const [issues, setIssues] = useState<BookIssueRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [receiptTypeFilter, setReceiptTypeFilter] = useState<'ALL' | BookReceiptType>('ALL')
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<'ALL' | BookReceiptStatus>('ALL')
  const [issueTypeFilter, setIssueTypeFilter] = useState<'ALL' | BookIssueType>('ALL')
  const [issueStatusFilter, setIssueStatusFilter] = useState<'ALL' | BookIssueStatus>('ALL')

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    Promise.all([bookTransactionApi.getReceipts(), bookTransactionApi.getIssues()])
      .then(([rData, iData]) => {
        if (!isMounted) return
        setReceipts(rData)
        setIssues(iData)
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // KPI Calculations
  const totalReceivedCopies = useMemo(
    () => receipts.filter((r) => r.status === 'COMPLETED').reduce((acc, curr) => acc + curr.total, 0),
    [receipts]
  )
  const totalIssuedCopies = useMemo(
    () => issues.filter((i) => i.status === 'COMPLETED').reduce((acc, curr) => acc + curr.total, 0),
    [issues]
  )
  const pendingReceiptsCount = useMemo(
    () => receipts.filter((r) => r.status === 'PENDING').length,
    [receipts]
  )
  const pendingIssuesCount = useMemo(
    () => issues.filter((i) => i.status === 'PENDING').length,
    [issues]
  )

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (receiptTypeFilter !== 'ALL' && r.receiptType !== receiptTypeFilter) return false
      if (receiptStatusFilter !== 'ALL' && r.status !== receiptStatusFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchCode = (r.code || r.id).toLowerCase().includes(query)
        const matchNote = r.note?.toLowerCase().includes(query)
        const matchDetail = r.details.some(
          (d) =>
            d.barcode.toLowerCase().includes(query) ||
            d.title.toLowerCase().includes(query) ||
            d.isbn.toLowerCase().includes(query)
        )
        if (!matchCode && !matchNote && !matchDetail) return false
      }
      return true
    })
  }, [receipts, receiptTypeFilter, receiptStatusFilter, searchQuery])

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (issueTypeFilter !== 'ALL' && i.issueType !== issueTypeFilter) return false
      if (issueStatusFilter !== 'ALL' && i.status !== issueStatusFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchCode = (i.code || i.id).toLowerCase().includes(query)
        const matchNote = i.note?.toLowerCase().includes(query)
        const matchDetail = i.details.some(
          (d) =>
            d.barcode.toLowerCase().includes(query) ||
            d.title.toLowerCase().includes(query) ||
            d.isbn.toLowerCase().includes(query)
        )
        if (!matchCode && !matchNote && !matchDetail) return false
      }
      return true
    })
  }, [issues, issueTypeFilter, issueStatusFilter, searchQuery])

  const renderStatusBadge = (status: BookReceiptStatus | BookIssueStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <Clock className="h-3 w-3" /> Draft
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <AlertCircle className="h-3 w-3" /> Pending
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        )
      default:
        return <span>{status}</span>
    }
  }

  const renderReceiptTypeBadge = (type: BookReceiptType) => {
    if (type === 'NEW_ACQUISITION') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
          <PackagePlus className="h-3.5 w-3.5 text-blue-600" /> New Acquisition
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
        <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" /> Borrow Return
      </span>
    )
  }

  const renderIssueTypeBadge = (type: BookIssueType) => {
    if (type === 'BORROW_LOAN') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-200">
          <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" /> Borrow Loan
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-300">
        <PackageMinus className="h-3.5 w-3.5 text-amber-700" /> Disposal
      </span>
    )
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Book Transactions
              </h1>
              <p className="text-sm text-slate-500">
                Manage book receipts (new acquisitions, returns) and book issues (loans, disposals).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/book-transactions/receipts/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Book Receipt
          </button>
          <button
            onClick={() => navigate('/book-transactions/issues/new')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4 text-slate-500" />
            New Book Issue
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Book Receipts Completed</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{totalReceivedCopies}</p>
            <span className="text-xs text-slate-500">copies received</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Book Issues Completed</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{totalIssuedCopies}</p>
            <span className="text-xs text-slate-500">copies issued</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Pending Receipts</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{pendingReceiptsCount}</p>
            <span className="text-xs text-slate-500">needs review</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Pending Issues</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{pendingIssuesCount}</p>
            <span className="text-xs text-slate-500">awaiting release</span>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-slate-200 px-6 pt-3">
          <button
            onClick={() => setSearchParams({ tab: 'receipts' })}
            className={`flex items-center gap-2 border-b-2 pb-3.5 text-sm font-semibold transition-colors ${
              activeTab === 'receipts'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackagePlus className="h-4 w-4" />
            Book Receipts
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {receipts.length}
            </span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'issues' })}
            className={`ml-8 flex items-center gap-2 border-b-2 pb-3.5 text-sm font-semibold transition-colors ${
              activeTab === 'issues'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackageMinus className="h-4 w-4" />
            Book Issues
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {issues.length}
            </span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, title, barcode, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Filter className="h-3.5 w-3.5" /> Filter by:
            </div>

            {activeTab === 'receipts' ? (
              <>
                <select
                  value={receiptTypeFilter}
                  onChange={(e) => setReceiptTypeFilter(e.target.value as any)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Receipt Types</option>
                  <option value="NEW_ACQUISITION">New Acquisition</option>
                  <option value="BORROW_RETURN">Borrow Return</option>
                </select>

                <select
                  value={receiptStatusFilter}
                  onChange={(e) => setReceiptStatusFilter(e.target.value as any)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </>
            ) : (
              <>
                <select
                  value={issueTypeFilter}
                  onChange={(e) => setIssueTypeFilter(e.target.value as any)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Issue Types</option>
                  <option value="BORROW_LOAN">Borrow Loan</option>
                  <option value="DISPOSAL">Disposal</option>
                </select>

                <select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value as any)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Receipts Table */}
        {activeTab === 'receipts' && (
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                Loading receipts...
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PackagePlus className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No receipts found</p>
                <p className="text-xs text-slate-500">Try adjusting your filters or create a new book receipt.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Receipt ID</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Received Date</th>
                    <th className="px-6 py-3.5">Copies</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Note</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/book-transactions/receipts/${r.id}`)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {r.code || r.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">{renderReceiptTypeBadge(r.receiptType)}</td>
                      <td className="px-6 py-4 text-slate-600">{r.receivedDate}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{r.total}</td>
                      <td className="px-6 py-4">{renderStatusBadge(r.status)}</td>
                      <td className="max-w-xs truncate px-6 py-4 text-xs text-slate-500" title={r.note || ''}>
                        {r.note || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/book-transactions/receipts/${r.id}`)
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Issues Table */}
        {activeTab === 'issues' && (
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                Loading issues...
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PackageMinus className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No issues found</p>
                <p className="text-xs text-slate-500">Try adjusting your filters or create a new book issue.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Issue ID</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Copies</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Note</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIssues.map((i) => (
                    <tr
                      key={i.id}
                      onClick={() => navigate(`/book-transactions/issues/${i.id}`)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {i.code || i.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">{renderIssueTypeBadge(i.issueType)}</td>
                      <td className="px-6 py-4 text-slate-600">{i.issueDate}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{i.total}</td>
                      <td className="px-6 py-4">{renderStatusBadge(i.status)}</td>
                      <td className="max-w-xs truncate px-6 py-4 text-xs text-slate-500" title={i.note || ''}>
                        {i.note || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/book-transactions/issues/${i.id}`)
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
