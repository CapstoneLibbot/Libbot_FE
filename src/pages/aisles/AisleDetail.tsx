import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Eye,
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
import InfrastructureStatusBadge, {
  normalizeInfrastructureStatus,
} from '@/components/common/InfrastructureStatusBadge'
import { floorApi } from '@/features/floors/api/floorApi'
import type { FloorOptionRecord } from '@/features/floors/types/floor'
import { localizeFloorName } from '@/features/floors/utils/floorDisplay'
import { shelfApi } from '@/features/shelves/api/shelfApi'
import type { EndpointOptionRecord, ShelfWriteRequest } from '@/features/shelves/types/shelf'
import type { AisleStatus } from '@/types/enums'
import { getErrorMessage } from '@/services/http/error'
import { ShelfFormDialog } from '@/pages/shelves/ShelfFormDialog'

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
  const [isFloorOptionsLoading, setIsFloorOptionsLoading] = useState(true)
  const [floorOptionsError, setFloorOptionsError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  const [isLoading, setIsLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const loadFloorOptions = async () => {
    setIsFloorOptionsLoading(true)
    setFloorOptionsError(null)
    try {
      const data = await floorApi.getFloors({
        page: 1,
        pageSize: 20,
        sortBy: 'floorNumber',
        sortOrder: 'asc',
      })
      setFloors(data.items)
    } catch (err) {
      setFloorOptionsError(getErrorMessage(err))
    } finally {
      setIsFloorOptionsLoading(false)
    }
  }

  useEffect(() => {
    loadFloorOptions()
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
      await aisleApi.createAisle({ ...formData, status: 'ACTIVE' })
      setCreateOpen(false)
      setActionNotice('Đã tạo dãy sách thành công.')
      setPage(1)
      loadAisles()
    } catch (err) {
      alert(getErrorMessage(err))
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
              <h1 className="text-2xl font-bold tracking-tight">Dãy sách</h1>
              <p className="mt-0.5 text-sm text-[#596174]">
                Quản lý các dãy sách trong thư viện và vị trí trên từng lầu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Thêm dãy sách
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
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
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
              placeholder="Tìm theo tên dãy sách..."
              className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#7b8190] focus:border-primary"
            />
          </form>

          <SelectFilter
            value={floorId}
            onChange={(val) => {
              setFloorId(val)
              setPage(1)
            }}
            ariaLabel="Lọc theo lầu"
          >
            <option value="ALL">Tất cả các lầu</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                Lầu {floor.floorNumber}
              </option>
            ))}
          </SelectFilter>

          <SelectFilter
            value={status}
            onChange={(val) => {
              setStatus(val)
              setPage(1)
            }}
            ariaLabel="Lọc theo trạng thái"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </SelectFilter>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-[#687386]">
          <p>
            Hiển thị {aisles.length}/{totalCount} dãy sách
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border border-[#d7d9e2] bg-white px-2.5 py-1 disabled:opacity-40"
              >
                Trước
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
                Sau
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden border border-[#d9dce5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Tên dãy sách
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Lầu
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Số kệ
                  </th>
                  <th className="w-[180px] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Trạng thái
                  </th>
                  <th className="w-[90px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-3 font-medium text-[#3f4654]">Đang tải danh sách dãy sách...</p>
                    </td>
                  </tr>
                ) : aisles.length > 0 ? (
                  aisles.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/aisles/${item.id}`)}
                      role="link"
                      tabIndex={0}
                      aria-label={`Mở ${item.name}`}
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
                            Lầu {item.floor.floorNumber}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-4 text-[#596174]">
                        {item.shelves ? `${item.shelves.length} kệ` : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <InfrastructureStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/aisles/${item.id}`)
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                          title={`Xem chi tiết ${item.name}`}
                          aria-label={`Xem chi tiết ${item.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTable
                    colSpan={5}
                    title="Không tìm thấy dãy sách"
                    description="Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {createOpen && (
        <AisleFormDialog
          title="Thêm dãy sách"
          floors={floors}
          floorOptionsLoading={isFloorOptionsLoading}
          floorOptionsError={floorOptionsError}
          onRetryFloorOptions={loadFloorOptions}
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
  const [isFloorOptionsLoading, setIsFloorOptionsLoading] = useState(true)
  const [floorOptionsError, setFloorOptionsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [creatingShelf, setCreatingShelf] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [shelfEndpoints, setShelfEndpoints] = useState<EndpointOptionRecord[]>([])
  const [shelfEndpointsLoading, setShelfEndpointsLoading] = useState(true)
  const [shelfEndpointsError, setShelfEndpointsError] = useState('')

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

  const loadFloorOptions = async () => {
    setIsFloorOptionsLoading(true)
    setFloorOptionsError(null)
    try {
      const data = await floorApi.getFloors({
        page: 1,
        pageSize: 20,
        sortBy: 'floorNumber',
        sortOrder: 'asc',
      })
      setFloors(data.items)
    } catch (err) {
      setFloorOptionsError(getErrorMessage(err))
    } finally {
      setIsFloorOptionsLoading(false)
    }
  }

  const loadShelfEndpoints = async () => {
    setShelfEndpointsLoading(true)
    setShelfEndpointsError('')
    try {
      setShelfEndpoints(await shelfApi.getEndpoints())
    } catch (err) {
      setShelfEndpointsError(getErrorMessage(err))
    } finally {
      setShelfEndpointsLoading(false)
    }
  }

  useEffect(() => {
    loadAisle()
    loadFloorOptions()
    loadShelfEndpoints()
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

  const handleCreateShelf = async (payload: ShelfWriteRequest) => {
    if (!aisle) throw new Error('Không tìm thấy dãy sách hiện tại.')
    await shelfApi.createShelf({ ...payload, aisleId: aisle.id, status: 'ACTIVE' })
    setCreatingShelf(false)
    await loadAisle()
  }

  const handleDelete = async () => {
    if (!aisle) return
    if (!window.confirm(`Bạn có chắc muốn xóa dãy sách "${aisle.name}" không?`)) return

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
        <p className="mt-3 text-sm text-[#596174]">Đang tải thông tin dãy sách...</p>
      </div>
    )
  }

  if (errorNotice || !aisle) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
        <div className="max-w-md rounded-md border border-[#fecaca] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Không tìm thấy dãy sách</h1>
          </div>
          <p className="mt-2 text-sm text-[#596174]">
            {errorNotice || 'Dãy sách yêu cầu không tồn tại hoặc đã bị xóa.'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={loadAisle}
              className="flex items-center gap-1.5 border border-[#d7d9e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#3f4654] hover:bg-[#f1eff5]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  const floor = aisle.floor
  const shelves = aisle.shelves || []

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Route className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {floor ? (
                <Link to={`/floors/${floor.id}`} className="hover:underline">
                  Lầu {floor.floorNumber}
                </Link>
              ) : (
                'Dãy sách'
              )}
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
            Sửa dãy sách
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-10 items-center gap-2 border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Xóa dãy sách
          </button>
        </div>
      </header>

      {/* Details Section */}
      <section className="mt-8 max-w-3xl overflow-hidden border border-[#d9dce5] bg-white shadow-sm">
        <dl className="divide-y divide-[#d9dce5]">
          <DetailRow label="ID (GUID)" value={aisle.id} mono />
          <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-[#687386]">Lầu</dt>
            <dd>
              {floor ? (
                <Link
                  to={`/floors/${floor.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  Lầu {floor.floorNumber}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <DetailRow label="Tên dãy sách" value={aisle.name} />
          <DetailRow label="Mô tả" value={aisle.description || '—'} />
          <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-[#687386]">Trạng thái</dt>
            <dd>
              <InfrastructureStatusBadge status={aisle.status} />
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
              <h2 className="text-lg font-semibold">Kệ</h2>
              <p className="mt-0.5 text-sm text-[#687386]">
                Có {shelves.length} kệ thuộc dãy sách này.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreatingShelf(true)}
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Thêm kệ cho dãy {aisle.name}
          </button>
        </div>

        <div className="mt-4 overflow-hidden border border-[#d9dce5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Tên kệ
                  </th>
                  <th className="w-[120px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Thao tác
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
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/shelves/${shelf.id}`)
                          }}
                          title={`Xem chi tiết ${shelf.name}`}
                          aria-label={`Xem chi tiết ${shelf.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTable
                    colSpan={2}
                    title="Không tìm thấy kệ"
                    description="Chưa có kệ nào được gán cho dãy sách này."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {editing && (
        <AisleFormDialog
          title="Cập nhật dãy sách"
          floors={floors}
          floorOptionsLoading={isFloorOptionsLoading}
          floorOptionsError={floorOptionsError}
          onRetryFloorOptions={loadFloorOptions}
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
      {creatingShelf && (
        <ShelfFormDialog
          title={`Thêm kệ cho dãy ${aisle.name}`}
          fixedAisle={aisle}
          endpoints={shelfEndpoints}
          optionsLoading={shelfEndpointsLoading}
          endpointsError={shelfEndpointsError}
          onRetryOptions={loadShelfEndpoints}
          onClose={() => setCreatingShelf(false)}
          onSubmit={handleCreateShelf}
        />
      )}
    </div>
  )
}

export function AisleFormDialog({
  title,
  floors = [],
  fixedFloor,
  floorOptionsLoading = false,
  floorOptionsError,
  onRetryFloorOptions,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  floors?: FloorOptionRecord[]
  fixedFloor?: Pick<FloorOptionRecord, 'id' | 'name' | 'floorNumber'>
  floorOptionsLoading?: boolean
  floorOptionsError?: string | null
  onRetryFloorOptions?: () => void
  initial?: AisleFormData
  onClose: () => void
  onSubmit: (data: AisleFormData) => void
}) {
  const [form, setForm] = useState<AisleFormData>(
    initial
      ? {
          ...initial,
          status: normalizeInfrastructureStatus(initial.status) ?? 'ACTIVE',
        }
      : {
          floorId: fixedFloor?.id || floors[0]?.id || '',
          name: '',
          description: null,
          status: 'ACTIVE',
        },
  )
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = fixedFloor
    ? true
    : initial
      ? Boolean(form.floorId)
      : !floorOptionsLoading && floors.length > 0 && Boolean(form.floorId)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (floorOptionsLoading) return
    const payload = fixedFloor ? { ...form, floorId: fixedFloor.id } : form
    if (!payload.floorId) {
      alert('Vui lòng chọn lầu cho dãy sách!')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(payload)
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
          {fixedFloor ? (
            <div className="border border-primary/15 bg-primary/5 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#687386]">
                Lầu được gán
              </p>
              <p className="mt-1 text-sm font-semibold text-primary">
                {localizeFloorName(fixedFloor.name)} (Lầu {fixedFloor.floorNumber})
              </p>
            </div>
          ) : (
            <label className="block text-sm font-medium text-[#3f4654]">
              Lầu
              <select
                required
                disabled={floorOptionsLoading || floors.length === 0}
                value={form.floorId}
                onChange={(event) => setForm({ ...form, floorId: event.target.value })}
                className={input}
              >
                <option value="" disabled>
                  {floorOptionsLoading
                    ? 'Đang tải danh sách lầu...'
                    : floors.length === 0
                      ? 'Không có lầu khả dụng'
                      : '-- Chọn lầu --'}
                </option>
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {localizeFloorName(floor.name)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!fixedFloor && floorOptionsError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <span>{floorOptionsError}</span>
              {onRetryFloorOptions && (
                <button
                  type="button"
                  onClick={onRetryFloorOptions}
                  className="shrink-0 font-semibold underline"
                >
                  Tải lại
                </button>
              )}
            </div>
          )}
          <label className="block text-sm font-medium text-[#3f4654]">
            Tên dãy sách
            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ví dụ: Dãy sách A1 - Sách khoa học"
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-[#3f4654]">
            Mô tả
            <textarea
              maxLength={500}
              value={form.description || ''}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value || null })
              }
              placeholder="Ghi chú về dãy sách..."
              className={`${input} h-20 py-2`}
            />
          </label>
          {initial && (
            <label className="block text-sm font-medium text-[#3f4654]">
              Trạng thái
              <select
                value={normalizeInfrastructureStatus(form.status) ?? 'ACTIVE'}
                onChange={(event) => setForm({ ...form, status: event.target.value as AisleStatus })}
                className={input}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="MAINTENANCE">Đang bảo trì</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </label>
          )}
          <footer className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || floorOptionsLoading || !canSubmit}
              className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? 'Lưu thay đổi' : 'Tạo dãy sách'}
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

export default AisleDetail
