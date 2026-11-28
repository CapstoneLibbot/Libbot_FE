import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Link } from 'react-router'
import { signalRClient } from '@/features/maps/services/signalRClient'
import type { LibrarianNotificationEvent } from '@/features/dispatch/types'

type PatrolAlert = LibrarianNotificationEvent & {
  imageUrl?: string
  confidence?: number
  pathId?: string
}

export default function LibrarianPatrolAlert() {
  const [alert, setAlert] = useState<PatrolAlert | null>(null)

  useEffect(() => {
    void signalRClient.subscribeLibrarian()
    const unsubscribe = signalRClient.subscribe<PatrolAlert>('LibrarianNotification', (notification) => {
      if (notification.type !== 'LEANING_BOOK_DETECTED') return
      setAlert(notification)
    })
    return () => {
      unsubscribe()
      void signalRClient.unsubscribeLibrarian()
    }
  }, [])

  if (!alert) return null

  return (
    <aside role="alert" className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] gap-3 border border-amber-300 bg-white p-4 shadow-xl">
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-semibold text-[#222631]">Sách bị nghiêng</p>
        <p className="text-sm text-[#596174]">{alert.message}</p>
        {typeof alert.confidence === 'number' && <p className="text-xs text-[#89909d]">Confidence: {(alert.confidence * 100).toFixed(0)}%</p>}
        {alert.jobId && (
          <Link className="inline-block text-sm font-semibold text-primary underline" to={`/tasks/${alert.jobId}`}>
            Mở báo cáo tuần tra
          </Link>
        )}
      </div>
      <button aria-label="Đóng cảnh báo" className="self-start text-[#89909d] hover:text-[#222631]" onClick={() => setAlert(null)}>
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </aside>
  )
}
