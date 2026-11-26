import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Camera,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { bookApi } from '@/features/books/api/bookApi'
import type { BookRecord } from '@/features/books/types/book'
import { bookItemApi } from '@/features/book-items/api/bookItemApi'
import type { BookItemRecord } from '@/features/book-items/types/bookItem'
import { shelfApi } from '@/features/shelves/api/shelfApi'
import type { ShelfLevelRecord, ShelfRecord } from '@/features/shelves/types/shelf'
import { getErrorMessage } from '@/services/http/error'

const bookItemStatusLabels: Record<string, string> = {
  AVAILABLE: 'Có sẵn',
  MISPLACED: 'Sai vị trí',
  MISSING: 'Không tìm thấy',
  DAMAGED: 'Hư hỏng',
  BORROWED: 'Đang mượn',
  LOST: 'Bị mất',
}

function formatLastInventory(value: string | null): string {
  if (!value) return 'Chưa kiểm kê'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string
  value: ReactNode
  href?: string
}) {
  return (
    <div className="grid gap-1 px-5 py-3.5 text-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[#687386]">{label}</dt>
      <dd className="break-words font-medium text-[#252933]">
        {href ? (
          <Link to={href} className="text-primary hover:underline">
            {value || '—'}
          </Link>
        ) : (
          value || '—'
        )}
      </dd>
    </div>
  )
}

function BookItemStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.trim().toUpperCase()
  const styles: Record<string, string> = {
    AVAILABLE: 'bg-[#d9f7e7] text-[#087443]',
    MISPLACED: 'bg-[#fff0d8] text-[#a65000]',
    MISSING: 'bg-[#fff0f0] text-[#b42318]',
    DAMAGED: 'bg-[#ffebee] text-[#c62828]',
    BORROWED: 'bg-[#e8efff] text-[#315f9e]',
    LOST: 'bg-[#f4f3f6] text-[#717684]',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        styles[normalizedStatus] || 'bg-gray-100 text-gray-700'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {bookItemStatusLabels[normalizedStatus] || status}
    </span>
  )
}

interface BookItemEditValues {
  barcode: string
  expectedShelfLevelId: string
  currentShelfLevelId: string | null
}

