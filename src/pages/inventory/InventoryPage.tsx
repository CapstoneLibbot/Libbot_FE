import { useEffect, useState } from 'react'
import { Barcode, Boxes, Check, CircleAlert, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import { inventoryApi } from '@/lib/inventoryApi'
import type { InventoryRuntime, InventoryScanResult } from '@/lib/inventoryApi'
import { shelfApi } from '@/lib/shelfApi'
import type { ShelfRecord } from '@/lib/shelfApi'

const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary'
const missionPattern = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

function InventoryPage() {
  const [missionId, setMissionId] = useState('')
  const [runtimeId, setRuntimeId] = useState<InventoryRuntime>('real')
  const [shelfCode, setShelfCode] = useState('')
  const [shelves, setShelves] = useState<ShelfRecord[]>([])
  const [shelfLoading, setShelfLoading] = useState(true)
  const [shelfError, setShelfError] = useState('')
  const [barcode, setBarcode] = useState('')
  const [scans, setScans] = useState<InventoryScanResult[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadShelves() {
    setShelfLoading(true)
    setShelfError('')
    try {
      const items = await shelfApi.list()
      setShelves(items)
      setShelfCode((current) => items.some((shelf) => shelf.code === current) ? current : '')
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
        missionId: missionId.trim(),
        runtimeId,
        barcode: barcode.trim(),
        ...(shelfCode.trim() ? { shelfCode: shelfCode.trim() } : {}),
      })
      setScans((current) => [result, ...current].slice(0, 30))
      setBarcode('')
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
          <div><h1 className="text-2xl font-bold">Inventory</h1><p className="mt-0.5 text-sm text-[#596174]">Record book scans for a running inventory mission</p></div>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl space-y-5 border border-[#d9dce5] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e6eb] pb-4">
            <h2 className="text-base font-semibold">Record scan</h2>
            <div className="inline-flex border border-[#d7d9e2] bg-[#f5f4f8] p-1" role="group" aria-label="Inventory runtime">
              {(['real', 'sim'] as const).map((runtime) => (
                <button key={runtime} type="button" aria-pressed={runtimeId === runtime} onClick={() => setRuntimeId(runtime)} className={runtimeId === runtime ? 'h-8 min-w-20 bg-white px-3 text-xs font-semibold text-primary shadow-sm' : 'h-8 min-w-20 px-3 text-xs font-medium text-[#596174] hover:text-[#17181c]'}>{runtime.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Mission ID <span className="text-[#b42318]">*</span><input required pattern={missionPattern} title="Enter a valid mission GUID" value={missionId} onChange={(event) => setMissionId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className={inputClassName} /></label>
            <label className="block space-y-1.5 text-sm font-medium">Shelf code {runtimeId === 'real' && <span className="text-[#b42318]">*</span>}<select required={runtimeId === 'real'} disabled={shelfLoading || !!shelfError} value={shelfCode} onChange={(event) => setShelfCode(event.target.value)} className={`${inputClassName} appearance-none disabled:bg-[#f5f5f7]`}><option value="">{shelfLoading ? 'Loading shelves...' : shelfError ? 'Shelves unavailable' : 'Select shelf'}</option>{shelves.map((shelf) => <option key={shelf.id} value={shelf.code}>{shelf.code} · {shelf.name}</option>)}</select></label>
            <label className="block space-y-1.5 text-sm font-medium">Barcode <span className="text-[#b42318]">*</span><div className="relative"><Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" /><input required maxLength={100} autoComplete="off" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Scan or enter barcode" className={`${inputClassName} pl-9`} /></div></label>
          </div>

          {shelfError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]"><span>Could not load Shelf options: {shelfError}</span><button type="button" onClick={() => void loadShelves()} className="font-semibold underline">Retry</button></div>}
          {error && <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">{error}</p>}
          <div className="flex justify-end border-t border-[#e4e6eb] pt-4"><button type="submit" disabled={submitting} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{submitting ? 'Recording...' : 'Record scan'}</button></div>
        </form>

        <section className="space-y-3" aria-label="Recent scan responses">
          <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Recent scans</h2><span className="text-xs text-[#687386]">{scans.length} in this session</span></div>
          {!scans.length ? <div className="border border-dashed border-[#cfd3dc] bg-white px-4 py-10 text-center text-sm text-[#687386]">Scan responses will appear here.</div> : <div className="overflow-hidden border border-[#d9dce5] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]"><tr><th className="px-4 py-3">Barcode</th><th className="px-4 py-3">Shelf</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Expected shelf</th><th className="px-4 py-3">Scanned at</th></tr></thead><tbody>{scans.map((scan, index) => <tr key={`${scan.barcode}-${scan.scannedAt}-${index}`} className="border-b border-[#ececf1] last:border-0"><td className="px-4 py-3 font-mono text-xs font-semibold">{scan.barcode}</td><td className="px-4 py-3">{scan.shelfCode || '-'}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${scan.misplaced ? 'text-[#a12820]' : scan.known ? 'text-[#237a45]' : 'text-[#765600]'}`}>{scan.misplaced ? <TriangleAlert className="h-3.5 w-3.5" /> : scan.known ? <Check className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}{scan.misplaced ? 'Misplaced' : scan.known ? 'Recognized' : 'Unknown barcode'}</span></td><td className="px-4 py-3">{scan.expectedShelfCode || '-'}</td><td className="px-4 py-3 text-xs text-[#687386]">{new Date(scan.scannedAt).toLocaleString()}</td></tr>)}</tbody></table></div></div>}
        </section>
      </div>
    </div>
  )
}

export default InventoryPage
