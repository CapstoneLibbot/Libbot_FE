import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Layers,
  LibraryBig,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { shelfApi } from '@/features/shelves/api/shelfApi'
import { aisleApi } from '@/features/aisles/api/aisleApi'
import { httpClient } from '@/services/http/client'
import type {
  EndpointOptionRecord,
  ShelfLevelRecord,
  ShelfLevelWriteRequest,
  ShelfRecord,
  ShelfWriteRequest,
} from '@/features/shelves/types/shelf'
import type { AisleOptionRecord } from '@/features/aisles/types/aisle'
import type { PaginatedData } from '@/types/api'
import type { ShelfLevelStatus, ShelfStatus } from '@/types/enums'
import { getErrorMessage } from '@/services/http/error'

interface LevelBookItem {
  id: string
  bookId: string
  barcode: string
  status: string
  lastInventoryAtUtc: string | null
  expectedShelfLevelId: string | null
  currentShelfLevelId: string | null
}

export default function ShelfDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [shelf, setShelf] = useState<ShelfRecord | null>(null)
  const [levels, setLevels] = useState<ShelfLevelRecord[]>([])
  const [aisles, setAisles] = useState<AisleOptionRecord[]>([])
  const [endpoints, setEndpoints] = useState<EndpointOptionRecord[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Dialog states
  const [isShelfEditorOpen, setIsShelfEditorOpen] = useState(false)
  const [shelfFormError, setShelfFormError] = useState('')
  const [shelfSaving, setShelfSaving] = useState(false)

  const [editingLevel, setEditingLevel] = useState<ShelfLevelRecord | null | 'CREATE'>(null)
  const [levelFormError, setLevelFormError] = useState('')
  const [levelSaving, setLevelSaving] = useState(false)
  const [deletingLevelId, setDeletingLevelId] = useState('')

  const [selectedLevelForBooks, setSelectedLevelForBooks] = useState<ShelfLevelRecord | null>(null)

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [shelfData, levelData, aisleList, endpointList] = await Promise.all([
        shelfApi.getShelfById(id, 'aisle,levels,endpoints'),
        shelfApi.getLevelsByShelfId(id, 'asc'),
        aisleApi.getAllOptions().catch(() => [] as AisleOptionRecord[]),
        shelfApi.getEndpoints().catch(() => [] as EndpointOptionRecord[]),
      ])

      setShelf(shelfData)
      setLevels(levelData.items || [])
      setAisles(aisleList)
      setEndpoints(endpointList)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleUpdateShelf(payload: ShelfWriteRequest) {
    if (!shelf) return
    setShelfSaving(true)
    setShelfFormError('')
    try {
      const updated = await shelfApi.updateShelf(shelf.id, payload)
      setShelf(updated)
      setIsShelfEditorOpen(false)
    } catch (err) {
      setShelfFormError(getErrorMessage(err))
    } finally {
      setShelfSaving(false)
    }
  }

  async function handleDeleteShelf() {
    if (!shelf) return
    if (!window.confirm(`Are you sure you want to delete shelf "${shelf.name}"?`)) return
    try {
      await shelfApi.deleteShelf(shelf.id)
      navigate('/shelves')
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  async function handleSaveLevel(levelNumber: number, name: string, status: ShelfLevelStatus) {
    if (!shelf) return
    setLevelSaving(true)
    setLevelFormError('')
    try {
      const payload: ShelfLevelWriteRequest = {
        shelfId: shelf.id,
        levelNumber,
        name: name.trim() || `Level ${levelNumber}`,
        status,
      }

      if (editingLevel === 'CREATE') {
        const created = await shelfApi.createLevel(shelf.id, payload)
        setLevels((prev) => [...prev, created].sort((a, b) => a.levelNumber - b.levelNumber))
      } else if (editingLevel) {
        const updated = await shelfApi.updateLevel(editingLevel.id, payload)
        setLevels((prev) =>
          prev.map((lvl) => (lvl.id === updated.id ? updated : lvl)).sort((a, b) => a.levelNumber - b.levelNumber),
        )
      }
      setEditingLevel(null)
    } catch (err) {
      setLevelFormError(getErrorMessage(err))
    } finally {
      setLevelSaving(false)
    }
  }

  async function handleDeleteLevel(level: ShelfLevelRecord) {
    if (!window.confirm(`Are you sure you want to delete Level ${level.levelNumber} (${level.name})?`)) return
    setDeletingLevelId(level.id)
    try {
      await shelfApi.deleteLevel(level.id)
      setLevels((prev) => prev.filter((item) => item.id !== level.id))
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setDeletingLevelId('')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-[#f9f7fd]">
        <div className="flex items-center gap-2 text-sm text-[#687386]">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Loading shelf details...</span>
        </div>
      </div>
    )
  }

  if (error || !shelf) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
        <Link to="/shelves" className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to shelves list
        </Link>
        <div className="mt-6 max-w-xl border border-[#efc7c4] bg-[#fff1f0] p-5 text-[#a12820]">
          <h2 className="text-base font-semibold">Shelf Not Found</h2>
          <p className="mt-1 text-sm">{error || 'The requested shelf does not exist or has been deleted.'}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    )
  }

  const startEp = endpoints.find((e) => e.id === shelf.startEndpointId)
  const endEp = endpoints.find((e) => e.id === shelf.endEndpointId)
  const activeLevelsCount = levels.filter((l) => l.status === 'ACTIVE').length

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1180px] space-y-6">
        {/* Breadcrumb */}
        <Link to="/shelves" className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Shelves List
        </Link>

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LibraryBig className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#687386]">Library Shelf</p>
              <h1 className="text-2xl font-bold tracking-tight">{shelf.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShelfEditorOpen(true)}
              className="inline-flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f1eff5]"
            >
              <Pencil className="h-4 w-4" />
              Edit Shelf
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteShelf()}
              className="inline-flex h-10 items-center gap-2 border border-[#efc7c4] bg-[#fff1f0] px-3 text-sm font-medium text-[#a12820] hover:bg-[#fee2e2]"
              title="Delete this shelf"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-4 sm:grid-cols-3" aria-label="Shelf stats">
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Total Levels</p>
            <p className="mt-1 text-2xl font-semibold">{levels.length}</p>
          </div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Active Levels</p>
            <p className="mt-1 text-2xl font-semibold text-[#087443]">{activeLevelsCount}</p>
          </div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Shelf Status</p>
            <div className="mt-1">
              <ShelfStatusBadge status={shelf.status} />
            </div>
          </div>
        </section>

        {/* Shelf Details Card */}
        <section className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="border-b border-[#ececf1] bg-[#faf9fc] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#2b303b]">Shelf Details</h2>
          </div>
          <dl className="divide-y divide-[#ececf1] text-sm">
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Identifier (ID)</dt>
              <dd className="font-mono text-xs text-[#484f60]">{shelf.id}</dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Aisle</dt>
              <dd>
                <Link
                  to={`/aisles/${shelf.aisleId}`}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {shelf.aisle?.name || 'Aisle Details'}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Start Endpoint</dt>
              <dd className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span>
                  {startEp ? `${startEp.name} (${startEp.endpointType})` : shelf.startEndpointId}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">End Endpoint</dt>
              <dd className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span>
                  {endEp ? `${endEp.name} (${endEp.endpointType})` : shelf.endEndpointId}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Description</dt>
              <dd className="text-[#596174]">{shelf.description || '—'}</dd>
            </div>
          </dl>
        </section>

        {/* Shelf Levels Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Shelf Levels</h2>
                <p className="text-xs text-[#687386]">Manage book placement locations by level number</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLevelFormError('')
                setEditingLevel('CREATE')
              }}
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Shelf Level
            </button>
          </div>

          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]">
                    <th className="px-5 py-3">Level #</th>
                    <th className="px-5 py-3">Display Name</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Books on Level</th>
                    <th className="w-28 px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.length > 0 ? (
                    levels.map((level) => (
                      <tr
                        key={level.id}
                        className="border-b border-[#ececf1] last:border-b-0 hover:bg-[#faf9fc]"
                      >
                        <td className="px-5 py-4 font-semibold text-primary">
                          Level {level.levelNumber}
                        </td>
                        <td className="px-5 py-4 font-medium">{level.name || `Level ${level.levelNumber}`}</td>
                        <td className="px-5 py-4">
                          <ShelfLevelStatusBadge status={level.status} />
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedLevelForBooks(level)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            View books on level
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setLevelFormError('')
                                setEditingLevel(level)
                              }}
                              aria-label={`Edit level ${level.levelNumber}`}
                              title={`Edit level ${level.levelNumber}`}
                              className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteLevel(level)}
                              disabled={deletingLevelId === level.id}
                              aria-label={`Delete level ${level.levelNumber}`}
                              title={`Delete level ${level.levelNumber}`}
                              className="flex h-8 w-8 items-center justify-center text-[#8d4a46] hover:bg-[#fff1f0] hover:text-[#b42318] disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#687386]">
                        <BookOpen className="mx-auto h-8 w-8 text-[#89909f]" />
                        <p className="mt-2 font-medium text-[#3f4654]">No shelf levels found</p>
                        <p className="mt-0.5 text-xs text-[#7b8190]">
                          This shelf does not have any levels configured yet. Click &quot;Add Shelf Level&quot; to begin.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Edit Shelf Modal */}
      {isShelfEditorOpen && (
        <ShelfEditDialog
          shelf={shelf}
          aisles={aisles}
          endpoints={endpoints}
          saving={shelfSaving}
          errorMessage={shelfFormError}
          onClose={() => setIsShelfEditorOpen(false)}
          onSubmit={handleUpdateShelf}
        />
      )}

      {/* Create / Edit Shelf Level Modal */}
      {editingLevel !== null && (
        <ShelfLevelFormDialog
          level={editingLevel === 'CREATE' ? undefined : editingLevel}
          defaultLevelNumber={
            editingLevel === 'CREATE'
              ? Math.max(0, ...levels.map((l) => l.levelNumber)) + 1
              : editingLevel.levelNumber
          }
          saving={levelSaving}
          errorMessage={levelFormError}
          onClose={() => setEditingLevel(null)}
          onSubmit={handleSaveLevel}
        />
      )}

      {/* View Books On Shelf Level Dialog */}
      {selectedLevelForBooks && (
        <ShelfLevelBooksDialog
          level={selectedLevelForBooks}
          onClose={() => setSelectedLevelForBooks(null)}
        />
      )}
    </div>
  )
}

