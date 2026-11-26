import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { bookApi } from '@/features/books/api/bookApi'
import type {
  BookCategoryRecord,
  BookCategoryWriteRequest,
} from '@/features/books/types/book'
import { getErrorMessage } from '@/services/http/error'
import { initialBooks } from '@/lib/mapData'

type SampleBook = {
  id: string
  title: string
  author: string | null
  publicationYear: number | null
}

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<BookCategoryRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadCategory = useCallback(async () => {
    if (!id) {
      setErrorMessage('Không tìm thấy mã thể loại sách.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      setCategory(await bookApi.getCategoryById(id))
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Không thể tải thông tin thể loại sách.'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadCategory()
  }, [loadCategory])

  const sampleBooks = useMemo<SampleBook[]>(() => {
    const relatedBooks = initialBooks.filter(
      (book) => String(book.category_id ?? '') === String(id ?? ''),
    )
    const displayBooks = relatedBooks.length > 0 ? relatedBooks : initialBooks.slice(0, 3)
    return displayBooks.map((book) => ({
      id: String(book.id),
      title: book.title,
      author: book.author,
      publicationYear: book.publication_year ?? null,
    }))
  }, [id])

  async function handleUpdateCategory(payload: BookCategoryWriteRequest) {
    if (!id || !category) return
    setIsSaving(true)
    setEditError('')
    try {
      const updated = await bookApi.updateCategory(id, payload)
      setCategory({ ...category, ...updated, ...payload })
      setIsEditOpen(false)
    } catch (error) {
      setEditError(getErrorMessage(error, 'Không thể cập nhật thể loại sách.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteCategory() {
    if (!id || !category) return
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa thể loại "${category.name}" không?`,
    )
    if (!confirmed) return

    setIsDeleting(true)
    setDeleteError('')
    try {
      await bookApi.deleteCategory(id)
      navigate('/book-categories', { replace: true })
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Không thể xóa thể loại sách.'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 text-sm text-[#687386]">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Đang tải thông tin thể loại...
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
        <button
          type="button"
          onClick={() => navigate('/book-categories')}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách thể loại
        </button>
        <div role="alert" className="border border-[#efc7c4] bg-[#fff1f0] p-4 text-sm text-[#a12820]">
          <p>{errorMessage || 'Không tìm thấy thể loại sách.'}</p>
          <button
            type="button"
            onClick={() => void loadCategory()}
            className="mt-2 font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate('/book-categories')}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách thể loại
        </button>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Tags className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Chi tiết thể loại sách</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditError('')
                setIsEditOpen(true)
              }}
              className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-semibold text-[#3f4654] hover:bg-[#f1eff5]"
            >
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteCategory()}
              disabled={isDeleting}
              className="flex h-10 items-center gap-2 border border-[#efc7c4] bg-white px-4 text-sm font-semibold text-[#b42318] hover:bg-[#fff1f0] disabled:opacity-50"
            >
              {isDeleting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </header>

        {deleteError && (
          <div role="alert" className="flex items-center gap-2 border border-[#efc7c4] bg-[#fff1f0] px-4 py-3 text-sm text-[#a12820]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {deleteError}
          </div>
        )}

        <section className="overflow-hidden border border-[#d9dce5] bg-white">
          <h2 className="border-b border-[#e4e6eb] px-5 py-4 text-base font-semibold">
            Thông tin thể loại
          </h2>
          <dl className="divide-y divide-[#ececf1]">
            <DetailRow label="Tên thể loại" value={category.name} />
            <DetailRow label="Mô tả" value={category.description || 'Chưa có mô tả'} />
          </dl>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Danh sách sách thuộc thể loại</h2>
              <p className="mt-0.5 text-sm text-[#687386]">
                Dữ liệu minh họa, hiện chưa kết nối API danh sách sách theo thể loại.
              </p>
            </div>
            <span className="text-xs text-[#687386]">{sampleBooks.length} sách mẫu</span>
          </div>

          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                      Tên sách
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                      Tác giả
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                      Năm xuất bản
                    </th>
                    <th className="w-24 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sampleBooks.map((book) => (
                    <tr key={book.id} className="border-b border-[#ececf1] last:border-b-0">
                      <td className="px-4 py-4 font-medium">{book.title}</td>
                      <td className="px-4 py-4 text-[#596174]">{book.author || 'Chưa rõ'}</td>
                      <td className="px-4 py-4 text-[#596174]">{book.publicationYear ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          title={`Xem chi tiết ${book.title}`}
                          aria-label={`Xem chi tiết ${book.title}`}
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="inline-flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {isEditOpen && (
        <CategoryEditDialog
          category={category}
          saving={isSaving}
          errorMessage={editError}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdateCategory}
        />
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-5 py-3.5 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-[#687386]">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm font-medium text-[#17181c]">{value}</dd>
    </div>
  )
}

function CategoryEditDialog({
  category,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: {
  category: BookCategoryRecord
  saving: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: (payload: BookCategoryWriteRequest) => void
}) {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description || '')

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
        aria-labelledby="category-edit-title"
        className="w-full max-w-lg border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="category-edit-title" className="text-lg font-semibold">
              Chỉnh sửa thể loại sách
            </h2>
            <p className="mt-1 text-sm text-[#687386]">{category.name}</p>
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

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit({ name: name.trim(), description: description.trim() || null })
          }}
          className="space-y-4 p-5"
        >
          <label className="block space-y-1.5 text-sm font-medium">
            Tên thể loại
            <input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm font-normal outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Mô tả
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={4}
              className="w-full resize-y border border-[#d7d9e2] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-primary"
            />
          </label>

          {errorMessage && (
            <p role="alert" className="flex items-center gap-2 border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
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
              disabled={saving || !name.trim()}
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
