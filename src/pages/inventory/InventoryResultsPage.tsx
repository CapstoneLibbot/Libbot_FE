import { useState } from 'react'
import { AlertTriangle, Boxes, FileBarChart, RefreshCw } from 'lucide-react'
import { inventoryApi } from '@/lib/inventoryApi'
import type { InventoryReportResult, InventoryRuntime } from '@/lib/inventoryApi'

const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary'
const selectClassName = `${inputClassName} appearance-none`
const missionPattern = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

function InventoryResultsPage() {
  const [missionId, setMissionId] = useState('')
  const [runtimeId, setRuntimeId] = useState<InventoryRuntime>('real')
  const [scopeType, setScopeType] = useState<'SHELF' | 'AREA'>('SHELF')
  const [reportType, setReportType] = useState<'INVENTORY' | 'MISPLACED_BOOK_DETECTION'>('INVENTORY')
  const [report, setReport] = useState<InventoryReportResult | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setReport(null)
    try {
      const result = await inventoryApi.generateReport({
        missionId: missionId.trim(),
        runtimeId,
        scopeType,
        reportType,
      })
      setReport(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate the report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><FileBarChart className="h-5 w-5" /></div>
          <div><h1 className="text-2xl font-bold">Inventory Results</h1><p className="mt-0.5 text-sm text-[#596174]">Generate a report from a completed inventory mission</p></div>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl space-y-5 border border-[#d9dce5] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e6eb] pb-4"><h2 className="text-base font-semibold">Generate report</h2><div className="inline-flex border border-[#d7d9e2] bg-[#f5f4f8] p-1" role="group" aria-label="Inventory runtime">{(['real', 'sim'] as const).map((runtime) => <button key={runtime} type="button" aria-pressed={runtimeId === runtime} onClick={() => setRuntimeId(runtime)} className={runtimeId === runtime ? 'h-8 min-w-20 bg-white px-3 text-xs font-semibold text-primary shadow-sm' : 'h-8 min-w-20 px-3 text-xs font-medium text-[#596174] hover:text-[#17181c]'}>{runtime.toUpperCase()}</button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Mission ID <span className="text-[#b42318]">*</span><input required pattern={missionPattern} title="Enter a valid mission GUID" value={missionId} onChange={(event) => setMissionId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className={inputClassName} /></label>
            <label className="block space-y-1.5 text-sm font-medium">Scope<select value={scopeType} onChange={(event) => setScopeType(event.target.value as 'SHELF' | 'AREA')} className={selectClassName}><option value="SHELF">Shelf</option><option value="AREA">Area</option></select></label>
            <label className="block space-y-1.5 text-sm font-medium">Report type<select value={reportType} onChange={(event) => setReportType(event.target.value as 'INVENTORY' | 'MISPLACED_BOOK_DETECTION')} className={selectClassName}><option value="INVENTORY">Inventory</option><option value="MISPLACED_BOOK_DETECTION">Misplaced book detection</option></select></label>
          </div>
          {error && <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">{error}</p>}
          <div className="flex justify-end border-t border-[#e4e6eb] pt-4"><button type="submit" disabled={submitting} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileBarChart className="h-4 w-4" />}{submitting ? 'Generating...' : 'Generate report'}</button></div>
        </form>

        {report && <section aria-live="polite" className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Report summary</h2><p className="mt-1 font-mono text-xs text-[#687386]">{report.reportId}</p></div><span className="border border-[#d9dce5] bg-white px-2.5 py-1 text-xs font-semibold text-[#414856]">{report.reportType} / {report.runtimeId.toUpperCase()}</span></header>
          {runtimeId === 'sim' && <p className="border border-[#ecd9a8] bg-[#fff8e8] px-3 py-2 text-sm text-[#765600]">Simulation reports are temporary and are not saved to the database.</p>}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-[#d9dce5] bg-white px-4 py-4"><p className="text-xs font-medium uppercase text-[#687386]">Books scanned</p><p className="mt-2 text-2xl font-semibold">{report.totalBooksScanned}</p></div>
            <div className="border border-[#e7cfcc] bg-white px-4 py-4"><p className="flex items-center gap-2 text-xs font-medium uppercase text-[#8d4a46]"><AlertTriangle className="h-4 w-4" /> Misplaced</p><p className="mt-2 text-2xl font-semibold text-[#a12820]">{report.totalMisplaced}</p></div>
            <div className="border border-[#d9dce5] bg-white px-4 py-4"><p className="flex items-center gap-2 text-xs font-medium uppercase text-[#687386]"><Boxes className="h-4 w-4" /> Missing</p><p className="mt-2 text-2xl font-semibold">{report.totalMissing}</p></div>
          </div>
        </section>}
      </div>
    </div>
  )
}

export default InventoryResultsPage
