import { useEffect, useState } from 'react'
import { AlertTriangle, Boxes, FileBarChart, RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { inventoryApi } from '@/lib/inventoryApi'
import type { InventoryReportResult, InventoryRuntime } from '@/lib/inventoryApi'

const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary'
const selectClassName = `${inputClassName} appearance-none`
const jobPattern = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

function InventoryResultsPage() {
  const [searchParams] = useSearchParams()
  const [jobId, setJobId] = useState('')
  const [runtimeId, setRuntimeId] = useState<InventoryRuntime>('real')
  const [scopeType, setScopeType] = useState<'SHELF' | 'AREA'>('SHELF')
  const [reportType, setReportType] = useState<'INVENTORY' | 'MISPLACED_BOOK_DETECTION'>('INVENTORY')
  const [report, setReport] = useState<InventoryReportResult | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const requestedJobId = searchParams.get('jobId')
    if (!requestedJobId) return
    const requestedRuntime = searchParams.get('runtimeId') === 'sim' ? 'sim' : 'real'
    setJobId(requestedJobId)
    setRuntimeId(requestedRuntime)
    setError('')
    void inventoryApi.getReport(requestedJobId, requestedRuntime)
      .then(setReport)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Không thể tải báo cáo kiểm kê này.'))
  }, [searchParams])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setReport(null)
    try {
      const result = await inventoryApi.generateReport({
        jobId: jobId.trim(),
        runtimeId,
        scopeType,
        reportType,
      })
      setReport(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tạo báo cáo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><FileBarChart className="h-5 w-5" /></div>
          <div><h1 className="text-2xl font-bold">Kết quả kiểm kê</h1><p className="mt-0.5 text-sm text-[#596174]">Xem mã QR đã quét ở cả hai tầng của từng kệ</p></div>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl space-y-5 border border-[#d9dce5] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e6eb] pb-4"><h2 className="text-base font-semibold">Tạo báo cáo</h2><div className="inline-flex border border-[#d7d9e2] bg-[#f5f4f8] p-1" role="group" aria-label="Môi trường chạy">{(['real', 'sim'] as const).map((runtime) => <button key={runtime} type="button" aria-pressed={runtimeId === runtime} onClick={() => setRuntimeId(runtime)} className={runtimeId === runtime ? 'h-8 min-w-20 bg-white px-3 text-xs font-semibold text-primary shadow-sm' : 'h-8 min-w-20 px-3 text-xs font-medium text-[#596174] hover:text-[#17181c]'}>{runtime.toUpperCase()}</button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Mã nhiệm vụ <span className="text-[#b42318]">*</span><input required pattern={jobPattern} title="Nhập mã nhiệm vụ GUID hợp lệ" value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className={inputClassName} /></label>
            <label className="block space-y-1.5 text-sm font-medium">Phạm vi<select value={scopeType} onChange={(event) => setScopeType(event.target.value as 'SHELF' | 'AREA')} className={selectClassName}><option value="SHELF">Kệ</option><option value="AREA">Khu vực</option></select></label>
            <label className="block space-y-1.5 text-sm font-medium">Loại báo cáo<select value={reportType} onChange={(event) => setReportType(event.target.value as 'INVENTORY' | 'MISPLACED_BOOK_DETECTION')} className={selectClassName}><option value="INVENTORY">Kiểm kê</option><option value="MISPLACED_BOOK_DETECTION">Phát hiện sách sai vị trí</option></select></label>
          </div>
          {error && <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">{error}</p>}
          <div className="flex justify-end border-t border-[#e4e6eb] pt-4"><button type="submit" disabled={submitting} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileBarChart className="h-4 w-4" />}{submitting ? 'Đang tạo…' : 'Tạo báo cáo'}</button></div>
        </form>

        {report && <section aria-live="polite" className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Tóm tắt báo cáo</h2><p className="mt-1 font-mono text-xs text-[#687386]">Mã báo cáo: {report.reportId}</p></div><span className="border border-[#d9dce5] bg-white px-2.5 py-1 text-xs font-semibold text-[#414856]">{report.reportType} / {report.runtimeId.toUpperCase()}</span></header>
          {runtimeId === 'sim' && <p className="border border-[#ecd9a8] bg-[#fff8e8] px-3 py-2 text-sm text-[#765600]">Báo cáo mô phỏng chỉ có hiệu lực tạm thời và không được lưu vào cơ sở dữ liệu.</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="border border-[#d9dce5] bg-white px-4 py-4"><p className="text-xs font-medium uppercase text-[#687386]">Số kệ</p><p className="mt-2 text-2xl font-semibold">{report.totalShelves ?? '—'}</p></div>
            <div className="border border-[#d9dce5] bg-white px-4 py-4"><p className="text-xs font-medium uppercase text-[#687386]">Mã QR đã quét</p><p className="mt-2 text-2xl font-semibold">{report.totalBooksScanned}</p></div>
            <div className="border border-[#d9dce5] bg-white px-4 py-4"><p className="text-xs font-medium uppercase text-[#687386]">Đúng vị trí</p><p className="mt-2 text-2xl font-semibold text-[#237a45]">{report.totalAvailable ?? '—'}</p></div>
            <div className="border border-[#e7cfcc] bg-white px-4 py-4"><p className="flex items-center gap-2 text-xs font-medium uppercase text-[#8d4a46]"><AlertTriangle className="h-4 w-4" /> Sai vị trí</p><p className="mt-2 text-2xl font-semibold text-[#a12820]">{report.totalMisplaced}</p></div>
            <div className="border border-[#d9dce5] bg-white px-4 py-4"><p className="flex items-center gap-2 text-xs font-medium uppercase text-[#687386]"><Boxes className="h-4 w-4" /> Thiếu</p><p className="mt-2 text-2xl font-semibold">{report.totalMissing}</p></div>
            <div className="border border-[#d9dce5] bg-white px-4 py-4"><p className="text-xs font-medium uppercase text-[#687386]">QR chưa xác định</p><p className="mt-2 text-2xl font-semibold">{report.totalUnknown ?? report.details?.unknown_qr_codes?.length ?? '—'}</p></div>
            <div className="border border-[#d9dce5] bg-white px-4 py-4"><p className="text-xs font-medium uppercase text-[#687386]">QR trùng lặp</p><p className="mt-2 text-2xl font-semibold">{report.details?.ambiguous_qr_codes?.length ?? 0}</p></div>
          </div>
          {report.details?.shelves && <div className="space-y-3">
            <h3 className="text-sm font-semibold">Lượt quét theo kệ và tầng</h3>
            {report.details.shelves.map((shelf) => <article key={shelf.shelf_id} className="border border-[#d9dce5] bg-white">
              <h4 className="border-b border-[#e4e6eb] px-4 py-3 text-sm font-semibold">{shelf.shelf_code}</h4>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {shelf.levels.map((level) => <div key={level.shelf_level_id} className="border border-[#e4e6eb] bg-[#fbfbfc] p-3">
                  <p className="text-xs font-semibold uppercase text-[#687386]">Tầng {level.level_number}</p>
                  <p className="mt-2 break-all font-mono text-xs">{level.scanned_qr_codes.length ? level.scanned_qr_codes.join(', ') : 'Chưa phát hiện mã QR nào'}</p>
                </div>)}
              </div>
            </article>)}
          </div>}
          {((report.details?.misplaced_qr_codes?.length ?? 0) > 0 || (report.details?.missing_qr_codes?.length ?? 0) > 0 || (report.details?.unknown_qr_codes?.length ?? 0) > 0 || (report.details?.ambiguous_qr_codes?.length ?? 0) > 0) && <div className="grid gap-3 md:grid-cols-4">
            {report.details?.misplaced_qr_codes?.length ? <IssueList title="Mã QR sai vị trí" values={report.details.misplaced_qr_codes} /> : null}
            {report.details?.missing_qr_codes?.length ? <IssueList title="Sách không tìm thấy" values={report.details.missing_qr_codes} /> : null}
            {report.details?.unknown_qr_codes?.length ? <IssueList title="Mã QR chưa xác định" values={report.details.unknown_qr_codes} /> : null}
            {report.details?.ambiguous_qr_codes?.length ? <IssueList title="Mã QR trùng lặp" values={report.details.ambiguous_qr_codes} /> : null}
          </div>}
        </section>}
      </div>
    </div>
  )
}

function IssueList({ title, values }: { title: string; values: string[] }) {
  return <section className="border border-[#d9dce5] bg-white p-4">
    <h3 className="text-sm font-semibold">{title}</h3>
    <ul className="mt-2 space-y-1 font-mono text-xs text-[#596174]">{values.map((value) => <li key={value} className="break-all">{value}</li>)}</ul>
  </section>
}

export default InventoryResultsPage
