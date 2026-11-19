import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BookOpen, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router'

import { bookApi } from '@/features/books/api/bookApi'
import { getErrorMessage } from '@/services/http/error'
import type { BookCategoryRecord, BookRecord } from '@/features/books/types/book'
import { initialBookCategories, initialBooks } from '../../lib/mapData'

function BookList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('ALL')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [books, setBooks] = useState<BookRecord[]>([])
  const [categories, setCategories] = useState<BookCategoryRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [apiNotice, setApiNotice] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    Promise.all([
      bookApi.getBooks({
        searchTerm: search.trim() || undefined,
        categoryId: categoryId === 'ALL' ? undefined : categoryId,
        page: 1,
        pageSize: 50,
      }),
      bookApi.getCategories(),
    ])
      .then(([booksData, catsData]) => {
        if (!isMounted) return
        setBooks(booksData.items)
        setTotalCount(booksData.totalCount)
        setCategories(catsData)
        setApiNotice(null)
      })
      .catch((err) => {
        if (!isMounted) return
        const msg = getErrorMessage(err)
        setApiNotice(`${msg} (Showing sample data)`)

        // Fallback to sample data when server is offline
        const term = search.trim().toLowerCase()
        const filtered = initialBooks
          .filter((book) => {
            const matchesSearch =
              !term ||
              [book.isbn || '', book.title, book.author || ''].some((value) =>
                value.toLowerCase().includes(term),
              )
            const matchesCategory =
              categoryId === 'ALL' || String(book.category_id) === categoryId
            return matchesSearch && matchesCategory
          })
          .map((b) => ({
            id: String(b.id),
            categoryId: b.category_id ? String(b.category_id) : null,
            isbn: b.isbn || '',
            title: b.title,
            author: b.author || '',
            publisher: b.publisher,
            publicationYear: b.publication_year,
            image: b.image_url,
            description: b.description,
          }))

        setBooks(filtered)
        setTotalCount(filtered.length)
        setCategories(
          initialBookCategories.map((c) => ({
            id: String(c.id),
            name: c.name,
            description: null,
          })),
        )
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [categoryId, refreshKey, search])

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const hasFilters = search !== '' || categoryId !== 'ALL'
  const clearFilters = () => {
    setSearch('')
    setCategoryId('ALL')
  }

  const handleCreateBook = async (data: BookFormData) => {
    try {
      await bookApi.createBook({
        title: data.title,
        author: data.author || '',
        isbn: data.isbn || '',
        categoryId: data.category_id ? String(data.category_id) : null,
        publisher: data.publisher,
        publicationYear: data.publication_year,
        image: data.image_url,
        description: data.description,
      })
      setIsCreateOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert(getErrorMessage(err, 'Could not create book'))
    }
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sách</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Tra cứu danh mục sách của thư viện.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Thêm sách
          </button>
        </header>

        {apiNotice && (
          <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{apiNotice}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm ISBN, tên sách hoặc tác giả..."
              className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#7b8190] focus:border-primary"
            />
          </div>
          <div className="relative w-48">
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              aria-label="Lọc theo thể loại"
              className="h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm outline-none focus:border-primary"
            >
              <option value="ALL">Tất cả thể loại</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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
          <p>Hiển thị {books.length}/{totalCount} sách</p>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải dữ liệu...
            </span>
          )}
        </div>

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <Header>ISBN</Header>
                  <Header>Tên sách</Header>
                  <Header>Tác giả</Header>
                  <Header>Thể loại</Header>
                  <Header>Bản sao (Có sẵn / Tổng số)</Header>
                </tr>
              </thead>
              <tbody>
                {books.length > 0 ? (
                  books.map((book) => (
                    <tr
                      key={book.id}
                      onClick={() => navigate(`/book/${book.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/book/${book.id}`)
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Mở ${book.title}`}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <td className="px-4 py-4 font-mono text-xs text-[#596174]">
                        {book.isbn || '—'}
                      </td>
                      <td className="px-4 py-4 font-medium">{book.title}</td>
                      <td className="px-4 py-4 text-[#596174]">{book.author || '—'}</td>
                      <td className="px-4 py-4 text-[#596174]">
                        {book.categoryId
                          ? categoryNames.get(book.categoryId) || 'Chưa phân loại'
                          : 'Chưa phân loại'}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <span className="font-semibold text-[#087443]">{book.availableCopies ?? 0}</span>
                        <span className="text-[#687386]"> / {book.totalCopies ?? 0} bản sao</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <BookOpen className="mx-auto h-8 w-8 text-[#89909f]" />
                      <p className="mt-3 font-medium text-[#3f4654]">Không tìm thấy sách</p>
                      <p className="mt-1 text-sm text-[#7b8190]">
                        Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc thể loại.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <BookFormDialog
          title="Thêm sách"
          categories={categories}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateBook}
        />
      )}
    </div>
  )
}

function Header({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
      {children}
    </th>
  )
}

export type BookFormData = {
  category_id: string | number | null
  isbn: string | null
  title: string
  author: string | null
  image_url: string | null
  description: string | null
  publisher: string | null
  publication_year: number | null
}

export function BookFormDialog({
  title,
  initial,
  categories,
  onClose,
  onSubmit,
}: {
  title: string
  initial?: BookFormData
  categories?: BookCategoryRecord[]
  onClose: () => void
  onSubmit: (data: BookFormData) => void
}) {
  const [form, setForm] = useState<BookFormData>(
    initial || {
      category_id: null,
      isbn: null,
      title: '',
      author: null,
      image_url: null,
      description: null,
      publisher: null,
      publication_year: null,
    },
  )

  const activeCategories = categories || initialBookCategories.map((c) => ({
    id: String(c.id),
    name: c.name,
  }))

  const input =
    'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm outline-none focus:border-primary'

  const stringField = (
    key: 'isbn' | 'title' | 'author' | 'image_url' | 'description' | 'publisher',
    label: string,
    required = false,
  ) => (
    <label className={`text-sm font-medium ${key === 'description' ? 'sm:col-span-2' : ''}`}>
      {label}
      {key === 'description' ? (
        <textarea
          required={required}
          value={form[key] || ''}
          onChange={(event) =>
            setForm({ ...form, [key]: event.target.value || null })
          }
          className={`${input} mt-1.5 h-20 py-2`}
        />
      ) : (
        <input
          required={required}
          maxLength={key === 'isbn' ? 20 : key === 'image_url' ? 1000 : 255}
          value={form[key] || ''}
          onChange={(event) =>
            setForm({ ...form, [key]: event.target.value || null })
          }
          className={`${input} mt-1.5`}
        />
      )}
    </label>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151922]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-form-title"
        className="my-auto w-full max-w-2xl border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="book-form-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#687386]">Thông tin sách trong danh mục</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(form)
          }}
          className="space-y-4 px-5 py-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {stringField('isbn', 'ISBN')}
            {stringField('title', 'Tên sách', true)}
            {stringField('author', 'Tác giả')}
            <label className="text-sm font-medium">
              Thể loại
              <select
                value={form.category_id ? String(form.category_id) : ''}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category_id: event.target.value || null,
                  })
                }
                className={`${input} mt-1.5`}
              >
                <option value="">Chưa phân loại</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            {stringField('publisher', 'Nhà xuất bản')}
            <label className="text-sm font-medium">
              Năm xuất bản
              <input
                min={1}
                type="number"
                value={form.publication_year || ''}
                onChange={(event) =>
                  setForm({
                    ...form,
                    publication_year: event.target.value ? Number(event.target.value) : null,
                  })
                }
                className={`${input} mt-1.5`}
              />
            </label>
            {stringField('image_url', 'Đường dẫn ảnh')}
            {stringField('description', 'Mô tả')}
          </div>
          <footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-10 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Lưu
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default BookList
