import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { floorApi } from '@/features/floors/api/floorApi'
import type { FloorRecord, FloorWriteRequest } from '@/features/floors/types/floor'
import type { FloorStatus } from '@/types/enums'
import { getErrorMessage } from '@/services/http/error'

export type FloorFormData = FloorWriteRequest

function FloorList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)

  const [floors, setFloors] = useState<FloorRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  const [isLoading, setIsLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadFloors = async () => {
    setIsLoading(true)
    setErrorNotice(null)
    try {
      const data = await floorApi.getFloors({
        page,
        pageSize,
        searchTerm: search.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
        sortBy: 'floorNumber',
        sortOrder: 'asc',
      })
      setFloors(data.items)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
    } catch (err) {
      setErrorNotice(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFloors()
  }, [page, status])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadFloors()
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('ALL')
    setPage(1)
  }

  const handleCreate = async (formData: FloorFormData) => {
    try {
      setActionNotice(null)
      await floorApi.createFloor(formData)
      setCreateOpen(false)
      setActionNotice('Floor created successfully!')
      setPage(1)
      loadFloors()
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleDelete = async (e: React.MouseEvent, floor: FloorRecord) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete "${floor.name}"?`)) return

    setDeletingId(floor.id)
    try {
      await floorApi.deleteFloor(floor.id)
      setActionNotice(`Floor "${floor.name}" deleted successfully!`)
      loadFloors()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const hasFilters = search !== '' || status !== 'ALL'

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="space-y-5">
        <header className="flex w-full flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Layers3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#17181c]">Floors</h1>
              <p className="mt-0.5 text-sm text-[#596174]">
                Manage library floors and operational status.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="ml-auto flex h-10 shrink-0 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Floor
          </button>
        </header>

        {actionNotice && (
          <div className="flex items-center justify-between rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
            <span>{actionNotice}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-[#166534] hover:opacity-75"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="flex items-center gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorNotice}</span>
            <button
              type="button"
              onClick={loadFloors}
              className="ml-auto flex items-center gap-1 font-semibold underline hover:no-underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[350px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or description..."
              className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm text-[#17181c] outline-none placeholder:text-[#7b8190] focus:border-primary"
            />
          </form>

          <div className="relative w-44">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#17181c] outline-none focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-[#687386]">
          <p>
            Showing {floors.length} of {totalCount} floors
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border border-[#d7d9e2] bg-white px-2.5 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="border border-[#d7d9e2] bg-white px-2.5 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="w-[100px] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Floor #
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Description
                  </th>
                  <th className="w-[140px] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Status
                  </th>
                  <th className="w-[90px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-3 font-medium text-[#3f4654]">Loading floor data...</p>
                    </td>
                  </tr>
                ) : floors.length > 0 ? (
                  floors.map((floor) => (
                    <tr
                      key={floor.id}
                      onClick={() => navigate(`/floors/${floor.id}`)}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open ${floor.name}`}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-bold text-primary">
                        Floor {floor.floorNumber}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        <Link
                          to={`/floors/${floor.id}`}
                          className="text-[#17181c] hover:text-primary hover:underline"
                        >
                          {floor.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-[#596174]">
                        {floor.description || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={floor.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, floor)}
                          disabled={deletingId === floor.id}
                          className="p-1 text-[#687386] hover:text-red-600 disabled:opacity-50"
                          title="Delete floor"
                        >
                          {deletingId === floor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <Layers3 className="mx-auto h-8 w-8 text-[#89909f]" />
                      <p className="mt-3 font-medium text-[#3f4654]">No floors found</p>
                      <p className="mt-1 text-sm text-[#7b8190]">
                        Try changing your search keywords or status filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {createOpen && (
        <FloorFormDialog
          title="Create Floor"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  )
}

export function FloorFormDialog({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  initial?: FloorFormData
  onClose: () => void
  onSubmit: (data: FloorFormData) => void
}) {
  const [data, setData] = useState<FloorFormData>(
    initial || {
      name: '',
      floorNumber: 1,
      description: null,
      status: 'ACTIVE',
    },
  )
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setSubmitting(false)
    }
  }

  const input =
    'mt-1.5 h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none focus:border-primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4">
      <section className="w-full max-w-lg bg-white shadow-xl">
        <header className="flex justify-between border-b p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-[#687386] hover:text-[#17181c]">
            <X className="h-4 w-4" />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block text-sm font-medium text-[#3f4654]">
            Floor Number
            <input
              type="number"
              required
              min={-5}
              max={100}
              value={data.floorNumber}
              onChange={(event) =>
                setData({ ...data, floorNumber: parseInt(event.target.value, 10) || 0 })
              }
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-[#3f4654]">
            Floor Name
            <input
              required
              maxLength={100}
              value={data.name}
              onChange={(event) => setData({ ...data, name: event.target.value })}
              placeholder="e.g. Floor 1 - Main Reading Hall"
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-[#3f4654]">
            Description
            <textarea
              maxLength={500}
              value={data.description || ''}
              onChange={(event) =>
                setData({ ...data, description: event.target.value || null })
              }
              placeholder="Notes about this floor..."
              className={`${input} h-20 py-2`}
            />
          </label>
          <label className="block text-sm font-medium text-[#3f4654]">
            Status
            <select
              value={data.status}
              onChange={(event) => setData({ ...data, status: event.target.value as FloorStatus })}
              className={input}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </label>
          <footer className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-[#d9f7e7] text-[#087443]',
    INACTIVE: 'bg-[#eef0f3] text-[#596174]',
    MAINTENANCE: 'bg-[#fff0d8] text-[#a65000]',
  }

  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    MAINTENANCE: 'Maintenance',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        styles[status] || styles.INACTIVE
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  )
}

export default FloorList
