import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, Plus, RefreshCw, Search, Warehouse } from 'lucide-react'
import { shelfApi } from '@/features/shelves/api/shelfApi'
import { aisleApi } from '@/features/aisles/api/aisleApi'
import type { EndpointOptionRecord, ShelfRecord, ShelfWriteRequest } from '@/features/shelves/types/shelf'
import type { AisleOptionRecord } from '@/features/aisles/types/aisle'
import { getErrorMessage } from '@/services/http/error'
import { ShelfFormDialog } from './ShelfFormDialog'

const inputClassName =
  'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary disabled:bg-[#f5f5f7]'

export default function ShelfList() {
  const navigate = useNavigate()
  const [shelves, setShelves] = useState<ShelfRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [aisles, setAisles] = useState<AisleOptionRecord[]>([])
  const [endpoints, setEndpoints] = useState<EndpointOptionRecord[]>([])
  const [aislesLoading, setAislesLoading] = useState(true)
  const [endpointsLoading, setEndpointsLoading] = useState(true)
  const [aislesError, setAislesError] = useState('')
  const [endpointsError, setEndpointsError] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedAisle, setSelectedAisle] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  const [formOpen, setFormOpen] = useState(false)

  const loadDependencies = useCallback(async () => {
    setAislesLoading(true)
    setEndpointsLoading(true)
    setAislesError('')
    setEndpointsError('')
    const [aisleResult, endpointResult] = await Promise.allSettled([
      aisleApi.getAisles({
        page: 1,
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      shelfApi.getEndpoints(),
    ])

    if (aisleResult.status === 'fulfilled') {
      setAisles(aisleResult.value.items)
    } else {
      setAislesError(getErrorMessage(aisleResult.reason))
    }
    setAislesLoading(false)

    if (endpointResult.status === 'fulfilled') {
      setEndpoints(endpointResult.value)
    } else {
      setEndpointsError(getErrorMessage(endpointResult.reason))
    }
    setEndpointsLoading(false)
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
        expand: 'aisle',
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
  function openCreate() {
    setFormOpen(true)
  }

  async function handleSubmit(payload: ShelfWriteRequest) {
    await shelfApi.createShelf({ ...payload, status: 'ACTIVE' })
    setFormOpen(false)
    void loadData()
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
            disabled={aislesLoading || !aisles.length}
            title={
              aislesLoading
                ? 'Đang tải danh sách dãy sách'
                : aislesError
                  ? 'Không tải được danh sách dãy sách'
                  : !aisles.length
                    ? 'Trước tiên hãy tạo dãy sách'
                    : undefined
            }
            className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Thêm kệ
          </button>
        </header>

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

          {!aisles.length && !aislesLoading && !aislesError && !loading && !loadError && (
            <p role="status" className="border border-[#ecd9a8] bg-[#fff8e8] px-3 py-2 text-sm text-[#765600]">
              Không tìm thấy dãy sách nào trong thư viện. Vui lòng tạo dãy sách trước khi thêm kệ.
            </p>
          )}

          {(aislesError || endpointsError) && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] px-4 py-3 text-sm text-[#a12820]"
            >
              <span>
                {[
                  aislesError && `Không thể tải danh sách dãy sách: ${aislesError}`,
                  endpointsError && `Không thể tải điểm điều hướng: ${endpointsError}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </span>
              <button
                type="button"
                onClick={() => void loadDependencies()}
                className="font-semibold underline"
              >
                Thử lại
              </button>
            </div>
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
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]">
                  <tr>
                    <th className="px-4 py-3">Tên kệ</th>
                    <th className="px-4 py-3">Dãy sách</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="w-32 px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-14 text-center text-[#687386]">
                        Đang tải danh sách kệ...
                      </td>
                    </tr>
                  ) : shelves.length ? (
                    shelves.map((shelf) => {
                      const aisleName = shelf.aisle?.name || aisleMap.get(shelf.aisleId) || '—'

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
                          </td>
                          <td className="px-4 py-3 text-[#596174]">
                            <Link
                              to={`/aisles/${shelf.aisleId}`}
                              className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                            >
                              {aisleName}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <ShelfStatusBadge status={shelf.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => navigate(`/shelves/${shelf.id}`)}
                                title={`Xem chi tiết ${shelf.name}`}
                                aria-label={`Xem chi tiết ${shelf.name}`}
                                className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-14 text-center text-[#687386]">
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
        <ShelfFormDialog
          title="Thêm kệ"
          aisles={aisles}
          endpoints={endpoints}
          optionsLoading={aislesLoading || endpointsLoading}
          aislesError={aislesError}
          endpointsError={endpointsError}
          onRetryOptions={() => void loadDependencies()}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
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