function ShelfStatusBadge({ status }: { status: string }) {
  const norm = status.toUpperCase()
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
        styles[norm] || 'bg-gray-100 text-gray-700'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[norm] || status}
    </span>
  )
}

function ShelfLevelStatusBadge({ status }: { status: ShelfLevelStatus }) {
  const styles = {
    ACTIVE: 'bg-[#d9f7e7] text-[#087443]',
    INACTIVE: 'bg-[#eef0f3] text-[#596174]',
    MAINTENANCE: 'bg-[#fff0d8] text-[#a65000]',
  }
  const labels = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    MAINTENANCE: 'Maintenance',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        styles[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  )
}

interface ShelfEditDialogProps {
  shelf: ShelfRecord
  aisles: AisleOptionRecord[]
  endpoints: EndpointOptionRecord[]
  saving: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: (payload: ShelfWriteRequest) => Promise<void>
}

function ShelfEditDialog({
  shelf,
  aisles,
  endpoints,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: ShelfEditDialogProps) {
  const [name, setName] = useState(shelf.name)
  const [aisleId, setAisleId] = useState(shelf.aisleId)
  const [startEndpointId, setStartEndpointId] = useState(shelf.startEndpointId)
  const [endEndpointId, setEndEndpointId] = useState(shelf.endEndpointId)
  const [description, setDescription] = useState(shelf.description ?? '')
  const [status, setStatus] = useState<ShelfStatus>(shelf.status)

  const inputClass =
    'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none focus:border-primary'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void onSubmit({
      name: name.trim(),
      aisleId,
      startEndpointId,
      endEndpointId,
      description: description.trim() || null,
      status,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-edit-title"
        className="w-full max-w-xl border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="shelf-edit-title" className="text-lg font-semibold">
              Update Shelf
            </h2>
            <p className="text-xs text-[#687386]">Shelf ID: {shelf.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
              Shelf Name <span className="text-[#b42318]">*</span>
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Aisle <span className="text-[#b42318]">*</span>
              <select
                required
                value={aisleId}
                onChange={(e) => setAisleId(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                {aisles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Operational Status <span className="text-[#b42318]">*</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShelfStatus)}
                className={`${inputClass} appearance-none`}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Start Endpoint <span className="text-[#b42318]">*</span>
              <select
                required
                value={startEndpointId}
                onChange={(e) => setStartEndpointId(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                {endpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.name} ({ep.endpointType})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              End Endpoint <span className="text-[#b42318]">*</span>
              <select
                required
                value={endEndpointId}
                onChange={(e) => setEndEndpointId(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                {endpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.name} ({ep.endpointType})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
              Description
              <textarea
                maxLength={500}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#d7d9e2] bg-white p-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          {errorMessage && (
            <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">
              {errorMessage}
            </p>
          )}

          <footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

interface ShelfLevelFormDialogProps {
  level?: ShelfLevelRecord
  defaultLevelNumber: number
  saving: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: (levelNumber: number, name: string, status: ShelfLevelStatus) => Promise<void>
}

function ShelfLevelFormDialog({
  level,
  defaultLevelNumber,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: ShelfLevelFormDialogProps) {
  const [levelNumber, setLevelNumber] = useState<number>(level?.levelNumber ?? defaultLevelNumber)
  const [name, setName] = useState(level?.name ?? `Level ${level?.levelNumber ?? defaultLevelNumber}`)
  const [status, setStatus] = useState<ShelfLevelStatus>(level?.status ?? 'ACTIVE')

  const inputClass =
    'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none focus:border-primary'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void onSubmit(levelNumber, name, status)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-level-modal-title"
        className="w-full max-w-md border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="shelf-level-modal-title" className="text-lg font-semibold">
              {level ? `Update Level ${level.levelNumber}` : 'Add New Shelf Level'}
            </h2>
            <p className="text-xs text-[#687386]">
              {level ? `ID: ${level.id}` : 'Level number must be a unique positive integer on this shelf'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <label className="block space-y-1.5 text-sm font-medium">
            Level Number <span className="text-[#b42318]">*</span>
            <input
              required
              type="number"
              min={1}
              value={levelNumber}
              onChange={(e) => {
                const num = Number(e.target.value)
                setLevelNumber(num)
                if (!level) setName(`Level ${num}`)
              }}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Display Name
            <input
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Level 1 - Computer Science"
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Operational Status <span className="text-[#b42318]">*</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ShelfLevelStatus)}
              className={`${inputClass} appearance-none`}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </label>

          {errorMessage && (
            <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">
              {errorMessage}
            </p>
          )}

          <footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : level ? 'Save changes' : 'Add Level'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ShelfLevelBooksDialog({
  level,
  onClose,
}: {
  level: ShelfLevelRecord
  onClose: () => void
}) {
  const [items, setItems] = useState<LevelBookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadBooks() {
      setLoading(true)
      setError('')
      try {
        const res = await httpClient.get<PaginatedData<LevelBookItem>>('/book-items', {
          params: { shelfLevelId: level.id },
        })
        setItems(res.items || [])
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    void loadBooks()
  }, [level.id])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-level-books-title"
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="shelf-level-books-title" className="text-lg font-semibold">
              Level {level.levelNumber}: {level.name || `Level ${level.levelNumber}`}
            </h2>
            <p className="text-xs text-[#687386]">
              Physical book copies currently located on this shelf level
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-auto p-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-[#687386]">Loading books on level...</span>
            </div>
          ) : error ? (
            <div className="border border-[#efc7c4] bg-[#fff1f0] p-4 text-sm text-[#a12820]">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-[#687386]">
              <BookOpen className="mx-auto h-8 w-8 text-[#89909f]" />
              <p className="mt-2 text-sm font-medium">No book copies are currently assigned to this level.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#d9dce5]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]">
                  <tr className="border-b border-[#d9dce5]">
                    <th className="px-4 py-3">Barcode</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Inventory</th>
                    <th className="px-4 py-3">Placement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececf1]">
                  {items.map((item) => {
                    const isMatched = item.expectedShelfLevelId === item.currentShelfLevelId
                    return (
                      <tr key={item.id} className="hover:bg-[#faf9fc]">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{item.barcode}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-[#f0eff5] px-2 py-0.5 text-xs font-medium text-[#484f60]">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#596174]">
                          {item.lastInventoryAtUtc ? (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.lastInventoryAtUtc).toLocaleDateString()}
                            </span>
                          ) : (
                            'Not yet surveyed'
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {isMatched ? (
                            <span className="inline-flex items-center gap-1 text-[#087443]">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Correct location
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#a65000]">
                              <MapPin className="h-3.5 w-3.5" /> Misplaced location
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
