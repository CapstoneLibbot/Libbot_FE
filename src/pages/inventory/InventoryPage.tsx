import { useEffect, useState } from 'react'
import { Barcode, Boxes, Check, CircleAlert, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import { inventoryApi } from '@/lib/inventoryApi'
import type { InventoryRuntime, InventoryScanResult } from '@/lib/inventoryApi'
import { shelfApi } from '@/lib/shelfApi'
import type { InventoryShelfRecord } from '@/lib/shelfApi'

const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary'
const jobPattern = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

function InventoryPage() {
  const [jobId, setJobId] = useState('')
  const [runtimeId, setRuntimeId] = useState<InventoryRuntime>('real')
  const [shelfName, setShelfName] = useState('')
  const [shelves, setShelves] = useState<InventoryShelfRecord[]>([])
  const [shelfLoading, setShelfLoading] = useState(true)
  const [shelfError, setShelfError] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [levelNumber, setLevelNumber] = useState<1 | 2>(1)
  const [scans, setScans] = useState<InventoryScanResult[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadShelves() {
    setShelfLoading(true)
    setShelfError('')
    try {
      const items = await shelfApi.listInventoryShelves()
      setShelves(items)
      setShelfName((current) => items.some((shelf) => shelf.name === current) ? current : '')
    } catch (requestError) {
      setShelfError(requestError instanceof Error ? requestError.message : 'Could not load shelves.')
    } finally {
      setShelfLoading(false)
    }
  }

  useEffect(() => { void loadShelves() }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await inventoryApi.recordScan({
        jobId: jobId.trim(),
        runtimeId,
        qrCode: qrCode.trim(),
        levelNumber,
        ...(shelfName.trim() ? { shelfCode: shelfName.trim() } : {}),
      })
      setScans((current) => [result, ...current].slice(0, 30))
      setQrCode('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not record this scan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Boxes className="h-5 w-5" /></div>
          <div><h1 className="text-2xl font-bold">Kiểm kê kệ</h1><p className="mt-0.5 text-sm text-[#596174]">Ghi nhận mã QR trong một nhiệm vụ kiểm kê đang chạy</p></div>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl space-y-5 border border-[#d9dce5] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e6eb] pb-4">
            <h2 className="text-base font-semibold">Ghi nhận lượt quét QR</h2>
            <div className="inline-flex border border-[#d7d9e2] bg-[#f5f4f8] p-1" role="group" aria-label="Môi trường chạy">
              {(['real', 'sim'] as const).map((runtime) => (
                <button key={runtime} type="button" aria-pressed={runtimeId === runtime} onClick={() => setRuntimeId(runtime)} className={runtimeId === runtime ? 'h-8 min-w-20 bg-white px-3 text-xs font-semibold text-primary shadow-sm' : 'h-8 min-w-20 px-3 text-xs font-medium text-[#596174] hover:text-[#17181c]'}>{runtime.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Mã nhiệm vụ <span className="text-[#b42318]">*</span><input required pattern={jobPattern} title="Nhập mã nhiệm vụ GUID hợp lệ" value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className={inputClassName} /></label>
            <label className="block space-y-1.5 text-sm font-medium">Kệ {runtimeId === 'real' && <span className="text-[#b42318]">*</span>}<select required={runtimeId === 'real'} disabled={shelfLoading || !!shelfError} value={shelfName} onChange={(event) => setShelfName(event.target.value)} className={`${inputClassName} appearance-none disabled:bg-[#f5f5f7]`}><option value="">{shelfLoading ? 'Đang tải danh sách kệ…' : shelfError ? 'Không có danh sách kệ' : 'Chọn kệ'}</option>{shelves.map((shelf) => <option key={shelf.id} value={shelf.name}>{shelf.name}</option>)}</select></label>
            <label className="block space-y-1.5 text-sm font-medium">Tầng kệ<select value={levelNumber} onChange={(event) => setLevelNumber(Number(event.target.value) as 1 | 2)} className={`${inputClassName} appearance-none`}><option value={1}>Tầng 1 · nửa dưới</option><option value={2}>Tầng 2 · nửa trên</option></select></label>
            <label className="block space-y-1.5 text-sm font-medium">Mã QR <span className="text-[#b42318]">*</span><div className="relative"><Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" /><input required maxLength={100} autoComplete="off" value={qrCode} onChange={(event) => setQrCode(event.target.value)} placeholder="Quét hoặc nhập mã QR" className={`${inputClassName} pl-9`} /></div></label>
          </div>

          {shelfError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]"><span>Không tải được danh sách kệ: {shelfError}</span><button type="button" onClick={() => void loadShelves()} className="font-semibold underline">Thử lại</button></div>}
          {error && <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">{error}</p>}
          <div className="flex justify-end border-t border-[#e4e6eb] pt-4"><button type="submit" disabled={submitting} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{submitting ? 'Đang ghi nhận…' : 'Ghi nhận lượt quét'}</button></div>
        </form>

        <section className="space-y-3" aria-label="Recent scan responses">
          <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Lượt quét gần đây</h2><span className="text-xs text-[#687386]">{scans.length} lượt trong phiên này</span></div>
          {!scans.length ? <div className="border border-dashed border-[#cfd3dc] bg-white px-4 py-10 text-center text-sm text-[#687386]">Kết quả quét QR sẽ hiển thị ở đây.</div> : <div className="overflow-hidden border border-[#d9dce5] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]"><tr><th className="px-4 py-3">Mã QR</th><th className="px-4 py-3">Kệ</th><th className="px-4 py-3">Tầng</th><th className="px-4 py-3">Kết quả</th><th className="px-4 py-3">Kệ dự kiến</th><th className="px-4 py-3">Thời gian quét</th></tr></thead><tbody>{scans.map((scan, index) => <tr key={`${scan.qrCode ?? scan.barcode}-${scan.scannedAt}-${index}`} className="border-b border-[#ececf1] last:border-0"><td className="px-4 py-3 font-mono text-xs font-semibold">{scan.qrCode ?? scan.barcode}</td><td className="px-4 py-3">{scan.shelfCode || '—'}</td><td className="px-4 py-3">{scan.levelNumber ?? '—'}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${scan.misplaced ? 'text-[#a12820]' : scan.known ? 'text-[#237a45]' : 'text-[#765600]'}`}>{scan.misplaced ? <TriangleAlert className="h-3.5 w-3.5" /> : scan.known ? <Check className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}{scan.misplaced ? 'Sai vị trí' : scan.known ? 'Đã nhận diện' : 'QR chưa xác định'}</span></td><td className="px-4 py-3">{scan.expectedShelfCode || '—'}</td><td className="px-4 py-3 text-xs text-[#687386]">{new Date(scan.scannedAt).toLocaleString()}</td></tr>)}</tbody></table></div></div>}
        </section>
      </div>
    </div>
  )
}

export default InventoryPage
