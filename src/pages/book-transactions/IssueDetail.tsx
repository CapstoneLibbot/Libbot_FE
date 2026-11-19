import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { bookTransactionApi } from '@/features/book-transactions'
import type { BookIssueRecord } from '@/features/book-transactions'
import IssueDraftEditor from './components/IssueDraftEditor'
import IssueLockedView from './components/IssueLockedView'

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [issue, setIssue] = useState<BookIssueRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    bookTransactionApi
      .getIssueById(id)
      .then((data) => {
        setIssue(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Không thể tải thông tin phiếu xuất.')
        setIsLoading(false)
      })
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Đang tải thông tin phiếu xuất...
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy phiếu xuất</h2>
        <p className="mt-1 text-sm text-slate-500">
          {error || 'Không thể tải phiếu xuất được yêu cầu.'}
        </p>
        <button
          onClick={() => navigate('/book-transactions?tab=issues')}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại giao dịch sách
        </button>
      </div>
    )
  }

  // Render editable Draft Editor if issue is in DRAFT status
  if (issue.status === 'DRAFT') {
    return <IssueDraftEditor issue={issue} onUpdate={setIssue} />
  }

  // Render locked read-only view with review & workflow transitions
  return <IssueLockedView issue={issue} onUpdate={setIssue} />
}
