import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  Eye,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { floorApi } from '@/features/floors/api/floorApi'
import type { FloorRecord, FloorWriteRequest } from '@/features/floors/types/floor'
import { localizeFloorName } from '@/features/floors/utils/floorDisplay'
import type { FloorStatus } from '@/types/enums'
import InfrastructureStatusBadge, {
  normalizeInfrastructureStatus,
} from '@/components/common/InfrastructureStatusBadge'
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
      await floorApi.createFloor({ ...formData, status: 'ACTIVE' })
      setCreateOpen(false)
      setActionNotice('Đã tạo lầu thành công.')
      setPage(1)
      loadFloors()
    } catch (err) {
      alert(getErrorMessage(err))
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
              <h1 className="text-2xl font-bold tracking-tight text-[#17181c]">Các lầu</h1>
              <p className="mt-0.5 text-sm text-[#596174]">
                Quản lý các lầu thư viện và trạng thái hoạt động.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="ml-auto flex h-10 shrink-0 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Thêm lầu
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
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
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
              placeholder="Tìm theo tên hoặc mô tả..."
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
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="MAINTENANCE">Đang bảo trì</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
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
            Xóa bộ lọc
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-[#687386]">
          <p>
            Hiển thị {floors.length}/{totalCount} lầu
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

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="w-[100px] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Lầu #
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Tên
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
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-3 font-medium text-[#3f4654]">Đang tải dữ liệu lầu...</p>
                    </td>
                  </tr>
                ) : floors.length > 0 ? (
                  floors.map((floor) => (
                    <tr
                      key={floor.id}
                      onClick={() => navigate(`/floors/${floor.id}`)}
                      role="link"
                      tabIndex={0}
                      aria-label={`Mở ${localizeFloorName(floor.name)}`}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-bold text-primary">
                        Lầu {floor.floorNumber}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        <Link
                          to={`/floors/${floor.id}`}
                          className="text-[#17181c] hover:text-primary hover:underline"
                        >
                          {localizeFloorName(floor.name)}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <InfrastructureStatusBadge status={floor.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/floors/${floor.id}`)
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                          title={`Xem chi tiết ${localizeFloorName(floor.name)}`}
                          aria-label={`Xem chi tiết ${localizeFloorName(floor.name)}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <Layers3 className="mx-auto h-8 w-8 text-[#89909f]" />
                      <p className="mt-3 font-medium text-[#3f4654]">Không tìm thấy lầu</p>
                      <p className="mt-1 text-sm text-[#7b8190]">
                        Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
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
          title="Thêm lầu"
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
  const isEditing = Boolean(initial)
  const [data, setData] = useState<FloorFormData>(
    initial
      ? {
          ...initial,
          status: normalizeInfrastructureStatus(initial.status) ?? 'ACTIVE',
        }
      : {
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
    'mt-2 h-11 w-full rounded-lg border border-[#d7d9e2] bg-white px-3.5 text-sm text-[#17181c] outline-none transition placeholder:text-[#9aa1ae] focus:border-primary focus:ring-4 focus:ring-primary/10'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151922]/55 p-4 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="floor-form-title"
        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-[#17181c]/20"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e8e7ed] bg-gradient-to-br from-white to-[#f7f5fc] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Quản lý thư viện
              </p>
              <h2 id="floor-form-title" className="mt-1 text-xl font-bold tracking-tight text-[#17181c]">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#687386]">
                {isEditing
                  ? 'Cập nhật thông tin và trạng thái của lầu.'
                  : 'Điền thông tin để thêm lầu mới vào thư viện.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#687386] transition hover:bg-[#eceaf2] hover:text-[#17181c] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-7">
          <div className="grid gap-5 sm:grid-cols-[0.8fr_1.2fr]">
            <label className="block text-sm font-semibold text-[#3f4654]">
              Số lầu
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
              <span className="mt-1.5 block text-xs font-normal text-[#89909f]">
                Có thể nhập số lầu âm cho khu vực dưới mặt đất, ví dụ -1.
              </span>
            </label>
            <label className="block text-sm font-semibold text-[#3f4654]">
              Tên lầu
              <input
                required
                maxLength={100}
                value={data.name}
                onChange={(event) => setData({ ...data, name: event.target.value })}
                placeholder="Ví dụ: Lầu 1 - Phòng đọc chính"
                className={input}
              />
              <span className="mt-1.5 block text-xs font-normal text-[#89909f]">
                Tối đa 100 ký tự.
              </span>
            </label>
          </div>
          <label className="block text-sm font-semibold text-[#3f4654]">
            Mô tả <span className="font-normal text-[#89909f]">(không bắt buộc)</span>
            <textarea
              maxLength={500}
              value={data.description || ''}
              onChange={(event) =>
                setData({ ...data, description: event.target.value || null })
              }
              placeholder="Ghi chú về khu vực hoặc chức năng của lầu..."
              className={`${input} min-h-24 resize-y py-3`}
            />
            <span className="mt-1.5 block text-right text-xs font-normal text-[#89909f]">
              {(data.description || '').length}/500
            </span>
          </label>
          {isEditing && (
            <label className="block text-sm font-semibold text-[#3f4654]">
              Trạng thái
              <select
                value={normalizeInfrastructureStatus(data.status) ?? 'ACTIVE'}
                onChange={(event) => setData({ ...data, status: event.target.value as FloorStatus })}
                className={input}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="MAINTENANCE">Đang bảo trì</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </label>
          )}
          <footer className="-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-[#e8e7ed] bg-[#faf9fc] px-6 py-4 sm:-mx-7 sm:-mb-6 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 rounded-lg border border-[#d7d9e2] bg-white px-4 text-sm font-semibold text-[#3f4654] transition hover:bg-[#f1eff5] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? (isEditing ? 'Đang lưu...' : 'Đang tạo...') : isEditing ? 'Lưu thay đổi' : 'Tạo thêm lầu'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = normalizeInfrastructureStatus(status)
  if (normalizedStatus) return <InfrastructureStatusBadge status={status} />

  const isArchived = status.trim().toUpperCase() === 'ARCHIVED'

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-[#eef0f3] px-2.5 py-1 text-[11px] font-medium text-[#596174]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isArchived ? 'Đã lưu trữ' : 'Không xác định'}
    </span>
  )
}

export default FloorList
