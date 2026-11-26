import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  BookOpen,
  Eye,
  ExternalLink,
  LibraryBig,
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
import { bookApi } from '@/features/books/api/bookApi'
import { bookItemApi } from '@/features/book-items/api/bookItemApi'
import { groupBookItemsByShelfLevel } from '@/features/book-items/utils/shelfLevelItems'
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

type BookItemStatusGroup = 'available' | 'misplaced' | 'missing' | 'other'
const EMPTY_LEVEL_BOOK_ITEMS: LevelBookItem[] = []

function getBookItemStatusGroup(status: string): BookItemStatusGroup {
  switch (status.trim().toUpperCase()) {
    case 'AVAILABLE':
      return 'available'
    case 'MISPLACED':
      return 'misplaced'
    case 'MISSING':
      return 'missing'
    default:
      return 'other'
  }
}

function getBookItemStatusLabel(status: string): string {
  const normalizedStatus = status.trim().toUpperCase()
  const labels: Record<string, string> = {
    AVAILABLE: 'Có sẵn',
    MISPLACED: 'Sai vị trí',
    MISSING: 'Không tìm thấy',
    DAMAGED: 'Hư hỏng',
    BORROWED: 'Đang mượn',
  }
  return labels[normalizedStatus] || status
}

function formatLastInventoryAtUtc(value: string | null): string {
  if (!value) return 'Chưa kiểm kê'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

async function getAllBookItems(): Promise<LevelBookItem[]> {
  const pageSize = 100
  const firstPage = await httpClient.get<PaginatedData<LevelBookItem> | LevelBookItem[]>('/books/items', {
    params: { page: 1, pageSize },
  })
  if (Array.isArray(firstPage)) return firstPage

  const items = [...(firstPage.items || [])]
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const response = await httpClient.get<PaginatedData<LevelBookItem> | LevelBookItem[]>('/books/items', {
      params: { page, pageSize },
    })
    items.push(...(Array.isArray(response) ? response : response.items || []))
  }
  return items
}

