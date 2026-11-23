import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

import type { AisleOptionRecord } from '@/features/aisles/types/aisle'
import type {
  EndpointOptionRecord,
  ShelfWriteRequest,
} from '@/features/shelves/types/shelf'
import type { ShelfStatus } from '@/types/enums'
import { getErrorMessage } from '@/services/http/error'

interface ShelfFormState {
  aisleId: string
  startEndpointId: string
  endEndpointId: string
  name: string
  description: string
  status: ShelfStatus
}

interface ShelfFormDialogProps {
  title: string
  aisles?: AisleOptionRecord[]
  endpoints: EndpointOptionRecord[]
  fixedAisle?: Pick<AisleOptionRecord, 'id' | 'name'>
  initial?: ShelfWriteRequest
  optionsLoading?: boolean
  aislesError?: string
  endpointsError?: string
  onRetryOptions?: () => void
  onClose: () => void
  onSubmit: (payload: ShelfWriteRequest) => Promise<void>
}

const inputClassName =
  'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary disabled:bg-[#f5f5f7]'
const selectClassName = `${inputClassName} appearance-none`

export function ShelfFormDialog({
  title,
  aisles = [],
  endpoints,
  fixedAisle,
  initial,
  optionsLoading = false,
  aislesError,
  endpointsError,
  onRetryOptions,
  onClose,
  onSubmit,
}: ShelfFormDialogProps) {
  const [form, setForm] = useState<ShelfFormState>(() => ({
    aisleId: fixedAisle?.id ?? initial?.aisleId ?? aisles[0]?.id ?? '',
    startEndpointId: initial?.startEndpointId ?? endpoints[0]?.id ?? '',
    endEndpointId: initial?.endEndpointId ?? endpoints[1]?.id ?? endpoints[0]?.id ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'ACTIVE',
  }))
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) return
    setForm((current) => ({
      ...current,
      aisleId: fixedAisle?.id || current.aisleId || aisles[0]?.id || '',
      startEndpointId: current.startEndpointId || endpoints[0]?.id || '',
      endEndpointId:
        current.endEndpointId || endpoints[1]?.id || endpoints[0]?.id || '',
    }))
  }, [aisles, endpoints, fixedAisle?.id, initial])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const payload: ShelfWriteRequest = {
      aisleId: fixedAisle?.id ?? form.aisleId,
      startEndpointId: form.startEndpointId,
      endEndpointId: form.endEndpointId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: initial ? form.status : 'ACTIVE',
    }

    if (!payload.aisleId || !payload.startEndpointId || !payload.endEndpointId) {
      setFormError('Vui lòng chọn dãy sách và đầy đủ điểm điều hướng.')
      return
    }

    setSaving(true)
    try {
      await onSubmit(payload)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const optionsError = [
    !fixedAisle && aislesError,
    endpointsError,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151922]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
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
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#687386]">
              Thông tin kệ và các điểm điều hướng
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng biểu mẫu"
            title="Đóng"
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5] disabled:opacity-50"
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

            {fixedAisle ? (
              <div className="space-y-1.5 text-sm font-medium sm:col-span-2">
                <p>Dãy sách</p>
                <p className="border border-[#d7d9e2] bg-[#f5f5f7] px-3 py-2.5 text-[#596174]">
                  {fixedAisle.name}
                </p>
              </div>
            ) : (
              <label className="block space-y-1.5 text-sm font-medium">
                Dãy sách <span className="text-[#b42318]">*</span>
                <select
                  required
                  disabled={optionsLoading || aisles.length === 0}
                  value={form.aisleId}
                  onChange={(event) => setForm({ ...form, aisleId: event.target.value })}
                  className={selectClassName}
                >
                  <option value="">
                    {optionsLoading ? 'Đang tải dãy sách...' : 'Chọn dãy sách'}
                  </option>
                  {aisles.map((aisle) => (
                    <option key={aisle.id} value={aisle.id}>
                      {aisle.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {initial && (
              <label className="block space-y-1.5 text-sm font-medium">
                Trạng thái hoạt động <span className="text-[#b42318]">*</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as ShelfStatus })
                  }
                  className={selectClassName}
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                  <option value="MAINTENANCE">Đang bảo trì</option>
                </select>
              </label>
            )}

            <label className="block space-y-1.5 text-sm font-medium">
              Điểm bắt đầu <span className="text-[#b42318]">*</span>
              <select
                required
                disabled={optionsLoading || endpoints.length === 0}
                value={form.startEndpointId}
                onChange={(event) =>
                  setForm({ ...form, startEndpointId: event.target.value })
                }
                className={selectClassName}
              >
                <option value="">
                  {optionsLoading ? 'Đang tải điểm điều hướng...' : 'Chọn điểm bắt đầu'}
                </option>
                {endpoints.map((endpoint) => (
                  <option key={endpoint.id} value={endpoint.id}>
                    {endpoint.name} ({endpoint.endpointType})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Điểm kết thúc <span className="text-[#b42318]">*</span>
              <select
                required
                disabled={optionsLoading || endpoints.length === 0}
                value={form.endEndpointId}
                onChange={(event) =>
                  setForm({ ...form, endEndpointId: event.target.value })
                }
                className={selectClassName}
              >
                <option value="">
                  {optionsLoading ? 'Đang tải điểm điều hướng...' : 'Chọn điểm kết thúc'}
                </option>
                {endpoints.map((endpoint) => (
                  <option key={endpoint.id} value={endpoint.id}>
                    {endpoint.name} ({endpoint.endpointType})
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
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Ghi chú về vị trí hoặc đặc điểm vật lý..."
                className="w-full border border-[#d7d9e2] bg-white p-3 text-sm text-[#17181c] outline-none focus:border-primary"
              />
            </label>
          </div>

          {optionsError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]"
            >
              <span>{optionsError}</span>
              {onRetryOptions && (
                <button
                  type="button"
                  onClick={() => void onRetryOptions()}
                  className="shrink-0 font-semibold underline"
                >
                  Tải lại
                </button>
              )}
            </div>
          )}
          {formError && (
            <p
              role="alert"
              className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]"
            >
              {formError}
            </p>
          )}

          <footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f5f5f7] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || optionsLoading}
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saving ? 'Đang lưu...' : initial ? 'Lưu thay đổi' : 'Tạo kệ'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
