import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Search,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react'

import { aisleApi } from '@/features/aisles/api/aisleApi'
import type { AisleRecord, AisleWriteRequest } from '@/features/aisles/types/aisle'
import { floorApi } from '@/features/floors/api/floorApi'
import type { FloorOptionRecord } from '@/features/floors/types/floor'
import type { AisleStatus } from '@/types/enums'
import { getErrorMessage } from '@/services/http/error'

export type AisleFormData = AisleWriteRequest

function AisleDetail() {
  const { id } = useParams<{ id: string }>()

  if (id) {
    return <AisleDetailView id={id} />
  }

  return <AisleList />
}

function AisleList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [floorId, setFloorId] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)

  const [aisles, setAisles] = useState<AisleRecord[]>([])
  const [floors, setFloors] = useState<FloorOptionRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  const [isLoading, setIsLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load floors for dropdown filter
  useEffect(() => {
    floorApi
      .getAllOptions()
      .then((data) => setFloors(data))
      .catch(() => {})
  }, [])

  const loadAisles = async () => {
    setIsLoading(true)
    setErrorNotice(null)
    try {
      const data = await aisleApi.getAisles({
        page,
        pageSize,
        searchTerm: search.trim() || undefined,
        floorId: floorId === 'ALL' ? undefined : floorId,
        status: status === 'ALL' ? undefined : status,
        sortBy: 'name',
        sortOrder: 'asc',
        expand: 'floor,shelves',
      })
      setAisles(data.items)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
    } catch (err) {
      setErrorNotice(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAisles()
  }, [page, status, floorId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadAisles()
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('ALL')
    setFloorId('ALL')
    setPage(1)
  }

  const handleCreate = async (formData: AisleFormData) => {
    try {
      setActionNotice(null)
      await aisleApi.createAisle(formData)
      setCreateOpen(false)
      setActionNotice('Aisle created successfully!')
      setPage(1)
      loadAisles()
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleDelete = async (e: React.MouseEvent, aisle: AisleRecord) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete aisle "${aisle.name}"?`)) return

    setDeletingId(aisle.id)
    try {
      await aisleApi.deleteAisle(aisle.id)
      setActionNotice(`Aisle "${aisle.name}" deleted successfully!`)
      loadAisles()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const hasFilters = search !== '' || status !== 'ALL' || floorId !== 'ALL'

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Route className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Aisles</h1>
              <p className="mt-0.5 text-sm text-[#596174]">
                Manage library aisles and their corresponding floor locations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Aisle
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
              onClick={loadAisles}
              className="ml-auto flex items-center gap-1 font-semibold underline hover:no-underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by aisle name..."
              className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#7b8190] focus:border-primary"
            />
          </form>

          <SelectFilter
            value={floorId}
            onChange={(val) => {
              setFloorId(val)
              setPage(1)
            }}
            ariaLabel="Filter by floor"
          >
            <option value="ALL">All Floors</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name} (Floor {floor.floorNumber})
              </option>
            ))}
          </SelectFilter>

          <SelectFilter
            value={status}
            onChange={(val) => {
              setStatus(val)
              setPage(1)
            }}
            ariaLabel="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </SelectFilter>

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
            Showing {aisles.length} of {totalCount} aisles
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

        <div className="overflow-hidden border border-[#d9dce5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Aisle Name
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Floor
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Shelves Count
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
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-3 font-medium text-[#3f4654]">Loading aisles list...</p>
                    </td>
                  </tr>
                ) : aisles.length > 0 ? (
                  aisles.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/aisles/${item.id}`)}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open ${item.name}`}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc]"
                    >
                      <td className="px-4 py-4 font-medium text-primary hover:underline">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 text-[#596174]">
                        {item.floor ? (
                          <Link
                            to={`/floors/${item.floor.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#17181c] hover:text-primary hover:underline"
                          >
                            {item.floor.name} (Floor {item.floor.floorNumber})
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-4 text-[#596174]">
                        {item.shelves ? `${item.shelves.length} shelves` : '—'}
                      </td>
                      <td className="px-4 py-4 text-[#596174]">
                        {item.description || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item)}
                          disabled={deletingId === item.id}
                          className="p-1 text-[#687386] hover:text-red-600 disabled:opacity-50"
                          title="Delete aisle"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTable
                    colSpan={6}
                    title="No aisles found"
                    description="Try changing your filters or search keywords."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {createOpen && (
        <AisleFormDialog
          title="Create Aisle"
          floors={floors}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  )
}

function AisleDetailView({ id }: { id: string }) {
  const navigate = useNavigate()
  const [aisle, setAisle] = useState<AisleRecord | null>(null)
  const [floors, setFloors] = useState<FloorOptionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadAisle = async () => {
    setIsLoading(true)
    setErrorNotice(null)
    try {
      const data = await aisleApi.getAisleById(id, 'floor,shelves')
      setAisle(data)
    } catch (err) {
      setErrorNotice(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAisle()
    floorApi.getAllOptions().then(setFloors).catch(() => {})
  }, [id])

  const handleUpdate = async (formData: AisleFormData) => {
    try {
      const updated = await aisleApi.updateAisle(id, formData)
      setAisle((prev) => (prev ? { ...prev, ...updated } : updated))
      setEditing(false)
      loadAisle()
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!aisle) return
    if (!window.confirm(`Are you sure you want to delete aisle "${aisle.name}"?`)) return

    setDeleting(true)
    try {
      await aisleApi.deleteAisle(id)
      navigate('/aisles')
    } catch (err) {
      alert(getErrorMessage(err))
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-[#596174]">Loading aisle details...</p>
      </div>
    )
  }

  if (errorNotice || !aisle) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
        <div className="max-w-md rounded-md border border-[#fecaca] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Aisle Not Found</h1>
          </div>
          <p className="mt-2 text-sm text-[#596174]">
            {errorNotice || 'The requested aisle does not exist or has been deleted.'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={loadAisle}
              className="flex items-center gap-1.5 border border-[#d7d9e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#3f4654] hover:bg-[#f1eff5]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
            <Link to="/aisles" className="text-xs font-semibold text-primary hover:underline">
              ← Back to aisles list
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const floor = aisle.floor
  const shelves = aisle.shelves || []

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <Link
        to="/aisles"
        className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Aisles List
      </Link>

      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Route className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {floor ? `${floor.name} (Floor ${floor.floorNumber})` : 'Aisle'}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{aisle.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f1eff5]"
          >
            <Pencil className="h-4 w-4" />
            Edit Aisle
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-10 items-center gap-2 border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Aisle
          </button>
        </div>
      </header>

      {/* Details Section */}
      <section className="mt-8 max-w-3xl overflow-hidden border border-[#d9dce5] bg-white shadow-sm">
        <dl className="divide-y divide-[#d9dce5]">
          <DetailRow label="ID (GUID)" value={aisle.id} mono />
          <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-[#687386]">Floor</dt>
            <dd>
              {floor ? (
                <Link
                  to={`/floors/${floor.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {floor.name} (Floor #{floor.floorNumber})
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <DetailRow label="Aisle Name" value={aisle.name} />
          <DetailRow label="Description" value={aisle.description || '—'} />
          <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-[#687386]">Status</dt>
            <dd>
              <StatusBadge status={aisle.status} />
            </dd>
          </div>
        </dl>
      </section>

      {/* Shelves List */}
      <section className="mt-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Shelves</h2>
              <p className="mt-0.5 text-sm text-[#687386]">
                {shelves.length} shelf/shelves assigned to this aisle.
              </p>
            </div>
          </div>
          <Link
            to="/shelves"
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Manage Shelves
          </Link>
        </div>

        <div className="mt-4 overflow-hidden border border-[#d9dce5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Shelf Name
                  </th>
                  <th className="w-[120px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {shelves.length > 0 ? (
                  shelves.map((shelf) => (
                    <tr
                      key={shelf.id}
                      onClick={() => navigate(`/shelves/${shelf.id}`)}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc]"
                    >
                      <td className="px-4 py-4 font-medium text-primary hover:underline">
                        {shelf.name}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/shelves/${shelf.id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View details →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTable
                    colSpan={2}
                    title="No shelves found"
                    description="No shelves currently assigned to this aisle."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {editing && (
        <AisleFormDialog
          title="Update Aisle"
          floors={floors}
          initial={{
            floorId: aisle.floorId,
            name: aisle.name,
            description: aisle.description,
            status: aisle.status,
          }}
          onClose={() => setEditing(false)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  )
}

function AisleFormDialog({
  title,
  floors,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  floors: FloorOptionRecord[]
  initial?: AisleFormData
  onClose: () => void
  onSubmit: (data: AisleFormData) => void
}) {
  const [form, setForm] = useState<AisleFormData>(
    initial || {
      floorId: floors[0]?.id || '',
      name: '',
      description: null,
      status: 'ACTIVE',
    },
  )
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.floorId) {
      alert('Please select a floor for the aisle!')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  const input =
    'mt-1.5 h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none focus:border-primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4">
      <section className="w-full max-w-lg border border-[#d9dce5] bg-white shadow-xl">
        <header className="flex justify-between border-b border-[#e4e6eb] p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-[#687386] hover:text-[#17181c]">
            <X className="h-4 w-4" />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block text-sm font-medium text-[#3f4654]">
            Floor
            <select
              required
              value={form.floorId}
              onChange={(event) => setForm({ ...form, floorId: event.target.value })}
              className={input}
            >
              <option value="" disabled>
                -- Select Floor --
              </option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name} (Floor {floor.floorNumber})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-[#3f4654]">
            Aisle Name
            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Aisle A1 - Science Books"
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-[#3f4654]">
            Description
            <textarea
              maxLength={500}
              value={form.description || ''}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value || null })
              }
              placeholder="Notes about this aisle..."
              className={`${input} h-20 py-2`}
            />
          </label>
          <label className="block text-sm font-medium text-[#3f4654]">
            Status
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as AisleStatus })}
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

function SelectFilter({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <div className="relative w-44">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm outline-none focus:border-primary"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
      <dt className="text-[#687386]">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-[#3f4654]' : 'text-[#17181c]'}>{value}</dd>
    </div>
  )
}

function EmptyTable({
  colSpan,
  title,
  description,
}: {
  colSpan: number
  title: string
  description: string
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center">
        <Route className="mx-auto h-8 w-8 text-[#89909f]" />
        <p className="mt-3 font-medium text-[#3f4654]">{title}</p>
        <p className="mt-1 text-sm text-[#7b8190]">{description}</p>
      </td>
    </tr>
  )
}

function StatusBadge({ status }: { status: string }) {
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

export default AisleDetail
