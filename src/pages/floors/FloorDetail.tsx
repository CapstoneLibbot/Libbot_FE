import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Layers3,
  Loader2,
  Map as MapIcon,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { floorApi } from '@/features/floors/api/floorApi'
import type { FloorRecord } from '@/features/floors/types/floor'
import { FloorFormDialog, StatusBadge, type FloorFormData } from './FloorList'
import { getErrorMessage } from '@/services/http/error'

function FloorDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [floor, setFloor] = useState<FloorRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadFloor = async () => {
    if (!id) return
    setIsLoading(true)
    setErrorNotice(null)
    try {
      const data = await floorApi.getFloorById(id, 'aisles,maps')
      setFloor(data)
    } catch (err) {
      setErrorNotice(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFloor()
  }, [id])

  const handleUpdate = async (data: FloorFormData) => {
    if (!id) return
    try {
      const updated = await floorApi.updateFloor(id, data)
      setFloor((prev) => (prev ? { ...prev, ...updated } : updated))
      setEditing(false)
      loadFloor()
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!id || !floor) return
    if (!window.confirm(`Are you sure you want to delete floor "${floor.name}"?`)) return

    setDeleting(true)
    try {
      await floorApi.deleteFloor(id)
      navigate('/floors')
    } catch (err) {
      alert(getErrorMessage(err))
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-[#596174]">Đang tải thông tin tầng...</p>
      </div>
    )
  }

  if (errorNotice || !floor) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
        <div className="max-w-md rounded-md border border-[#fecaca] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Không tìm thấy tầng</h1>
          </div>
          <p className="mt-2 text-sm text-[#596174]">
            {errorNotice || 'Tầng yêu cầu không tồn tại hoặc đã bị xóa.'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={loadFloor}
              className="flex items-center gap-1.5 border border-[#d7d9e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#3f4654] hover:bg-[#f1eff5]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </button>
            <Link to="/floors" className="text-xs font-semibold text-primary hover:underline">
              ← Quay lại danh sách tầng
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const aisles = floor.aisles || []
  const maps = floor.maps || []

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <Link
        to="/floors"
        className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Danh sách tầng
      </Link>

      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Layers3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Tầng #{floor.floorNumber}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{floor.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f1eff5]"
          >
            <Pencil className="h-4 w-4" />
            Sửa tầng
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-10 items-center gap-2 border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Xóa tầng
          </button>
        </div>
      </header>

      {/* Details Section */}
      <section className="mt-8 max-w-3xl overflow-hidden border border-[#d9dce5] bg-white shadow-sm">
        <dl className="divide-y divide-[#d9dce5]">
          <DetailRow label="ID (GUID)" value={floor.id} mono />
          <DetailRow label="Số tầng" value={`Tầng ${floor.floorNumber}`} />
          <DetailRow label="Tên tầng" value={floor.name} />
          <DetailRow label="Mô tả" value={floor.description || '—'} />
          <div className="grid grid-cols-[140px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-[#687386]">Trạng thái</dt>
            <dd>
              <StatusBadge status={floor.status} />
            </dd>
          </div>
        </dl>
      </section>

      {/* Aisles Section */}
      <section className="mt-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Dãy sách</h2>
              <p className="mt-0.5 text-sm text-[#687386]">
                Có {aisles.length} dãy sách trên tầng này.
              </p>
            </div>
          </div>
          <Link
            to="/aisles"
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Xem danh sách dãy sách
          </Link>
        </div>

        <div className="mt-4 overflow-hidden border border-[#d9dce5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Tên dãy sách
                  </th>
                  <th className="w-[120px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {aisles.length > 0 ? (
                  aisles.map((aisle) => (
                    <tr
                      key={aisle.id}
                      onClick={() => navigate(`/aisles/${aisle.id}`)}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc]"
                    >
                      <td className="px-4 py-4 font-medium text-primary hover:underline">
                        {aisle.name}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/aisles/${aisle.id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Xem chi tiết →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <Route className="mx-auto h-8 w-8 text-[#89909f]" />
                      <p className="mt-3 font-medium text-[#3f4654]">Không tìm thấy dãy sách</p>
                      <p className="mt-1 text-sm text-[#7b8190]">
                        Tầng này chưa có dãy sách nào.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Digital Maps Section */}
      {maps.length > 0 && (
        <section className="mt-9">
          <div className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Bản đồ số</h2>
              <p className="mt-0.5 text-sm text-[#687386]">
                Có {maps.length} bản đồ số được gán cho tầng này.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {maps.map((map) => (
              <div
                key={map.id}
                onClick={() => navigate(`/maps/${map.id}`)}
                className="cursor-pointer border border-[#d9dce5] bg-white p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#17181c]">{map.name}</h3>
                  <StatusBadge status={map.status} />
                </div>
                <p className="mt-1 text-xs text-[#596174]">Phiên bản: {map.version}</p>
                <Link
                  to={`/maps/${map.id}`}
                  className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Mở bản đồ →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {editing && (
        <FloorFormDialog
          title="Cập nhật tầng"
          initial={{
            name: floor.name,
            floorNumber: floor.floorNumber,
            description: floor.description,
            status: floor.status,
          }}
          onClose={() => setEditing(false)}
          onSubmit={handleUpdate}
        />
      )}
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
    <div className="grid grid-cols-[140px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
      <dt className="text-[#687386]">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-[#3f4654]' : 'text-[#17181c]'}>{value}</dd>
    </div>
  )
}

export default FloorDetail
