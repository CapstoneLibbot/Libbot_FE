import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  Eye,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { bookApi } from '@/features/books/api/bookApi'
import { bookItemApi } from '@/features/book-items/api/bookItemApi'
import { shelfApi } from '@/features/shelves/api/shelfApi'
import type { BookCategoryRecord, BookRecord } from '@/features/books/types/book'
import type { BookItemRecord, BookItemWriteRequest } from '@/features/book-items/types/bookItem'
import type { ShelfLevelRecord, ShelfRecord } from '@/features/shelves/types/shelf'
import type { BookItemStatus } from '@/types/enums'
import { getErrorMessage } from '@/services/http/error'
import { BookFormDialog, type BookFormData } from './BookList'

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<BookRecord | null>(null)
  const [items, setItems] = useState<BookItemRecord[]>([])
  const [shelves, setShelves] = useState<ShelfRecord[]>([])
  const [shelfLevels, setShelfLevels] = useState<ShelfLevelRecord[]>([])
  const [shelfLevelsLoading, setShelfLevelsLoading] = useState(true)
  const [shelfLevelsError, setShelfLevelsError] = useState('')
  const [categories, setCategories] = useState<BookCategoryRecord[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  const [bookEditorOpen, setBookEditorOpen] = useState(false)
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const [imageSaving, setImageSaving] = useState(false)
  const [imageFormError, setImageFormError] = useState('')
  const [itemEditor, setItemEditor] = useState<BookItemRecord | 'CREATE' | null>(null)
  const [itemSaving, setItemSaving] = useState(false)
  const [itemFormError, setItemFormError] = useState('')

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true)
    setCategoriesError('')
    try {
      setCategories(await bookApi.getCategories())
    } catch (err) {
      setCategoriesError(getErrorMessage(err))
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const loadShelfLevels = useCallback(async () => {
    setShelfLevelsLoading(true)
    setShelfLevelsError('')
    try {
      const response = await shelfApi.getShelfLevels({
        page: 1,
        pageSize: 20,
        sortBy: 'levelNumber',
        sortOrder: 'asc',
      })
      setShelfLevels(response.items)
    } catch (err) {
      setShelfLevelsError(getErrorMessage(err))
    } finally {
      setShelfLevelsLoading(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setErrorNotice(null)
    try {
      const [bookData, shelvesData] = await Promise.all([
        bookApi.getBookById(id, 'items,category'),
        shelfApi.getShelves({ page: 1, pageSize: 100, expand: 'levels' }).catch(() => ({
          items: [] as ShelfRecord[],
          page: 1,
          pageSize: 100,
          totalCount: 0,
          totalPages: 0,
          sortBy: 'name',
          sortOrder: 'asc',
        })),
      ])
      setBook(bookData)
      setItems((bookData.items ?? []).map((item) => ({ ...item, bookId: bookData.id })))
      setShelves(shelvesData.items || [])
    } catch (err) {
      setErrorNotice(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    void loadShelfLevels()
  }, [loadShelfLevels])

  // Map levelId -> { shelfName, levelName, levelNumber }
  const levelLookup = useMemo(() => {
    const map = new Map<string, { shelfName: string; levelName: string; levelNumber: number }>()
    const shelfNames = new Map(shelves.map((shelf) => [shelf.id, shelf.name]))

    shelfLevels.forEach((level) => {
      map.set(level.id, {
        shelfName: shelfNames.get(level.shelfId) || 'Kệ',
        levelName: level.name || `Tầng ${level.levelNumber}`,
        levelNumber: level.levelNumber,
      })
    })
    return map
  }, [shelves, shelfLevels])

  const handleUpdateBook = async (formData: BookFormData) => {
    if (!id) return
    try {
      const updated = await bookApi.updateBook(id, {
        title: formData.title,
        author: formData.author || '',
        isbn: formData.isbn || '',
        categoryId: formData.category_id ? String(formData.category_id) : null,
        publisher: formData.publisher,
        publicationYear: formData.publication_year,
        image: formData.image_url,
        description: formData.description,
      })
      setBook((prev) => (prev ? { ...prev, ...updated } : updated))
      setBookEditorOpen(false)
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể cập nhật sách'))
    }
  }

  const handleUpdateBookImage = async (image: string) => {
    if (!book) return
    setImageSaving(true)
    setImageFormError('')
    try {
      const updated = await bookApi.updateBook(book.id, {
        title: book.title,
        author: book.author || '',
        isbn: book.isbn || '',
        categoryId: book.categoryId,
        publisher: book.publisher,
        publicationYear: book.publicationYear,
        image,
        description: book.description,
      })
      setBook((current) => (current ? { ...current, ...updated, image: updated.image || image } : updated))
      setImageEditorOpen(false)
    } catch (err) {
      setImageFormError(getErrorMessage(err, 'Không thể cập nhật ảnh bìa'))
    } finally {
      setImageSaving(false)
    }
  }

  const handleSaveItem = async (payload: BookItemWriteRequest) => {
    if (!book) return
    setItemSaving(true)
    setItemFormError('')
    try {
      if (itemEditor === 'CREATE') {
        const created = await bookItemApi.createBookItem({
          ...payload,
          bookId: book.id,
          currentShelfLevelId: payload.expectedShelfLevelId ?? null,
          lastInventoryAtUtc: null,
          status: 'AVAILABLE',
        })
        setItems((prev) => [created, ...prev])
        setBook((prev) => (prev ? { ...prev, totalCopies: (prev.totalCopies ?? items.length) + 1 } : prev))
      } else if (itemEditor) {
        const updated = await bookItemApi.updateBookItem(itemEditor.id, payload)
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      }
      setItemEditor(null)
    } catch (err) {
      setItemFormError(getErrorMessage(err, 'Không thể lưu bản sách'))
    } finally {
      setItemSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-[#596174]">Đang tải thông tin sách và các bản sách...</span>
      </div>
    )
  }

  if (errorNotice || !book) {
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
          <h2 className="text-base font-semibold">Không tìm thấy sách</h2>
          <p className="mt-1 text-sm">{errorNotice || 'Sách này không tồn tại hoặc đã bị xóa.'}</p>
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

  const totalCopies = book.totalCopies ?? items.length
  const correctCount = items.filter(
    (i) => i.expectedShelfLevelId && i.expectedShelfLevelId === i.currentShelfLevelId,
  ).length
  const misplacedCount = items.filter(
    (i) =>
      i.currentShelfLevelId &&
      i.expectedShelfLevelId &&
      i.currentShelfLevelId !== i.expectedShelfLevelId,
  ).length
  const missingCount = items.filter(
    (i) => !i.currentShelfLevelId || i.status.toUpperCase() === 'MISSING',
  ).length

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
        {/* Breadcrumb */}
        <Link
          to="/book"
          className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách sách
        </Link>

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#687386]">ISBN: {book.isbn || 'Chưa có'}</p>
              <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBookEditorOpen(true)}
            className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f1eff5]"
          >
            <Pencil className="h-4 w-4" />
            Sửa thông tin sách
          </button>
        </header>

        {/* Book Details & Cover Grid */}
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="border-b border-[#ececf1] bg-[#faf9fc] px-5 py-3">
              <h2 className="text-sm font-semibold text-[#2b303b]">Thông tin danh mục</h2>
            </div>
            <dl className="divide-y divide-[#d9dce5] text-sm">
              <Detail label="Mã sách" value={book.id} />
              <Detail label="ISBN" value={book.isbn || '—'} />
              <Detail label="Tên sách" value={book.title} />
              <Detail label="Tác giả" value={book.author || '—'} />
              <Detail
                label="Thể loại"
                value={book.category?.name || 'Chưa phân loại'}
              />
              <Detail label="Nhà xuất bản" value={book.publisher || '—'} />
              <Detail
                label="Năm xuất bản"
                value={book.publicationYear ? String(book.publicationYear) : '—'}
              />
              <Detail label="Mô tả" value={book.description || '—'} />
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
              <button
                type="button"
                onClick={() => {
                  setImageFormError('')
                  setImageEditorOpen(true)
                }}
                aria-label="Thêm ảnh bìa cho sách"
                className="flex min-h-[300px] w-full flex-col items-center justify-center text-[#89909f] transition hover:bg-[#faf9fc] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Camera className="mx-auto h-12 w-12" />
                <p className="mt-3 text-sm font-medium">Thêm ảnh bìa</p>
              </button>
            )}
          </div>
        </section>

        {/* Physical Book Items Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Các bản sách</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setItemFormError('')
                setItemEditor('CREATE')
              }}
              className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Thêm bản sách
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryCard label="Tổng số bản" value={totalCopies} tone="text-[#17181c]" />
            <SummaryCard label="Đúng vị trí" value={correctCount} tone="text-[#087443]" />
            <SummaryCard label="Sai vị trí" value={misplacedCount} tone="text-[#a65000]" />
            <SummaryCard label="Không tìm thấy" value={missingCount} tone="text-[#b42318]" />
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]">
                    <th className="px-4 py-3">Mã vạch</th>
                    <th className="px-4 py-3">Tầng kệ mặc định</th>
                    <th className="px-4 py-3">Vị trí thực tế</th>
                    <th className="px-4 py-3">Tình trạng bản sách</th>
                    <th className="px-4 py-3">Kiểm kê gần nhất</th>
                    <th className="w-24 px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? (
                    items.map((item) => (
                      <ItemTableRow
                        key={item.id}
                        item={item}
                        levelLookup={levelLookup}
                        onOpen={() => navigate(`/book-items/${item.id}`)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center text-[#687386]">
                        <BookOpen className="mx-auto h-8 w-8 text-[#89909f]" />
                        <p className="mt-2 font-medium">Chưa có bản sách nào</p>
                        <p className="text-xs text-[#7b8190]">
                          Nhấn &quot;Thêm bản sách&quot; để đăng ký mã vạch và gán vị trí kệ cho sách này.
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

      {/* Book Metadata Edit Dialog */}
      {bookEditorOpen && (
        <BookFormDialog
          title="Cập nhật sách"
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          onRetryCategories={() => void loadCategories()}
          initial={{
            title: book.title,
            author: book.author || null,
            isbn: book.isbn || null,
            category_id: book.categoryId || null,
            publisher: book.publisher || null,
            publication_year: book.publicationYear || null,
            image_url: book.image || null,
            description: book.description || null,
          }}
          onClose={() => setBookEditorOpen(false)}
          onSubmit={handleUpdateBook}
        />
      )}

      {imageEditorOpen && (
        <BookImageDialog
          title={book.title}
          saving={imageSaving}
          errorMessage={imageFormError}
          onClose={() => setImageEditorOpen(false)}
          onSubmit={handleUpdateBookImage}
        />
      )}

      {/* Book Item Create / Edit Dialog */}
      {itemEditor !== null && (
        <BookItemFormDialog
          bookId={book.id}
          item={itemEditor === 'CREATE' ? undefined : itemEditor}
          shelves={shelves}
          shelfLevels={shelfLevels}
          shelfLevelsLoading={shelfLevelsLoading}
          shelfLevelsError={shelfLevelsError}
          onRetryShelfLevels={() => void loadShelfLevels()}
          saving={itemSaving}
          errorMessage={itemFormError}
          onClose={() => setItemEditor(null)}
          onSubmit={handleSaveItem}
        />
      )}
    </div>
  )
}

function ItemTableRow({
  item,
  levelLookup,
  onOpen,
}: {
  item: BookItemRecord
  levelLookup: Map<string, { shelfName: string; levelName: string; levelNumber: number }>
  onOpen: () => void
}) {
  const expected = item.expectedShelfLevelId ? levelLookup.get(item.expectedShelfLevelId) : null
  const current = item.currentShelfLevelId ? levelLookup.get(item.currentShelfLevelId) : null

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Xem chi tiết bản sách ${item.barcode}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      className="cursor-pointer border-b border-[#ececf1] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">
        {item.barcode}
      </td>
      <td className="px-4 py-3.5 text-xs text-[#596174]">
        {expected ? (
          <div>
            <span className="font-semibold text-[#17181c]">{expected.shelfName}</span>
            <span className="block text-[#687386]">{expected.levelName}</span>
          </div>
        ) : (
          <span className="text-[#89909d]">Chưa gán</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-xs text-[#596174]">
        {current ? (
          <div>
            <span className="font-semibold text-[#17181c]">{current.shelfName}</span>
            <span className="block text-[#687386]">{current.levelName}</span>
          </div>
        ) : (
          <span className="text-[#89909d]">Chưa xác định</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <BookItemStatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3.5 text-xs text-[#596174]">
        {item.lastInventoryAtUtc ? (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(item.lastInventoryAtUtc).toLocaleDateString()}
          </span>
        ) : (
          'Chưa kiểm kê'
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onOpen()
            }}
            title="Xem chi tiết bản sách"
            aria-label={`Xem chi tiết bản sách ${item.barcode}`}
            className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function BookItemStatusBadge({ status }: { status: string }) {
  const norm = status.toUpperCase()
  const styles: Record<string, string> = {
    AVAILABLE: 'bg-[#d9f7e7] text-[#087443]',
    MISPLACED: 'bg-[#fff0d8] text-[#a65000]',
    MISSING: 'bg-[#fff0f0] text-[#b42318]',
    DAMAGED: 'bg-[#ffebee] text-[#c62828]',
    BORROWED: 'bg-[#e8efff] text-[#315f9e]',
  }
  const labels: Record<string, string> = {
    AVAILABLE: 'Có sẵn',
    MISPLACED: 'Sai vị trí',
    MISSING: 'Không tìm thấy',
    DAMAGED: 'Bị hư hỏng',
    BORROWED: 'Đang mượn',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        styles[norm] || 'bg-gray-100 text-gray-700'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[norm] || status}
    </span>
  )
}

interface BookItemFormDialogProps {
  bookId: string
  item?: BookItemRecord
  shelves: ShelfRecord[]
  shelfLevels: ShelfLevelRecord[]
  shelfLevelsLoading: boolean
  shelfLevelsError: string
  onRetryShelfLevels: () => void
  saving: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: (data: BookItemWriteRequest) => Promise<void>
}

function BookItemFormDialog({
  bookId,
  item,
  shelves,
  shelfLevels,
  shelfLevelsLoading,
  shelfLevelsError,
  onRetryShelfLevels,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: BookItemFormDialogProps) {
  const [barcode, setBarcode] = useState(item?.barcode ?? '')
  const [expectedLevelId, setExpectedLevelId] = useState<string>(item?.expectedShelfLevelId ?? '')
  const [currentLevelId, setCurrentLevelId] = useState<string>(item?.currentShelfLevelId ?? '')
  const [status, setStatus] = useState<BookItemStatus | string>(
    item?.status?.toUpperCase() ?? 'AVAILABLE',
  )
  const isCreate = !item

  const inputClass =
    'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none focus:border-primary'
  const shelfNames = new Map(shelves.map((shelf) => [shelf.id, shelf.name]))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void onSubmit({
      bookId,
      barcode: barcode.trim(),
      expectedShelfLevelId: expectedLevelId || null,
      currentShelfLevelId: isCreate
        ? expectedLevelId || null
        : currentLevelId === 'NULL' || !currentLevelId
          ? null
          : currentLevelId,
      ...(isCreate ? { lastInventoryAtUtc: null, status: 'AVAILABLE' } : { status }),
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
        aria-labelledby="book-item-dialog-title"
        className="w-full max-w-xl border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex justify-between border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="book-item-dialog-title" className="text-lg font-semibold">
              {item ? 'Cập nhật bản sách' : 'Thêm bản sách'}
            </h2>
            <p className="text-xs text-[#687386]">Mã sách: {bookId}</p>
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
              Mã vạch <span className="text-[#b42318]">*</span>
              <input
                required
                maxLength={50}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ví dụ: LIB-BK-0001..."
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Tầng kệ mặc định
              <select
                required={isCreate}
                value={expectedLevelId}
                onChange={(e) => setExpectedLevelId(e.target.value)}
                disabled={shelfLevelsLoading || Boolean(shelfLevelsError)}
                className={`${inputClass} appearance-none`}
              >
                <option value="">
                  {isCreate ? 'Chọn tầng kệ mặc định' : 'Chưa gán vị trí'}
                </option>
                {shelfLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {shelfNames.get(level.shelfId) || 'Kệ'} → Tầng {level.levelNumber} ({level.name})
                  </option>
                ))}
              </select>
              {shelfLevelsLoading && (
                <p role="status" className="text-xs text-[#687386]">
                  Đang tải danh sách tầng kệ...
                </p>
              )}
              {shelfLevelsError && (
                <div role="alert" className="flex items-center justify-between gap-2 text-xs text-[#a12820]">
                  <span>{shelfLevelsError}</span>
                  <button
                    type="button"
                    onClick={onRetryShelfLevels}
                    className="shrink-0 font-semibold underline"
                  >
                    Thử lại
                  </button>
                </div>
              )}
              {!shelfLevelsLoading && !shelfLevelsError && shelfLevels.length === 0 && (
                <p role="status" className="text-xs text-[#687386]">
                  Chưa có tầng kệ nào trong hệ thống.
                </p>
              )}
            </label>

            {!isCreate && (
              <label className="block space-y-1.5 text-sm font-medium">
                Vị trí thực tế ghi nhận
                <select
                  value={currentLevelId || 'NULL'}
                  onChange={(e) => setCurrentLevelId(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="NULL">Không tìm thấy</option>
                  {shelves.map((s) => (
                    <optgroup key={s.id} label={`Shelf: ${s.name}`}>
                      {s.levels?.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {s.name} → Tầng {lvl.levelNumber} ({lvl.name})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            )}

            {!isCreate && (
              <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
                Tình trạng bản sách
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="AVAILABLE">Có thể cho mượn (AVAILABLE)</option>
                  <option value="MISPLACED">Sai vị trí (MISPLACED)</option>
                  <option value="MISSING">Không tìm thấy (MISSING)</option>
                  <option value="DAMAGED">Hư hỏng (DAMAGED)</option>
                  <option value="BORROWED">Đang mượn (BORROWED)</option>
                </select>
              </label>
            )}
          </div>

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
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                (isCreate &&
                  (shelfLevelsLoading || Boolean(shelfLevelsError) || shelfLevels.length === 0))
              }
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saving ? 'Đang lưu...' : item ? 'Lưu thay đổi' : 'Thêm bản sách'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
      <dt className="text-[#687386]">{label}</dt>
      <dd className="font-medium text-[#17181c]">{value}</dd>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="border border-[#d9dce5] bg-white px-4 py-3">
      <p className="text-xs uppercase text-[#687386]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

const MAX_BOOK_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

function BookImageDialog({
  title,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: {
  title: string
  saving: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: (image: string) => Promise<void>
}) {
  const [image, setImage] = useState('')
  const [imageError, setImageError] = useState('')
  const [previewError, setPreviewError] = useState(false)
  const [isReadingImage, setIsReadingImage] = useState(false)

  function handleImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setImageError('Vui lòng chọn tệp hình ảnh.')
      return
    }

    if (file.size > MAX_BOOK_IMAGE_SIZE_BYTES) {
      setImageError('Ảnh không được vượt quá 5 MB.')
      return
    }

    setImageError('')
    setIsReadingImage(true)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setImageError('Không thể đọc tệp ảnh này.')
        setIsReadingImage(false)
        return
      }

      setImage(reader.result)
      setPreviewError(false)
      setIsReadingImage(false)
    }
    reader.onerror = () => {
      setImageError('Không thể đọc tệp ảnh này.')
      setIsReadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!image.trim()) {
      setImageError('Vui lòng chọn tệp ảnh.')
      return
    }
    void onSubmit(image.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving && !isReadingImage) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-image-dialog-title"
        className="w-full max-w-lg border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="book-image-dialog-title" className="text-lg font-semibold">
              Thêm ảnh bìa
            </h2>
            <p className="text-xs text-[#687386]">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || isReadingImage}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block text-sm font-medium">
            Tải ảnh từ thiết bị (tối đa 5 MB)
            <input
              type="file"
              accept="image/*"
              disabled={isReadingImage}
              onChange={handleImageFile}
              className="mt-1.5 block w-full text-sm text-[#596174] file:mr-3 file:border-0 file:bg-[#f1eff5] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#3f4654] hover:file:bg-[#e8e6ee] disabled:opacity-50"
            />
          </label>

          {isReadingImage && (
            <p role="status" className="text-xs text-[#687386]">
              Đang đọc ảnh...
            </p>
          )}
          {imageError && (
            <p role="alert" className="text-xs text-[#a12820]">
              {imageError}
            </p>
          )}
          {errorMessage && (
            <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">
              {errorMessage}
            </p>
          )}

          {image && !previewError && (
            <img
              src={image}
              alt={`Xem trước ảnh bìa ${title}`}
              onError={() => setPreviewError(true)}
              className="max-h-48 max-w-full border border-[#d9dce5] bg-white object-contain p-2"
            />
          )}
          {image && previewError && (
            <p role="status" className="text-xs text-[#a12820]">
              Không thể xem trước tệp ảnh đã chọn. Vui lòng chọn tệp khác.
            </p>
          )}

          <footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || isReadingImage}
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || isReadingImage || !image.trim()}
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saving ? 'Đang lưu...' : 'Cập nhật ảnh'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
