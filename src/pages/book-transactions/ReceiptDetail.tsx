import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { bookTransactionApi } from '@/features/book-transactions'
import type { BookReceiptRecord } from '@/features/book-transactions'
import ReceiptDraftEditor from './components/ReceiptDraftEditor'
import ReceiptLockedView from './components/ReceiptLockedView'

export default function ReceiptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [receipt, setReceipt] = useState<BookReceiptRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    bookTransactionApi
      .getReceiptById(id)
      .then((data) => {
        setReceipt(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Không thể tải thông tin phiếu nhập.')
        setIsLoading(false)
      })
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Đang tải thông tin phiếu nhập...
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy phiếu nhập</h2>
        <p className="mt-1 text-sm text-slate-500">
          {error || 'Không thể tải phiếu nhập được yêu cầu.'}
        </p>
        <button
          onClick={() => navigate('/book-transactions')}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại giao dịch sách
        </button>
      </div>
    )
  }

  // Render editable Draft Editor if receipt is in DRAFT status
  if (receipt.status === 'DRAFT') {
    return <ReceiptDraftEditor receipt={receipt} onUpdate={setReceipt} />
  }

  // Render locked read-only view with review & approval workflow if submitted/approved/completed/cancelled
  return <ReceiptLockedView receipt={receipt} onUpdate={setReceipt} />
}
