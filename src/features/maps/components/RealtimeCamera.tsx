import { useMemo, useState } from 'react'
import { Camera, RefreshCw } from 'lucide-react'

import { getCameraStreamUrl } from '../api/runtimeApi'

type RealtimeCameraProps = {
  runtimeId: string
  connected: boolean
  mappingActive: boolean
}

export default function RealtimeCamera({
  runtimeId,
  connected,
  mappingActive,
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
          <h3 className="text-sm font-semibold text-[#252933]">Camera trực tiếp</h3>
          <p className="mt-0.5 text-xs text-[#747b8b]">IMX500 · MJPEG</p>
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
      </div>
    </section>
  )
}
