export interface BookRecord {
  id: string
  categoryId: string | null
  isbn: string
  title: string
  author: string
  publisher: string | null
  publicationYear: number | null
  image: string | null
  createdAtUtc: string
  updatedAtUtc: string | null
}

export interface BookCategoryRecord {
  id: string
  name: string
  description: string | null
}

export interface BookWriteRequest {
  categoryId: string | null
  isbn: string
  title: string
  author: string
  publisher: string | null
  publicationYear: number | null
  image: string | null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json() as { message?: string; title?: string }
      message = body.message ?? body.title ?? message
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const bookApi = {
  list: () => request<BookRecord[]>('/api/books'),
  listCategories: () => request<BookCategoryRecord[]>('/api/book-categories'),
  create: (book: BookWriteRequest) => request<BookRecord>('/api/books', {
    method: 'POST',
    body: JSON.stringify(book),
  }),
  update: (id: string, book: BookWriteRequest) => request<BookRecord>(`/api/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(book),
  }),
  delete: (id: string) => request<void>(`/api/books/${id}`, { method: 'DELETE' }),
}
