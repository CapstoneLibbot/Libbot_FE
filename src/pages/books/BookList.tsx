import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Image, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { bookApi } from '@/lib/bookApi'
import type { BookCategoryRecord, BookRecord, BookWriteRequest } from '@/lib/bookApi'

type BookForm = {
  categoryId: string
  isbn: string
  title: string
  author: string
  publisher: string
  publicationYear: string
  image: string
}

const emptyForm: BookForm = {
  categoryId: '',
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  publicationYear: '',
  image: '',
}

const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary disabled:bg-[#f5f5f7]'
const selectClassName = `${inputClassName} appearance-none`

function toForm(book: BookRecord): BookForm {
  return {
    categoryId: book.categoryId ?? '',
    isbn: book.isbn,
    title: book.title,
    author: book.author,
    publisher: book.publisher ?? '',
    publicationYear: book.publicationYear?.toString() ?? '',
    image: book.image ?? '',
  }
}

function toRequest(form: BookForm): BookWriteRequest {
  return {
    categoryId: form.categoryId || null,
    isbn: form.isbn.trim(),
    title: form.title.trim(),
    author: form.author.trim(),
    publisher: form.publisher.trim() || null,
    publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
    image: form.image.trim() || null,
  }
}

function BookList() {
  const [books, setBooks] = useState<BookRecord[]>([])
  const [categories, setCategories] = useState<BookCategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [activeBook, setActiveBook] = useState<BookRecord | null>(null)
  const [form, setForm] = useState<BookForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  async function loadBooks() {
    setLoading(true)
    setLoadError('')
    try {
      setBooks(await bookApi.list())
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load books.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBooks()
    void bookApi.listCategories()
      .then((items) => {
        setCategories(items)
        setCategoryError('')
      })
      .catch((error: unknown) => {
        setCategoryError(error instanceof Error ? error.message : 'Could not load categories.')
      })
  }, [])

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const filteredBooks = useMemo(() => {
    const term = search.trim().toLowerCase()
    return books.filter((book) => {
      const matchesTerm = !term || [book.title, book.author, book.isbn, book.publisher ?? '']
        .some((value) => value.toLowerCase().includes(term))
      return matchesTerm && (categoryFilter === 'all' || book.categoryId === categoryFilter)
    })
  }, [books, categoryFilter, search])

  function openCreate() {
    setActiveBook(null)
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(book: BookRecord) {
    setActiveBook(book)
    setForm(toForm(book))
    setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const saved = activeBook
        ? await bookApi.update(activeBook.id, toRequest(form))
        : await bookApi.create(toRequest(form))
      setBooks((current) => activeBook
        ? current.map((book) => book.id === saved.id ? saved : book)
        : [saved, ...current])
      setFormOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this book.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(book: BookRecord) {
    if (!window.confirm(`Delete "${book.title}" from the catalog?`)) return
    setDeletingId(book.id)
    setLoadError('')
    try {
      await bookApi.delete(book.id)
      setBooks((current) => current.filter((item) => item.id !== book.id))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not delete this book.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#17181c]">Books</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Library catalog records</p>
            </div>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add book
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Catalog summary">
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Total books</p>
            <p className="mt-1 text-xl font-semibold">{books.length}</p>
          </div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Categories</p>
            <p className="mt-1 text-xl font-semibold">{categories.length}</p>
          </div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-[#687386]">Showing</p>
            <p className="mt-1 text-xl font-semibold">{filteredBooks.length}</p>
          </div>
        </section>

        <section className="space-y-4" aria-label="Book catalog">
          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_220px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search title, author, ISBN or publisher" aria-label="Search books" className={`${inputClassName} pl-9`} />
            </label>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category" className={selectClassName}>
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <button type="button" onClick={() => void loadBooks()} disabled={loading} title="Refresh catalog" aria-label="Refresh catalog" className="inline-flex h-10 items-center justify-center gap-2 border border-[#d7d9e2] bg-white px-3 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {categoryError && <p role="status" className="border border-[#ecd9a8] bg-[#fff8e8] px-3 py-2 text-sm text-[#765600]">Categories could not be loaded: {categoryError}</p>}
          {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] px-4 py-3 text-sm text-[#a12820]"><span>{loadError}. Check that the backend is running at localhost:5205.</span><button type="button" onClick={() => void loadBooks()} className="font-semibold underline">Retry</button></div>}

          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Book</th>
                    <th scope="col" className="px-4 py-3">ISBN</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Publisher</th>
                    <th scope="col" className="px-4 py-3">Year</th>
                    <th scope="col" className="w-24 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-[#687386]">Loading books...</td></tr>
                  ) : filteredBooks.length ? filteredBooks.map((book) => (
                    <tr key={book.id} className="border-b border-[#ececf1] last:border-0 hover:bg-[#fafafd]">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {book.image ? <img src={book.image} alt="" className="h-12 w-9 shrink-0 border border-[#e4e6eb] object-cover" /> : <div className="flex h-12 w-9 shrink-0 items-center justify-center border border-[#e4e6eb] bg-[#f5f6f8] text-[#89909d]"><Image className="h-4 w-4" /></div>}
                          <div className="min-w-0"><p className="truncate font-semibold text-[#17181c]">{book.title}</p><p className="mt-0.5 truncate text-xs text-[#687386]">{book.author}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#414856]">{book.isbn}</td>
                      <td className="px-4 py-3 text-[#414856]">{book.categoryId ? categoryNames.get(book.categoryId) ?? 'Unknown category' : 'Uncategorized'}</td>
                      <td className="px-4 py-3 text-[#596174]">{book.publisher || '—'}</td>
                      <td className="px-4 py-3 text-[#596174]">{book.publicationYear ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openEdit(book)} title={`Edit ${book.title}`} aria-label={`Edit ${book.title}`} className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={() => void handleDelete(book)} disabled={deletingId === book.id} title={`Delete ${book.title}`} aria-label={`Delete ${book.title}`} className="flex h-8 w-8 items-center justify-center text-[#8d4a46] hover:bg-[#fff1f0] hover:text-[#b42318] disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-14 text-center"><p className="font-medium text-[#414856]">{loadError ? 'Catalog unavailable' : 'No books found'}</p><p className="mt-1 text-sm text-[#687386]">{loadError ? 'Retry after starting the backend.' : 'Try a different search or add a book to the catalog.'}</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#d9dce5] px-4 py-3 text-xs text-[#687386]">Showing {filteredBooks.length} of {books.length} books</div>
          </div>
        </section>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151922]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setFormOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="book-form-title" className="my-auto w-full max-w-2xl border border-[#d9dce5] bg-white shadow-xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#e4e6eb] px-5 py-4 sm:px-6">
              <div><h2 id="book-form-title" className="text-lg font-semibold">{activeBook ? 'Edit book' : 'Add book'}</h2><p className="mt-1 text-sm text-[#687386]">Book catalog details</p></div>
              <button type="button" onClick={() => setFormOpen(false)} disabled={saving} aria-label="Close form" title="Close" className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"><X className="h-4 w-4" /></button>
            </header>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 px-5 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-medium">ISBN <span className="text-[#b42318]">*</span><input required maxLength={30} value={form.isbn} onChange={(event) => setForm({ ...form, isbn: event.target.value })} className={inputClassName} /></label>
                <label className="block space-y-1.5 text-sm font-medium">Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className={selectClassName}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Title <span className="text-[#b42318]">*</span><input required maxLength={250} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClassName} /></label>
                <label className="block space-y-1.5 text-sm font-medium">Author <span className="text-[#b42318]">*</span><input required maxLength={200} value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className={inputClassName} /></label>
                <label className="block space-y-1.5 text-sm font-medium">Publisher<input maxLength={200} value={form.publisher} onChange={(event) => setForm({ ...form, publisher: event.target.value })} className={inputClassName} /></label>
                <label className="block space-y-1.5 text-sm font-medium">Publication year<input type="number" min="0" max="9999" value={form.publicationYear} onChange={(event) => setForm({ ...form, publicationYear: event.target.value })} className={inputClassName} /></label>
                <label className="block space-y-1.5 text-sm font-medium">Cover image URL<input type="url" maxLength={1000} value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..." className={inputClassName} /></label>
              </div>
              {formError && <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">{formError}</p>}
              <footer className="flex flex-wrap justify-end gap-2 border-t border-[#e4e6eb] pt-4">
                <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="h-10 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f5f5f7]">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{saving && <RefreshCw className="h-4 w-4 animate-spin" />}{saving ? 'Saving...' : activeBook ? 'Save changes' : 'Create book'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default BookList
