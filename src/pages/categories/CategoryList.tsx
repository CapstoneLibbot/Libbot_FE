import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Eye, Loader2, Plus, Search, Tags, X } from 'lucide-react'
import { useNavigate } from 'react-router'

import { bookApi } from '@/features/books/api/bookApi'
import type { BookCategoryRecord } from '@/features/books/types/book'
import { getErrorMessage } from '@/services/http/error'

export default function CategoryList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<BookCategoryRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      setCategories(await bookApi.getCategories())
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Không thể tải danh sách thể loại sách.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return categories
    return categories.filter((category) => category.name.toLocaleLowerCase().includes(query))
  }, [categories, search])

  const openCategory = (categoryId: string) => {
    navigate(`/book-categories/${categoryId}`)
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Tags className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Thể loại sách</h1>
              <p className="mt-0.5 text-sm text-[#596174]">
                Quản lý các thể loại trong danh mục sách.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Tạo thêm thể loại sách
          </button>
        </header>

        {errorMessage && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] px-4 py-3 text-sm text-[#a12820]"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </span>
            <button type="button" onClick={() => void loadCategories()} className="font-semibold underline">
              Thử lại
            </button>
          </div>
        )}

        <div className="relative w-full max-w-[350px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Tìm thể loại theo tên"
            placeholder="Tìm theo tên thể loại..."
            className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#7b8190] focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#687386]">
          <p>Hiển thị {filteredCategories.length}/{categories.length} thể loại</p>
          {isLoading && (
            <span role="status" className="flex items-center gap-1.5 text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải dữ liệu...
            </span>
          )}
        </div>

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Tên thể loại
                  </th>
                  <th className="w-24 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Xem chi tiết thể loại ${category.name}`}
                      onClick={() => openCategory(category.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openCategory(category.id)
                        }
                      }}
                      className="cursor-pointer border-b border-[#ececf1] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <td className="px-4 py-4 font-medium">{category.name}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          title={`Xem chi tiết ${category.name}`}
                          aria-label={`Xem chi tiết ${category.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            openCategory(category.id)
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-14 text-center">
                      <Tags className="mx-auto h-8 w-8 text-[#89909f]" />
                      <p className="mt-3 font-medium text-[#3f4654]">
                        {search.trim() ? 'Không tìm thấy thể loại' : 'Chưa có thể loại sách'}
                      </p>
                      <p className="mt-1 text-sm text-[#7b8190]">
                        {search.trim()
                          ? 'Hãy thử thay đổi từ khóa tìm kiếm.'
                          : 'Danh sách thể loại sẽ xuất hiện tại đây.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCreateOpen && <CategoryCreateDialog onClose={() => setIsCreateOpen(false)} />}
    </div>
  )
}

function CategoryCreateDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-create-title"
        className="w-full max-w-lg border border-[#d9dce5] bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4">
          <div>
            <h2 id="category-create-title" className="text-lg font-semibold">
              Tạo thêm thể loại sách
            </h2>
            <p className="mt-1 text-sm text-[#687386]">Nhập tên và mô tả thể loại.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          onSubmit={(event) => event.preventDefault()}
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
          <p role="status" className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            API tạo thể loại chưa có. Thông tin chưa thể lưu; nút tạo sẽ khả dụng khi API được bổ sung.
          </p>
          <footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled
              title="Chưa có API tạo thể loại"
              className="h-10 bg-primary px-4 text-sm font-semibold text-white opacity-50"
            >
              Tạo thể loại
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
