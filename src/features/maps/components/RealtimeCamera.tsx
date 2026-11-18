import { useMemo, useState } from 'react'
import { Camera, RefreshCw } from 'lucide-react'

import { getCameraStreamUrl } from '../api/runtimeApi'

type RealtimeCameraProps = {
  runtimeId: string
  connected: boolean
  mappingActive: boolean
  scanActive?: boolean
  latestScan?: { barcode: string; known: boolean; misplaced: boolean; status?: string } | null
}

export default function RealtimeCamera({
  runtimeId,
  connected,
  mappingActive,
  scanActive = false,
  latestScan = null,
}: RealtimeCameraProps) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const streamUrl = useMemo(
    () => getCameraStreamUrl(runtimeId, attempt),
    [runtimeId, attempt],
  )

  const reconnect = () => {
    setFailed(false)
    setAttempt((value) => value + 1)
  }

  return (
    <section
      className="flex min-w-0 flex-col overflow-hidden border border-[#d9dce5] bg-white"
      aria-label="Camera robot trực tiếp"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#d9dce5] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[#252933]">Camera AI quét barcode</h3>
          <p className="mt-0.5 text-xs text-[#747b8b]">IMX500 · video trực tiếp</p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${
            connected && !failed
              ? 'bg-[#d9f7e7] text-[#087443]'
              : 'bg-[#fee8e8] text-[#b42318]'
          }`}
        >
          {connected && !failed
            ? mappingActive
              ? 'LIVE · MAPPING'
              : 'LIVE'
            : 'OFFLINE'}
        </span>
      </div>

      <div className="relative grid min-h-[280px] flex-1 place-items-center bg-[#101820]">
        {connected ? (
          <img
            key={attempt}
            src={streamUrl}
            alt="Hình ảnh trực tiếp từ camera robot"
            className="h-full min-h-[280px] w-full object-contain"
            onLoad={() => setFailed(false)}
            onError={() => setFailed(true)}
          />
        ) : (
          <Camera className="h-10 w-10 text-slate-500" />
        )}

        {(!connected || failed) && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 bg-[#101820] p-6 text-center text-sm text-slate-300">
            <Camera className="h-8 w-8 text-slate-500" />
            <span>
              {connected
                ? 'Không nhận được hình ảnh camera.'
                : 'Robot đang mất kết nối.'}
            </span>

            {connected && (
              <button
                type="button"
                onClick={reconnect}
                className="inline-flex items-center gap-2 border border-slate-500 bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Kết nối lại
              </button>
            )}
          </div>
        )}

        {connected && !failed && scanActive && (
          <div className="pointer-events-none absolute inset-x-8 inset-y-10 border border-dashed border-cyan-300/80 shadow-[0_0_0_999px_rgba(8,15,22,0.16)]">
            <span className="absolute -top-5 left-0 bg-cyan-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-950">
              AI đang tìm QR/barcode
            </span>
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-emerald-300/90 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
          </div>
        )}

        {connected && !failed && latestScan && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-slate-950/85 px-3 py-2 text-[10px] text-white">
            <span className="font-mono font-semibold">{latestScan.barcode}</span>
            <span className={latestScan.status?.toUpperCase() === 'AMBIGUOUS' || latestScan.misplaced
              ? 'text-amber-300'
              : latestScan.known
                ? 'text-emerald-300'
                : latestScan.status?.toUpperCase() === 'SCANNED'
                  ? 'text-cyan-300'
                  : 'text-rose-300'}>
              {latestScan.status?.toUpperCase() === 'AMBIGUOUS'
                ? 'Mã trùng trên nhiều tầng'
                : latestScan.status?.toUpperCase() === 'SCANNED'
                  ? 'Đang xác minh'
                  : latestScan.misplaced
                    ? 'Sai kệ'
                    : latestScan.known
                      ? 'Đã nhận diện'
                      : 'Không có trong CSDL'}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