export default function ShelfDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [shelf, setShelf] = useState<ShelfRecord | null>(null)
  const [levels, setLevels] = useState<ShelfLevelRecord[]>([])
  const [allShelfLevels, setAllShelfLevels] = useState<ShelfLevelRecord[]>([])
  const [allShelves, setAllShelves] = useState<ShelfRecord[]>([])
  const [aisles, setAisles] = useState<AisleOptionRecord[]>([])
  const [endpoints, setEndpoints] = useState<EndpointOptionRecord[]>([])
  const [levelBookItems, setLevelBookItems] = useState<Record<string, LevelBookItem[]>>({})
  const [levelBookLoading, setLevelBookLoading] = useState<Record<string, boolean>>({})
  const [levelBookErrors, setLevelBookErrors] = useState<Record<string, string>>({})

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
      const [shelfData, levelData, aisleList, endpointList, shelfList, allLevelData] = await Promise.all([
        shelfApi.getShelfById(id, 'aisle,levels,endpoints'),
        shelfApi.getLevelsByShelfId(id, 'asc'),
        aisleApi
          .getAisles({ page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' })
          .then((result) => result.items)
          .catch(() => [] as AisleOptionRecord[]),
        shelfApi.getEndpoints().catch(() => [] as EndpointOptionRecord[]),
        shelfApi.getShelves({ page: 1, pageSize: 100, expand: 'aisle' })
          .then((result) => result.items)
          .catch(() => [] as ShelfRecord[]),
        shelfApi.getShelfLevels({ page: 1, pageSize: 100, sortBy: 'levelNumber', sortOrder: 'asc' })
          .then((result) => result.items)
          .catch(() => [] as ShelfLevelRecord[]),
      ])

      setShelf(shelfData)
      setLevels(levelData.items || [])
      setAisles(aisleList)
      setEndpoints(endpointList)
      setAllShelves(shelfList)
      setAllShelfLevels(allLevelData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    let active = true
    const levelIds = levels.map((level) => level.id)
    setLevelBookItems({})
    setLevelBookErrors({})
    setLevelBookLoading(Object.fromEntries(levelIds.map((levelId) => [levelId, true])))

    if (!levelIds.length) {
      return () => {
        active = false
      }
    }

    void getAllBookItems()
      .then((items) => {
        if (!active) return
        setLevelBookItems(groupBookItemsByShelfLevel(items, levelIds))
      })
      .catch((err) => {
        if (!active) return
        const message = getErrorMessage(err)
        setLevelBookErrors(Object.fromEntries(levelIds.map((levelId) => [levelId, message])))
      })
      .finally(() => {
        if (active) setLevelBookLoading({})
      })

    return () => {
      active = false
    }
  }, [levels])

  async function reloadBooksOnLevel(levelId: string) {
    setLevelBookLoading((current) => ({ ...current, [levelId]: true }))
    setLevelBookErrors((current) => ({ ...current, [levelId]: '' }))
    try {
      const allItems = await getAllBookItems()
      const items = groupBookItemsByShelfLevel(allItems, [levelId])[levelId]
      setLevelBookItems((current) => ({ ...current, [levelId]: items }))
      setLevelBookErrors((current) => {
        const next = { ...current }
        delete next[levelId]
        return next
      })
    } catch (err) {
      setLevelBookErrors((current) => ({ ...current, [levelId]: getErrorMessage(err) }))
    } finally {
      setLevelBookLoading((current) => ({ ...current, [levelId]: false }))
    }
  }

  function handleBookItemUpdated(updatedItem: LevelBookItem) {
    setLevelBookItems((current) => {
      const next = Object.fromEntries(
        Object.entries(current).map(([levelId, items]) => [
          levelId,
          items.filter((item) => item.id !== updatedItem.id),
        ]),
      ) as Record<string, LevelBookItem[]>

      const matchingLevelIds = new Set(
        [updatedItem.currentShelfLevelId, updatedItem.expectedShelfLevelId].filter(
          (levelId): levelId is string => levelId !== null,
        ),
      )
      matchingLevelIds.forEach((levelId) => {
        if (next[levelId]) next[levelId].push(updatedItem)
      })

      return next
    })
  }

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
    if (!window.confirm(`Bạn có chắc muốn xóa kệ "${shelf.name}" không?`)) return
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
        name: name.trim() || `Tầng ${levelNumber}`,
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
    if (!window.confirm(`Bạn có chắc muốn xóa tầng ${level.levelNumber} (${level.name}) không?`)) return
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
          <span>Đang tải thông tin kệ...</span>
        </div>
      </div>
    )
  }

  if (error || !shelf) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <div className="mt-6 max-w-xl border border-[#efc7c4] bg-[#fff1f0] p-5 text-[#a12820]">
          <h2 className="text-base font-semibold">Không tìm thấy kệ</h2>
          <p className="mt-1 text-sm">{error || 'Kệ yêu cầu không tồn tại hoặc đã bị xóa.'}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline"
          >
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      </div>
    )
  }

  const startEp = endpoints.find((e) => e.id === shelf.startEndpointId)
  const endEp = endpoints.find((e) => e.id === shelf.endEndpointId)
  const aisleName = shelf.aisle?.name || aisles.find((aisle) => aisle.id === shelf.aisleId)?.name
  const activeLevelsCount = levels.filter((l) => l.status.toUpperCase() === 'ACTIVE').length

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1180px] space-y-6">
        {/* Breadcrumb */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LibraryBig className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#687386]">Kệ thư viện</p>
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
              Sửa kệ
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteShelf()}
              className="inline-flex h-10 items-center gap-2 border border-[#efc7c4] bg-[#fff1f0] px-3 text-sm font-medium text-[#a12820] hover:bg-[#fee2e2]"
              title="Xóa kệ này"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-4 sm:grid-cols-3" aria-label="Thống kê kệ">
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Tổng số tầng kệ</p>
            <p className="mt-1 text-2xl font-semibold">{levels.length}</p>
          </div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Tầng kệ đang hoạt động</p>
            <p className="mt-1 text-2xl font-semibold text-[#087443]">{activeLevelsCount}</p>
          </div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Trạng thái kệ</p>
            <div className="mt-1">
              <ShelfStatusBadge status={shelf.status} />
            </div>
          </div>
        </section>

        {/* Shelf Details Card */}
        <section className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="border-b border-[#ececf1] bg-[#faf9fc] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#2b303b]">Thông tin kệ</h2>
          </div>
          <dl className="divide-y divide-[#ececf1] text-sm">
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Mã định danh</dt>
              <dd className="font-mono text-xs text-[#484f60]">{shelf.id}</dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Dãy sách</dt>
              <dd>
                <Link
                  to={`/aisles/${shelf.aisleId}`}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {aisleName || 'Dãy sách'}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Điểm bắt đầu</dt>
              <dd className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span>
                  {startEp ? `${startEp.name} (${startEp.endpointType})` : shelf.startEndpointId}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Điểm kết thúc</dt>
              <dd className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span>
                  {endEp ? `${endEp.name} (${endEp.endpointType})` : shelf.endEndpointId}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[#687386]">Mô tả</dt>
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
                <h2 className="text-lg font-semibold">Các tầng kệ</h2>
                <p className="text-xs text-[#687386]">Quản lý vị trí đặt sách theo từng tầng kệ</p>
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
              Thêm tầng kệ
            </button>
          </div>

          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]">
                    <th className="px-5 py-3">Tầng kệ số</th>
                    <th className="px-5 py-3">Tên hiển thị</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Sách trên tầng kệ</th>
                    <th className="w-28 px-5 py-3 text-right">Thao tác</th>
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
                          Tầng {level.levelNumber}
                        </td>
                        <td className="px-5 py-4 font-medium">{level.name || `Tầng ${level.levelNumber}`}</td>
                        <td className="px-5 py-4">
                          <ShelfLevelStatusBadge status={level.status} />
                        </td>
                        <td className="px-5 py-4">
                          {levelBookLoading[level.id] ? (
                            <span role="status" className="text-xs text-[#687386]">
                              Đang tải...
                            </span>
                          ) : levelBookErrors[level.id] ? (
                            <div className="flex items-center gap-2 text-xs text-[#a12820]">
                              <span>Lỗi tải</span>
                              <button
                                type="button"
                                onClick={() => void reloadBooksOnLevel(level.id)}
                                className="font-semibold underline"
                              >
                                Thử lại
                              </button>
                            </div>
                          ) : (
                            <LevelBookStats
                              items={levelBookItems[level.id] ?? []}
                              onView={() => setSelectedLevelForBooks(level)}
                            />
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setLevelFormError('')
                                setEditingLevel(level)
                              }}
                              aria-label={`Sửa tầng ${level.levelNumber}`}
                              title={`Sửa tầng ${level.levelNumber}`}
                              className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteLevel(level)}
                              disabled={deletingLevelId === level.id}
                              aria-label={`Xóa tầng ${level.levelNumber}`}
                              title={`Xóa tầng ${level.levelNumber}`}
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
                        <p className="mt-2 font-medium text-[#3f4654]">Chưa có tầng kệ nào</p>
                        <p className="mt-0.5 text-xs text-[#7b8190]">
                          Kệ này chưa được thiết lập tầng. Nhấn &quot;Thêm tầng kệ&quot; để bắt đầu.
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
          items={levelBookItems[selectedLevelForBooks.id] ?? EMPTY_LEVEL_BOOK_ITEMS}
          loading={Boolean(levelBookLoading[selectedLevelForBooks.id])}
          error={levelBookErrors[selectedLevelForBooks.id] || ''}
          onRetry={() => void reloadBooksOnLevel(selectedLevelForBooks.id)}
          shelfLevels={allShelfLevels}
          shelves={allShelves}
          onBookItemUpdated={handleBookItemUpdated}
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
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Ngừng hoạt động',
    MAINTENANCE: 'Đang bảo trì',
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
  const normalizedStatus = status.toUpperCase()
  const styles: Record<string, string> = {
    ACTIVE: 'bg-[#d9f7e7] text-[#087443]',
    INACTIVE: 'bg-[#eef0f3] text-[#596174]',
    MAINTENANCE: 'bg-[#fff0d8] text-[#a65000]',
  }
  const labels: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Ngừng hoạt động',
    MAINTENANCE: 'Đang bảo trì',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        styles[normalizedStatus] || 'bg-gray-100 text-gray-700'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[normalizedStatus] || status}
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
              Cập nhật kệ
            </h2>
            <p className="text-xs text-[#687386]">Mã kệ: {shelf.id}</p>
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
              Tên kệ <span className="text-[#b42318]">*</span>
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Dãy sách <span className="text-[#b42318]">*</span>
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
              Trạng thái hoạt động <span className="text-[#b42318]">*</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShelfStatus)}
                className={`${inputClass} appearance-none`}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
                <option value="MAINTENANCE">Đang bảo trì</option>
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Điểm bắt đầu <span className="text-[#b42318]">*</span>
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
              Điểm kết thúc <span className="text-[#b42318]">*</span>
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
              Mô tả
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
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
  const [name, setName] = useState(level?.name ?? `Tầng ${level?.levelNumber ?? defaultLevelNumber}`)
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
              {level ? `Cập nhật tầng ${level.levelNumber}` : 'Thêm tầng kệ'}
            </h2>
            <p className="text-xs text-[#687386]">
              {level ? `Mã: ${level.id}` : 'Số tầng phải là số nguyên dương và không trùng trong cùng một kệ'}
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
            Số tầng <span className="text-[#b42318]">*</span>
            <input
              required
              type="number"
              min={1}
              value={levelNumber}
              onChange={(e) => {
                const num = Number(e.target.value)
                setLevelNumber(num)
                if (!level) setName(`Tầng ${num}`)
              }}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Tên hiển thị
            <input
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Tầng 1 - Khoa học máy tính"
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Trạng thái hoạt động <span className="text-[#b42318]">*</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ShelfLevelStatus)}
              className={`${inputClass} appearance-none`}
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
              <option value="MAINTENANCE">Đang bảo trì</option>
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
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saving ? 'Đang lưu...' : level ? 'Lưu thay đổi' : 'Thêm tầng'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function LevelBookStats({
  items,
  onView,
}: {
  items: LevelBookItem[]
  onView: () => void
}) {
  const counts = items.reduce(
    (result, item) => {
      result[getBookItemStatusGroup(item.status)] += 1
      return result
    },
    { available: 0, misplaced: 0, missing: 0, other: 0 },
  )
  const total = items.length
  const alertCount = counts.misplaced + counts.missing
  const segments: { key: BookItemStatusGroup; count: number; color: string; label: string }[] = [
    { key: 'available', count: counts.available, color: 'bg-[#16a34a]', label: 'Có sẵn' },
    { key: 'misplaced', count: counts.misplaced, color: 'bg-[#eab308]', label: 'Sai vị trí' },
    { key: 'missing', count: counts.missing, color: 'bg-[#dc2626]', label: 'Không tìm thấy' },
    { key: 'other', count: counts.other, color: 'bg-[#94a3b8]', label: 'Khác' },
  ]

  return (
    <div className="flex min-w-[210px] items-center gap-3">
      <div className="relative min-w-0 flex-1">
        <div
          role="img"
          aria-label={`${total} bản sách: ${counts.available} có sẵn, ${counts.misplaced} sai vị trí, ${counts.missing} không tìm thấy${counts.other ? `, ${counts.other} trạng thái khác` : ''}`}
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#e8ebf0]"
        >
          {segments.map((segment) => (
            <span
              key={segment.key}
              title={`${segment.label}: ${segment.count}`}
              className={`h-full ${segment.color}`}
              style={{ width: total ? `${(segment.count / total) * 100}%` : '0%' }}
            />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-[#687386]">
          {total} bản · <span className="text-[#087443]">{counts.available} có sẵn</span>
          {' · '}<span className="text-[#a16207]">{counts.misplaced} sai vị trí</span>
          {' · '}<span className="text-[#b42318]">{counts.missing} không tìm thấy</span>
          {counts.other > 0 && ` · ${counts.other} khác`}
        </p>
        {alertCount > 0 && (
          <span
            role="status"
            aria-label={`${alertCount} bookitem cần chú ý: ${counts.misplaced} sai vị trí, ${counts.missing} không tìm thấy`}
            title={`${alertCount} bookitem cần chú ý`}
            className="absolute -right-1 -top-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold leading-none text-white shadow"
          >
            {alertCount}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onView}
        title="Xem chi tiết sách trên tầng"
        aria-label="Xem chi tiết sách trên tầng"
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
      >
        <Eye className="h-4 w-4" />
      </button>
    </div>
  )
}

function ShelfLevelBooksDialog({
  level,
  items,
  loading,
  error,
  onRetry,
  shelfLevels,
  shelves,
  onBookItemUpdated,
  onClose,
}: {
  level: ShelfLevelRecord
  items: LevelBookItem[]
  loading: boolean
  error: string
  onRetry: () => void
  shelfLevels: ShelfLevelRecord[]
  shelves: ShelfRecord[]
  onBookItemUpdated: (item: LevelBookItem) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [bookTitles, setBookTitles] = useState<Record<string, string>>({})
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState('')
  const [relocatingItemId, setRelocatingItemId] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const levelLookup = useMemo(
    () => new Map(shelfLevels.map((shelfLevel) => [shelfLevel.id, shelfLevel])),
    [shelfLevels],
  )
  const shelfNames = useMemo(
    () => new Map(shelves.map((shelf) => [shelf.id, shelf.name])),
    [shelves],
  )

  useEffect(() => {
    let active = true
    const bookIds = [...new Set(items.map((item) => item.bookId).filter(Boolean))]
    setBookTitles({})
    setBooksError('')

    if (loading || error || !bookIds.length) {
      setBooksLoading(false)
      return () => {
        active = false
      }
    }

    setBooksLoading(true)
    void Promise.allSettled(bookIds.map((bookId) => bookApi.getBookById(bookId))).then((results) => {
      if (!active) return
      const titles: Record<string, string> = {}
      const failedBookIds: string[] = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          titles[bookIds[index]] = result.value.title
        } else {
          failedBookIds.push(bookIds[index])
        }
      })
      setBookTitles(titles)
      if (failedBookIds.length) {
        setBooksError(`Không tải được thông tin tên của ${failedBookIds.length} sách.`)
      }
      setBooksLoading(false)
    })

    return () => {
      active = false
    }
  }, [error, items, loading])

  const getLocationName = (shelfLevelId: string | null) => {
    if (!shelfLevelId) return 'Chưa xác định'
    const shelfLevel = levelLookup.get(shelfLevelId)
    if (!shelfLevel) return 'Không xác định'
    const shelfName = shelfNames.get(shelfLevel.shelfId)
    const levelName = `Tầng ${shelfLevel.levelNumber}${shelfLevel.name ? ` (${shelfLevel.name})` : ''}`
    return shelfName ? `${shelfName} · ${levelName}` : levelName
  }

  async function handleRelocateBookItem(item: LevelBookItem) {
    if (!item.expectedShelfLevelId) {
      setActionError('Bản sách này chưa có vị trí mặc định để sửa.')
      return
    }

    setRelocatingItemId(item.id)
    setActionError('')
    setActionSuccess('')
    try {
      const updatedItem = await bookItemApi.updateBookItem(item.id, {
        bookId: item.bookId,
        barcode: item.barcode,
        expectedShelfLevelId: item.expectedShelfLevelId,
        currentShelfLevelId: item.expectedShelfLevelId,
        lastInventoryAtUtc: item.lastInventoryAtUtc,
        status: 'AVAILABLE',
      })
      onBookItemUpdated(updatedItem)
      setActionSuccess('Đã sửa vị trí của sách về đúng vị trí mặc định')
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setRelocatingItemId('')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-level-books-title"
        className="flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="shelf-level-books-title" className="text-lg font-semibold">
              Tầng {level.levelNumber}: {level.name || `Tầng ${level.levelNumber}`}
            </h2>
            <p className="text-xs text-[#687386]">Danh sách sách và vị trí trên tầng kệ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-auto p-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-[#687386]">Đang tải sách trên tầng kệ...</span>
            </div>
          ) : error ? (
            <div role="alert" className="flex items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] p-4 text-sm text-[#a12820]">
              <span>{error}</span>
              <button type="button" onClick={onRetry} className="shrink-0 font-semibold underline">
                Thử lại
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-[#687386]">
              <BookOpen className="mx-auto h-8 w-8 text-[#89909f]" />
              <p className="mt-2 text-sm font-medium">Hiện chưa có bản sách nào được gán cho tầng kệ này.</p>
            </div>
          ) : (
            <>
              {booksLoading && (
                <p role="status" className="mb-3 text-xs text-[#687386]">
                  Đang tải tên sách...
                </p>
              )}
              {booksError && (
                <p role="alert" className="mb-3 text-xs text-[#a12820]">
                  {booksError}
                </p>
              )}
              {actionError && (
                <p role="alert" className="mb-3 border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-xs text-[#a12820]">
                  {actionError}
                </p>
              )}
              {actionSuccess && (
                <p role="status" className="mb-3 border border-[#b8e3cc] bg-[#effaf3] px-3 py-2 text-xs text-[#087443]">
                  {actionSuccess}
                </p>
              )}
              <div className="overflow-x-auto border border-[#d9dce5]">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]">
                    <tr className="border-b border-[#d9dce5]">
                      <th className="px-4 py-3">Tên sách</th>
                      <th className="px-4 py-3">Mã QR bản thể</th>
                      <th className="px-4 py-3">Vị trí mặc định</th>
                      <th className="px-4 py-3">Vị trí hiện tại</th>
                      <th className="px-4 py-3">Kiểm kê gần nhất</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececf1]">
                    {items.map((item) => {
                      const statusGroup = getBookItemStatusGroup(item.status)
                      const statusClass = {
                        available: 'bg-[#d9f7e7] text-[#087443]',
                        misplaced: 'bg-[#fff0d8] text-[#a65000]',
                        missing: 'bg-[#fff0f0] text-[#b42318]',
                        other: 'bg-[#eef0f3] text-[#596174]',
                      }[statusGroup]
                      return (
                        <tr
                          key={item.id}
                          role="link"
                          tabIndex={0}
                          aria-label={`Xem chi tiết bản sách ${item.barcode}`}
                          onClick={() => navigate(`/book-items/${item.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              navigate(`/book-items/${item.id}`)
                            }
                          }}
                          className="cursor-pointer hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <td className="px-4 py-3 font-medium">
                            <Link
                              to={`/book/${item.bookId}`}
                              onClick={(event) => event.stopPropagation()}
                              className="text-primary hover:underline"
                            >
                              {bookTitles[item.bookId] || (booksLoading ? 'Đang tải...' : 'Không rõ tên sách')}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{item.barcode}</td>
                          <td className="px-4 py-3 text-xs text-[#596174]">
                            {getLocationName(item.expectedShelfLevelId)}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#596174]">
                            {getLocationName(item.currentShelfLevelId)}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#596174]">
                            {formatLastInventoryAtUtc(item.lastInventoryAtUtc)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}>
                                {getBookItemStatusLabel(item.status)}
                              </span>
                              {statusGroup === 'misplaced' && (
                                <button
                                  type="button"
                                  disabled={relocatingItemId === item.id || !item.expectedShelfLevelId}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void handleRelocateBookItem(item)
                                  }}
                                  aria-label={`Sửa vị trí mặc định cho mã ${item.barcode}`}
                                  title={
                                    item.expectedShelfLevelId
                                      ? 'Sửa về vị trí mặc định'
                                      : 'Chưa có vị trí mặc định'
                                  }
                                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#cbd5e1] text-[#315f9e] hover:bg-[#eff5ff] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {relocatingItemId === item.id ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Pencil className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