function BookItemEditDialog({
  item,
  shelfLevels,
  shelves,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: {
  item: BookItemRecord
  shelfLevels: ShelfLevelRecord[]
  shelves: ShelfRecord[]
  saving: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: (values: BookItemEditValues) => Promise<void>
}) {
  const [barcode, setBarcode] = useState(item.barcode)
  const [expectedShelfLevelId, setExpectedShelfLevelId] = useState(
    item.expectedShelfLevelId ?? '',
  )
  const [currentShelfLevelId, setCurrentShelfLevelId] = useState(
    item.currentShelfLevelId ?? '',
  )
  const shelfNames = useMemo(
    () => new Map(shelves.map((shelf) => [shelf.id, shelf.name])),
    [shelves],
  )
  const inputClass =
    'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none focus:border-primary'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void onSubmit({
      barcode,
      expectedShelfLevelId,
      currentShelfLevelId: currentShelfLevelId || null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-item-edit-title"
        className="w-full max-w-xl border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="book-item-edit-title" className="text-lg font-semibold">
              Chỉnh sửa thông tin bản thể
            </h2>
            <p className="text-xs text-[#687386]">Mã vạch: {item.barcode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block space-y-1.5 text-sm font-medium">
            Barcode <span className="text-[#b42318]">*</span>
            <input
              required
              maxLength={100}
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Tầng kệ mặc định <span className="text-[#b42318]">*</span>
            <select
              required
              value={expectedShelfLevelId}
              onChange={(event) => setExpectedShelfLevelId(event.target.value)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Chọn tầng kệ mặc định</option>
              {shelfLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {shelfNames.get(level.shelfId) || 'Kệ'} → Tầng {level.levelNumber} ({level.name})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Vị trí hiện tại
            <select
              value={currentShelfLevelId}
              onChange={(event) => setCurrentShelfLevelId(event.target.value)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Chưa xác định</option>
              {shelfLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {shelfNames.get(level.shelfId) || 'Kệ'} → Tầng {level.levelNumber} ({level.name})
                </option>
              ))}
            </select>
          </label>

          {errorMessage && (
            <div role="alert" className="flex items-center gap-2 border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || shelfLevels.length === 0}
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

export default function BookItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [bookItem, setBookItem] = useState<BookItemRecord | null>(null)
  const [book, setBook] = useState<BookRecord | null>(null)
  const [shelfLevels, setShelfLevels] = useState<ShelfLevelRecord[]>([])
  const [shelves, setShelves] = useState<ShelfRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [relocating, setRelocating] = useState(false)
  const [relocationError, setRelocationError] = useState('')
  const [relocationSuccess, setRelocationSuccess] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemSaving, setItemSaving] = useState(false)
  const [itemFormError, setItemFormError] = useState('')
  const [itemDeleting, setItemDeleting] = useState(false)
  const [itemActionError, setItemActionError] = useState('')

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const itemData = await bookItemApi.getBookItemById(id)
      const [bookData, shelfLevelsData, shelvesData] = await Promise.all([
        bookApi.getBookById(itemData.bookId, 'category'),
        shelfApi.getShelfLevels({
          page: 1,
          pageSize: 100,
          sortBy: 'levelNumber',
          sortOrder: 'asc',
        }),
        shelfApi.getShelves({ page: 1, pageSize: 100, expand: 'levels' }),
      ])
      setBookItem(itemData)
      setBook(bookData)
      setShelfLevels(shelfLevelsData.items)
      setShelves(shelvesData.items)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const levelLookup = useMemo(
    () => new Map(shelfLevels.map((shelfLevel) => [shelfLevel.id, shelfLevel])),
    [shelfLevels],
  )
  const shelfNames = useMemo(
    () => new Map(shelves.map((shelf) => [shelf.id, shelf.name])),
    [shelves],
  )

  const getLocationName = (shelfLevelId: string | null) => {
    if (!shelfLevelId) return 'Chưa xác định'
    const shelfLevel = levelLookup.get(shelfLevelId)
    if (!shelfLevel) return 'Không xác định'
    const shelfName = shelfNames.get(shelfLevel.shelfId)
    const levelName = `Tầng ${shelfLevel.levelNumber}${shelfLevel.name ? ` (${shelfLevel.name})` : ''}`
    return shelfName ? `${shelfName} · ${levelName}` : levelName
  }

  async function handleRelocateBookItem() {
    if (!bookItem?.expectedShelfLevelId) {
      setRelocationError('Bản sách này chưa có vị trí mặc định để sửa.')
      return
    }

    setRelocating(true)
    setRelocationError('')
    setRelocationSuccess('')
    try {
      const updatedItem = await bookItemApi.updateBookItem(bookItem.id, {
        bookId: bookItem.bookId,
        barcode: bookItem.barcode,
        expectedShelfLevelId: bookItem.expectedShelfLevelId,
        currentShelfLevelId: bookItem.expectedShelfLevelId,
        lastInventoryAtUtc: bookItem.lastInventoryAtUtc,
        status: 'AVAILABLE',
      })
      setBookItem(updatedItem)
      setRelocationSuccess('Đã sửa vị trí của sách về đúng vị trí mặc định')
    } catch (err) {
      setRelocationError(getErrorMessage(err))
    } finally {
      setRelocating(false)
    }
  }

  async function handleUpdateBookItem(values: {
    barcode: string
    expectedShelfLevelId: string
    currentShelfLevelId: string | null
  }) {
    if (!bookItem) return
    setItemSaving(true)
    setItemFormError('')
    try {
      const updatedItem = await bookItemApi.updateBookItem(bookItem.id, {
        bookId: bookItem.bookId,
        barcode: values.barcode.trim(),
        expectedShelfLevelId: values.expectedShelfLevelId,
        currentShelfLevelId: values.currentShelfLevelId,
        lastInventoryAtUtc: bookItem.lastInventoryAtUtc,
        status: bookItem.status,
      })
      setBookItem(updatedItem)
      setEditDialogOpen(false)
    } catch (err) {
      setItemFormError(getErrorMessage(err))
    } finally {
      setItemSaving(false)
    }
  }

  async function handleDeleteBookItem() {
    if (!bookItem || !window.confirm(`Bạn có chắc muốn xóa bản thể "${bookItem.barcode}" không?`)) {
      return
    }

    setItemDeleting(true)
    setItemActionError('')
    try {
      await bookItemApi.deleteBookItem(bookItem.id)
      navigate(`/book/${bookItem.bookId}`)
    } catch (err) {
      setItemActionError(getErrorMessage(err))
    } finally {
      setItemDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-[#596174]">Đang tải thông tin bản sách...</span>
      </div>
    )
  }

  if (error || !bookItem || !book) {
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
          <h1 className="text-base font-semibold">Không tải được thông tin bản sách</h1>
          <p className="mt-1 text-sm">{error || 'Bản sách hoặc đầu sách liên quan không tồn tại.'}</p>
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

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#687386]">
                Mã vạch: {bookItem.barcode}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">Chi tiết bản sách</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setItemFormError('')
                setEditDialogOpen(true)
              }}
              className="inline-flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f1eff5]"
            >
              <Pencil className="h-4 w-4" />
              Chỉnh sửa thông tin bản thể
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteBookItem()}
              disabled={itemDeleting}
              className="inline-flex h-10 items-center gap-2 border border-[#efc7c4] bg-white px-4 text-sm font-medium text-[#a12820] hover:bg-[#fff1f0] disabled:opacity-50"
            >
              {itemDeleting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Xóa bản thể
            </button>
          </div>
        </header>

        {itemActionError && (
          <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-4 py-3 text-sm text-[#a12820]">
            {itemActionError}
          </p>
        )}
        {relocationError && (
          <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-4 py-3 text-sm text-[#a12820]">
            {relocationError}
          </p>
        )}
        {relocationSuccess && (
          <p role="status" className="border border-[#b8e3cc] bg-[#effaf3] px-4 py-3 text-sm text-[#087443]">
            {relocationSuccess}
          </p>
        )}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="border-b border-[#ececf1] bg-[#faf9fc] px-5 py-3">
              <h2 className="text-sm font-semibold text-[#2b303b]">
                Thông tin bản sách và đầu sách
              </h2>
            </div>
            <dl className="divide-y divide-[#d9dce5]">
              <InfoRow label="Mã vạch / QR" value={bookItem.barcode} />
              <InfoRow label="Vị trí mặc định" value={getLocationName(bookItem.expectedShelfLevelId)} />
              <InfoRow label="Vị trí hiện tại" value={getLocationName(bookItem.currentShelfLevelId)} />
              <InfoRow label="Kiểm kê gần nhất" value={formatLastInventory(bookItem.lastInventoryAtUtc)} />
              <InfoRow
                label="Trạng thái bản sách"
                value={
                  <span className="inline-flex items-center gap-2">
                    <BookItemStatusBadge status={bookItem.status} />
                    {bookItem.status.trim().toUpperCase() === 'MISPLACED' && (
                      <button
                        type="button"
                        disabled={relocating || !bookItem.expectedShelfLevelId}
                        onClick={() => void handleRelocateBookItem()}
                        aria-label="Sửa lại vị trí của bản thể"
                        title={
                          bookItem.expectedShelfLevelId
                            ? 'Sửa về vị trí mặc định'
                            : 'Chưa có vị trí mặc định'
                        }
                        className="inline-flex h-9 shrink-0 items-center gap-2 border border-[#cbd5e1] px-3 text-sm font-medium text-[#315f9e] hover:bg-[#eff5ff] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {relocating ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5" />
                        )}
                        Sửa lại vị trí của bản thể
                      </button>
                    )}
                  </span>
                }
              />
              <InfoRow label="Tên sách" value={book.title} href={`/book/${book.id}`} />
              <InfoRow label="ISBN" value={book.isbn} />
              <InfoRow label="Tác giả" value={book.author} />
              <InfoRow label="Thể loại" value={book.category?.name || 'Chưa phân loại'} />
              <InfoRow label="Nhà xuất bản" value={book.publisher || '—'} />
              <InfoRow
                label="Năm xuất bản"
                value={book.publicationYear ? String(book.publicationYear) : '—'}
              />
              <InfoRow label="Mô tả sách" value={book.description || '—'} />
            </dl>
          </div>

          <div className="flex min-h-[300px] items-center justify-center overflow-hidden border border-[#d9dce5] bg-white p-4">
            {book.image ? (
              <img
                src={book.image}
                alt={`Bìa sách ${book.title}`}
                className="max-h-[360px] w-full object-contain"
              />
            ) : (
              <div className="text-center text-[#89909f]">
                <Camera className="mx-auto h-12 w-12" />
                <p className="mt-3 text-sm font-medium">Chưa có ảnh bìa</p>
              </div>
            )}
          </div>
        </section>

        {editDialogOpen && (
          <BookItemEditDialog
            item={bookItem}
            shelfLevels={shelfLevels}
            shelves={shelves}
            saving={itemSaving}
            errorMessage={itemFormError}
            onClose={() => setEditDialogOpen(false)}
            onSubmit={handleUpdateBookItem}
          />
        )}
      </div>
    </div>
  )
}
