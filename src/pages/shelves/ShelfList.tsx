import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ExternalLink, Layers, Navigation, Pencil, Plus, RefreshCw, Search, Trash2, Warehouse, X } from 'lucide-react'
import { shelfApi } from '@/features/shelves/api/shelfApi'
import { aisleApi } from '@/features/aisles/api/aisleApi'
import type { EndpointOptionRecord, ShelfRecord, ShelfWriteRequest } from '@/features/shelves/types/shelf'
import type { AisleOptionRecord } from '@/features/aisles/types/aisle'
import type { ShelfStatus } from '@/types/enums'
import { getErrorMessage } from '@/services/http/error'

interface ShelfFormData {
  aisleId: string
  startEndpointId: string
  endEndpointId: string
  name: string
  description: string
  status: ShelfStatus
}

const emptyForm: ShelfFormData = {
  aisleId: '',
  startEndpointId: '',
  endEndpointId: '',
  name: '',
  description: '',
  status: 'ACTIVE',
}

const inputClassName =
  'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary disabled:bg-[#f5f5f7]'
const selectClassName = inputClassName + ' appearance-none'

export default function ShelfList() {
  const navigate = useNavigate()
  const [shelves, setShelves] = useState<ShelfRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [aisles, setAisles] = useState<AisleOptionRecord[]>([])
  const [endpoints, setEndpoints] = useState<EndpointOptionRecord[]>([])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedAisle, setSelectedAisle] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  const [formOpen, setFormOpen] = useState(false)
  const [activeShelf, setActiveShelf] = useState<ShelfRecord | null>(null)
  const [form, setForm] = useState<ShelfFormData>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const loadDependencies = useCallback(async () => {
    try {
      const [aisleList, endpointList] = await Promise.all([
        aisleApi.getAllOptions(),
        shelfApi.getEndpoints().catch(() => [] as EndpointOptionRecord[]),
      ])
      setAisles(aisleList)
      setEndpoints(endpointList)
    } catch {
      // Non-blocking for options
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await shelfApi.getShelves({
        page: 1,
        pageSize: 100,
        searchTerm: search.trim() || undefined,
        aisleId: selectedAisle === 'ALL' ? undefined : selectedAisle,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        expand: 'aisle,levels,endpoints',
      })
      setShelves(res.items)
      setTotalCount(res.totalCount)
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [search, selectedAisle, selectedStatus])

  useEffect(() => {
    void loadDependencies()
  }, [loadDependencies])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const aisleMap = useMemo(() => new Map(aisles.map((a) => [a.id, a.name])), [aisles])
  const endpointMap = useMemo(
    () => new Map(endpoints.map((e) => [e.id, `${e.name} (${e.endpointType})`])),
    [endpoints],
  )

  function openCreate() {
    setActiveShelf(null)
    setForm({
      ...emptyForm,
      aisleId: aisles[0]?.id ?? '',
      startEndpointId: endpoints[0]?.id ?? '',
      endEndpointId: endpoints[1]?.id ?? endpoints[0]?.id ?? '',
    })
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(shelf: ShelfRecord) {
    setActiveShelf(shelf)
    setForm({
      aisleId: shelf.aisleId,
      startEndpointId: shelf.startEndpointId,
      endEndpointId: shelf.endEndpointId,
      name: shelf.name,
      description: shelf.description ?? '',
      status: shelf.status,
    })
    setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')

    const payload: ShelfWriteRequest = {
      aisleId: form.aisleId,
      startEndpointId: form.startEndpointId,
      endEndpointId: form.endEndpointId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
    }

    try {
      if (activeShelf) {
        await shelfApi.updateShelf(activeShelf.id, payload)
      } else {
        await shelfApi.createShelf(payload)
      }
      setFormOpen(false)
      void loadData()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(shelf: ShelfRecord) {
    if (!window.confirm(`Are you sure you want to delete shelf "${shelf.name}"?`)) return
    setDeletingId(shelf.id)
    setLoadError('')
    try {
      await shelfApi.deleteShelf(shelf.id)
      setShelves((prev) => prev.filter((item) => item.id !== shelf.id))
      setTotalCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1240px] space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kệ sách</h1>
              <p className="mt-0.5 text-sm text-[#596174]">
                Quản lý hệ thống kệ sách và vị trí điều hướng trong thư viện
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={!aisles.length}
            title={!aisles.length ? 'Trước tiên hãy tạo dãy sách' : undefined}
            className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Thêm kệ
          </button>
        </header>

        {/* Metric Cards */}
        <section className="grid gap-4 sm:grid-cols-3" aria-label="Tổng quan kệ">
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Tổng số kệ</p>
            <p className="mt-1 text-xl font-semibold">{totalCount}</p>
          </div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Số dãy sách</p>
            <p className="mt-1 text-xl font-semibold">{aisles.length}</p>
          </div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Điểm điều hướng</p>
            <p className="mt-1 text-xl font-semibold">{endpoints.length}</p>
          </div>
        </section>

        {/* Toolbar & Filters */}
        <section className="space-y-3" aria-label="Danh sách kệ">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void loadData()
                }}
                placeholder="Tìm theo tên kệ..."
                aria-label="Tìm kiếm kệ"
                className={inputClassName + ' pl-9'}
              />
            </label>

            <select
              value={selectedAisle}
              onChange={(e) => setSelectedAisle(e.target.value)}
              className="h-10 min-w-[160px] border border-[#d7d9e2] bg-white px-3 text-sm"
            >
              <option value="ALL">Tất cả dãy sách</option>
              {aisles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 min-w-[150px] border border-[#d7d9e2] bg-white px-3 text-sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
              <option value="MAINTENANCE">Đang bảo trì</option>
            </select>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              title="Làm mới danh sách"
              className="inline-flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-3 text-sm font-medium hover:bg-[#f1eff5] disabled:opacity-50"
            >
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Làm mới
            </button>
          </div>

          {!aisles.length && !loading && !loadError && (
            <p role="status" className="border border-[#ecd9a8] bg-[#fff8e8] px-3 py-2 text-sm text-[#765600]">
              Không tìm thấy dãy sách nào trong thư viện. Vui lòng tạo dãy sách trước khi thêm kệ.
            </p>
          )}

          {loadError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] px-4 py-3 text-sm text-[#a12820]"
            >
              <span>{loadError}</span>
              <button type="button" onClick={() => void loadData()} className="font-semibold underline">
                Thử lại
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]">
                  <tr>
                    <th className="px-4 py-3">Tên kệ</th>
                    <th className="px-4 py-3">Dãy sách</th>
                    <th className="px-4 py-3">Tầng kệ</th>
                    <th className="px-4 py-3">Điểm điều hướng</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="w-32 px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center text-[#687386]">
                        Đang tải danh sách kệ...
                      </td>
                    </tr>
                  ) : shelves.length ? (
                    shelves.map((shelf) => {
                      const aisleName = shelf.aisle?.name || aisleMap.get(shelf.aisleId) || '—'
                      const levelsCount = shelf.levels?.length ?? 0
                      const startName = endpointMap.get(shelf.startEndpointId) || shelf.startEndpointId.slice(0, 8)
                      const endName = endpointMap.get(shelf.endEndpointId) || shelf.endEndpointId.slice(0, 8)

                      return (
                        <tr
                          key={shelf.id}
                          role="link"
                          tabIndex={0}
                          aria-label={`Mở thông tin kệ ${shelf.name}`}
                          onClick={(event) => {
                            if (event.target instanceof Element && event.target.closest('a, button')) return
                            navigate(`/shelves/${shelf.id}`)
                          }}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) return
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              navigate(`/shelves/${shelf.id}`)
                            }
                          }}
                          className="cursor-pointer border-b border-[#ececf1] last:border-0 hover:bg-[#fafafd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <td className="px-4 py-3 font-medium">
                            <Link
                              to={`/shelves/${shelf.id}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {shelf.name}
                            </Link>
                            {shelf.description && (
                              <p className="mt-0.5 max-w-xs truncate text-xs text-[#687386]">
                                {shelf.description}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#596174]">
                            <Link
                              to={`/aisles/${shelf.aisleId}`}
                              className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                            >
                              {aisleName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-[#596174]">
                            <span className="inline-flex items-center gap-1 rounded bg-[#f0eff5] px-2 py-0.5 text-xs font-semibold text-[#484f60]">
                              <Layers className="h-3 w-3" />
                              {levelsCount} tầng
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#596174]">
                            <div className="flex items-center gap-1.5" title="Điểm điều hướng bắt đầu → kết thúc">
                              <Navigation className="h-3.5 w-3.5 text-primary" />
                              <span className="truncate max-w-[120px]">{startName}</span>
                              <span>→</span>
                              <span className="truncate max-w-[120px]">{endName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ShelfStatusBadge status={shelf.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => navigate(`/shelves/${shelf.id}`)}
                                title={`Xem thông tin ${shelf.name}`}
                                aria-label={`Xem thông tin ${shelf.name}`}
                                className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(shelf)}
                                title={`Sửa ${shelf.name}`}
                                aria-label={`Sửa ${shelf.name}`}
                                className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(shelf)}
                                disabled={deletingId === shelf.id}
                                title={`Xóa ${shelf.name}`}
                                aria-label={`Xóa ${shelf.name}`}
                                className="flex h-8 w-8 items-center justify-center text-[#8d4a46] hover:bg-[#fff1f0] hover:text-[#b42318] disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center text-[#687386]">
                        {loadError ? 'Không thể tải danh sách kệ.' : 'Không tìm thấy kệ.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#d9dce5] px-4 py-3 text-xs text-[#687386]">
              Hiển thị {shelves.length}/{totalCount} kệ
            </div>
          </div>
        </section>
      </div>

      {/* Create / Edit Shelf Dialog */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151922]/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setFormOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="shelf-form-title"
            className="my-auto w-full max-w-xl border border-[#d9dce5] bg-white shadow-xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#e4e6eb] px-5 py-4">
              <div>
                <h2 id="shelf-form-title" className="text-lg font-semibold">
                  {activeShelf ? 'Cập nhật kệ' : 'Thêm kệ'}
                </h2>
                <p className="mt-1 text-sm text-[#687386]">Thông tin kệ và các điểm điều hướng</p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={saving}
                aria-label="Đóng biểu mẫu"
                title="Đóng"
                className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
                  Tên kệ <span className="text-[#b42318]">*</span>
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Ví dụ: Kệ A1, Kệ khoa học..."
                    className={inputClassName}
                  />
                </label>

                <label className="block space-y-1.5 text-sm font-medium">
                  Dãy sách <span className="text-[#b42318]">*</span>
                  <select
                    required
                    value={form.aisleId}
                    onChange={(event) => setForm({ ...form, aisleId: event.target.value })}
                    className={selectClassName}
                  >
                    <option value="">Chọn dãy sách</option>
                    {aisles.map((aisle) => (
                      <option key={aisle.id} value={aisle.id}>
                        {aisle.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5 text-sm font-medium">
                  Trạng thái hoạt động <span className="text-[#b42318]">*</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as ShelfStatus })}
                    className={selectClassName}
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
                    value={form.startEndpointId}
                    onChange={(event) => setForm({ ...form, startEndpointId: event.target.value })}
                    className={selectClassName}
                  >
                    <option value="">Chọn điểm bắt đầu</option>
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
                    value={form.endEndpointId}
                    onChange={(event) => setForm({ ...form, endEndpointId: event.target.value })}
                    className={selectClassName}
                  >
                    <option value="">Chọn điểm kết thúc</option>
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
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Ghi chú về vị trí hoặc đặc điểm vật lý..."
                    className="w-full border border-[#d7d9e2] bg-white p-3 text-sm text-[#17181c] outline-none focus:border-primary"
                  />
                </label>
              </div>

              {formError && (
                <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">
                  {formError}
                </p>
              )}

              <footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="h-10 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f5f5f7]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {saving ? 'Đang lưu...' : activeShelf ? 'Lưu thay đổi' : 'Thêm kệ'}
                </button>
              </footer>
            </form>
          </section>
        </div>
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
