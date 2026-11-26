import { Activity, ArrowLeft, CalendarClock, CheckCircle2, Star, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import MapViewer, { type MapEndpoint, type MapRoutePoint } from '@/components/map/MapViewer'
import LiveMissionDetail from '@/components/tasks/LiveMissionDetail'
import { getFeedback, getInventoryReport, getJobById, getJobEvents } from '@/lib/jobData'
import { initialAisles } from '@/lib/mapData'
import { initialEndpoints, initialZones, sampleMap } from '@/pages/maps/MapDetail'
import { JobPriority, JobStatus } from '@/types/job'
import type { JobPriority as JobPriorityValue, JobStatus as JobStatusValue } from '@/types/job'
import { getWorkflows } from '@/lib/workflowData'

const statusStyles: Record<JobStatusValue, string> = {
  [JobStatus.Pending]: 'bg-[#fff4df] text-[#946200]',
  [JobStatus.Running]: 'bg-[#eaf1fb] text-[#315f9e]',
  [JobStatus.Completed]: 'bg-[#e8f5ed] text-[#237a45]',
  [JobStatus.Failed]: 'bg-[#fff0ee] text-[#b42318]',
  [JobStatus.Cancelled]: 'bg-[#f0eff2] text-[#626776]',
}

const priorityLabels: Record<JobPriorityValue, string> = {
  [JobPriority.Low]: 'Thấp',
  [JobPriority.Normal]: 'Bình thường',
  [JobPriority.High]: 'Cao',
  [JobPriority.Critical]: 'Khẩn cấp',
}

const statusLabels: Record<JobStatusValue, string> = {
  [JobStatus.Pending]: 'Đang chờ',
  [JobStatus.Running]: 'Đang chạy',
  [JobStatus.Completed]: 'Đã hoàn thành',
  [JobStatus.Failed]: 'Thất bại',
  [JobStatus.Cancelled]: 'Đã hủy',
}

const eventTypeLabels: Record<string, string> = {
  STEP_STARTED: 'Bắt đầu bước',
  STEP_COMPLETED: 'Hoàn thành bước',
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—'
}

function formatEventValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return `${value.length} mục`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showInventoryDetails, setShowInventoryDetails] = useState(false)
  const jobId = Number(id)
  const job = getJobById(jobId)
  const events = getJobEvents(jobId)
  const feedback = getFeedback(jobId)
  const inventoryReport = getInventoryReport(jobId)
  const workflow = job ? getWorkflows().find((item) => item.id === job.workflowId) : undefined

  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return <LiveMissionDetail missionId={id} />
  }

  if (!job) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#596174] hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />Quay lại
          </button>
          <div className="mt-8 border border-[#d9dce5] bg-white px-6 py-12 text-center">
            <h1 className="text-lg font-semibold text-[#252933]">Không tìm thấy nhiệm vụ</h1>
            <p className="mt-2 text-sm text-[#687386]">Mã nhiệm vụ yêu cầu không tồn tại trong dữ liệu hiện tại.</p>
          </div>
        </div>
      </div>
    )
  }

  const routeEvent = events.find((event) => Array.isArray(event.data.result.route_points))
  const routePoints = (routeEvent?.data.result.route_points ?? []) as MapRoutePoint[]
  const routeProgressRatio = typeof routeEvent?.data.result.route_progress_ratio === 'number'
    ? routeEvent.data.result.route_progress_ratio
    : undefined
  const targetEndpointValues = Array.isArray(routeEvent?.data.parameters.target_endpoint_ids)
    ? routeEvent.data.parameters.target_endpoint_ids.map(String)
    : [String(routeEvent?.data.parameters.endpoint_id ?? '')]
  const targetEndpoints = initialEndpoints.filter((endpoint) =>
    targetEndpointValues.includes(endpoint.code) || targetEndpointValues.includes(String(endpoint.id)),
  )
  const targetEndpointValue = String(routeEvent?.data.parameters.endpoint_id ?? '')
  const targetEndpoint = initialEndpoints.find((endpoint) =>
    endpoint.code === targetEndpointValue || endpoint.id === Number(targetEndpointValue),
  ) ?? targetEndpoints[0]
  const startEndpointCode = String(routeEvent?.data.parameters.start_endpoint_id ?? '')
  const startEndpoint = initialEndpoints.find((endpoint) => endpoint.code === startEndpointCode)
  const routeEndpoints = [...new Map(
    [startEndpoint, ...targetEndpoints].filter((endpoint): endpoint is MapEndpoint => endpoint !== undefined)
      .map((endpoint) => [endpoint.id, endpoint]),
  ).values()]
  const routeDestinationLabel = job.workflowId === 3
    ? `${targetEndpoints.length} kệ`
    : targetEndpoint?.name ?? 'Điểm đến'

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#0c0d10] text-white xl:h-screen">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#121318] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            title="Quay lại"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/55 hover:bg-white/8 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Nhiệm vụ #{job.id}</p>
            <h1 className="truncate text-sm font-semibold text-white">{job.name}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>{statusLabels[job.status]}</span>
          <span className="hidden rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-white/70 sm:inline-flex">Ưu tiên: {priorityLabels[job.priority]}</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <main className="min-h-[380px] min-w-0 flex-1 xl:min-h-0">
          <div className="flex h-full min-h-[380px] flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#121318] px-4 py-2.5">
              <div>
                <h2 className="text-sm font-semibold">{sampleMap.name}</h2>
                <p className="mt-0.5 text-xs text-white/45">Bản đồ #{sampleMap.id} · {sampleMap.floor_name} · Robot {job.robotId ?? 'chưa phân công'}</p>
              </div>
              {routePoints.length > 1 && targetEndpoint && (
                <span className="text-right text-xs text-white/55">{startEndpoint?.name ?? `Robot ${job.robotId ?? ''} current position`} <span className="text-[#fb923c]">→</span> {routeDestinationLabel}</span>
              )}
            </div>
            <div className="min-h-[320px] flex-1">
              <MapViewer
                yamlUrl="/maps/floor1_library_v1.yaml"
                endpoints={routePoints.length > 1 ? routeEndpoints : initialEndpoints}
                aisles={initialAisles}
                zones={initialZones}
                selectedEndpointId={targetEndpoint?.id ?? null}
                selectedZoneId={null}
                showEndpoints
                showZones
                zoneDrawMode={false}
                routePoints={routePoints}
                routeLabel={routePoints.length > 1 ? `Robot ${job.robotId ?? ''} to ${routeDestinationLabel}` : undefined}
                animateRoute={job.status === JobStatus.Completed}
                routeProgressRatio={job.status === JobStatus.Running ? routeProgressRatio : undefined}
                showEndpointLabels={routePoints.length <= 2}
                onEndpointSelect={() => undefined}
                onZoneSelect={() => undefined}
                onMapClick={() => undefined}
                onZoneDrawComplete={() => undefined}
              />
            </div>
          </div>
        </main>

        <aside className="flex max-h-[72vh] min-h-[460px] w-full shrink-0 flex-col border-t border-white/10 bg-[#f7f8fa] text-[#252933] xl:max-h-none xl:min-h-0 xl:w-[480px] xl:border-l xl:border-t-0">
          <div className="shrink-0 border-b border-[#e0e3e9] bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Tổng quan nhiệm vụ</p>
                <h2 className="mt-1 break-words text-base font-semibold text-[#20242c]">{job.name}</h2>
              </div>
              <Activity className="mt-1 h-5 w-5 shrink-0 text-primary" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div><p className="text-[#79808d]">Quy trình</p><p className="mt-0.5 font-medium">{workflow?.name ?? `Quy trình #${job.workflowId}`}</p></div>
              <div><p className="text-[#79808d]">Người tạo</p><p className="mt-0.5 font-medium">Người dùng #{job.createdBy}</p></div>
              <div><p className="text-[#79808d]">Bắt đầu</p><p className="mt-0.5 font-medium">{formatDate(job.startedAt)}</p></div>
              <div><p className="text-[#79808d]">Hoàn thành</p><p className="mt-0.5 font-medium">{formatDate(job.completedAt)}</p></div>
              <div className="col-span-2 border-l-2 border-primary bg-[#f7f8fa] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Mô tả nhiệm vụ</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#343a45]">{job.description || 'Chưa có mô tả.'}</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#252933]">Sự kiện nhiệm vụ</h3>
                <p className="mt-0.5 text-[11px] text-[#77808e]">Lịch sử thực thi các bước trong quy trình</p>
              </div>
              <span className="rounded-full bg-[#eef1f5] px-2 py-1 text-[10px] font-medium text-[#596174]">{events.length} sự kiện</span>
            </div>
            {events.length > 0 ? (
              <ol className="space-y-0">
                {events.map((event, index) => {
                  const isRunningStep = event.eventType === 'STEP_STARTED' && job.status === JobStatus.Running
                  return (
                  <li key={event.id} className="relative pb-5 pl-8 last:pb-2">
                    {index < events.length - 1 && <span className="absolute bottom-0 left-[9px] top-5 w-px bg-[#d9dee7]" />}
                    <span className={`absolute left-0 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${isRunningStep ? 'border-[#f3c68b] bg-[#fff4df] text-[#b45309]' : 'border-[#b9dec5] bg-[#e8f5ed] text-[#237a45]'}`}>
                      {isRunningStep ? <Activity className="h-3.5 w-3.5 animate-pulse" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#77808e]">Giai đoạn {index + 1} · {eventTypeLabels[event.eventType] ?? event.eventType.replaceAll('_', ' ')}</p>
                        <h3 className="mt-0.5 break-words text-sm font-semibold text-[#252933]">{event.data.stepName}</h3>
                        <p className="mt-0.5 text-[11px] text-[#687386]">Nhiệm vụ {event.data.taskSequenceNo}: {event.data.taskName} · {event.data.stepType}</p>
                      </div>
                      <time className="shrink-0 text-[10px] text-[#7b8190]">{new Date(event.eventTime).toLocaleTimeString()}</time>
                    </div>

                    <details className="mt-2 border border-[#e1e4e9] bg-white">
                      <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium text-[#596174] hover:bg-[#fafbfc]">Tham số và kết quả thực thi</summary>
                      <div className="space-y-3 border-t border-[#e9ebef] px-3 py-2.5">
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#818895]">Tham số</p>
                          <dl className="space-y-1">
                            {Object.entries(event.data.parameters).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-[minmax(90px,0.6fr)_minmax(0,1fr)] gap-2 text-[11px]">
                                <dt className="break-words font-mono text-[#727a88]">{key}</dt>
                                <dd className="break-all text-[#343a45]">{formatEventValue(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#818895]">Kết quả</p>
                          <dl className="space-y-1">
                            {Object.entries(event.data.result).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-[minmax(90px,0.6fr)_minmax(0,1fr)] gap-2 text-[11px]">
                                <dt className="break-words font-mono text-[#727a88]">{key}</dt>
                                <dd className="break-all text-[#343a45]">{formatEventValue(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </div>
                    </details>
                  </li>
                  )
                })}
              </ol>
            ) : (
              <div className="border border-dashed border-[#cfd3dd] bg-white px-4 py-8 text-center">
                <CalendarClock className="mx-auto h-6 w-6 text-[#89909d]" />
                <p className="mt-2 text-sm font-semibold text-[#3f4654]">Chưa có sự kiện thực thi</p>
                <p className="mt-1 text-xs text-[#687386]">Sự kiện sẽ xuất hiện tại đây khi các bước trong quy trình chạy.</p>
              </div>
            )}

            {job.workflowId === 3 ? (
              <section className="mt-5 border border-[#e0e3e9] bg-white">
                <div className="border-b border-[#e9ebef] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-[#252933]">Báo cáo kiểm kê</h2>
                      <p className="mt-0.5 text-[11px] text-[#77808e]">Report #{inventoryReport?.id ?? '—'} · {inventoryReport?.scopeType ?? '—'}</p>
                    </div>
                    {inventoryReport && (
                      <button type="button" onClick={() => setShowInventoryDetails(true)} className="h-8 shrink-0 border border-[#c9d5e8] bg-white px-3 text-xs font-semibold text-primary transition hover:bg-[#f2f6fc]">
                        Xem chi tiết
                      </button>
                    )}
                  </div>
                </div>
                {inventoryReport ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4 text-xs">
                    <div><dt className="text-[#79808d]">Số kệ</dt><dd className="mt-1 text-base font-semibold text-[#252933]">{inventoryReport.totalShelfs}</dd></div>
                    <div><dt className="text-[#79808d]">Sách đã quét</dt><dd className="mt-1 text-base font-semibold text-[#252933]">{inventoryReport.totalBookScanned}</dd></div>
                    <div><dt className="text-[#79808d]">Có sẵn</dt><dd className="mt-1 text-base font-semibold text-[#237a45]">{inventoryReport.totalAvailable}</dd></div>
                    <div><dt className="text-[#79808d]">Sai vị trí</dt><dd className="mt-1 text-base font-semibold text-[#b45309]">{inventoryReport.totalMisplaced}</dd></div>
                    <div><dt className="text-[#79808d]">Không tìm thấy</dt><dd className="mt-1 text-base font-semibold text-[#b42318]">{inventoryReport.totalMissing}</dd></div>
                    <div><dt className="text-[#79808d]">Ngày tạo</dt><dd className="mt-1 font-medium text-[#404754]">{new Date(inventoryReport.createdAt).toLocaleString('vi-VN')}</dd></div>
                  </dl>
                ) : (
                  <p className="px-4 py-5 text-xs text-[#687386]">Chưa có báo cáo kiểm kê.</p>
                )}
              </section>
            ) : (
              <section className="mt-5 border border-[#e0e3e9] bg-white">
                <div className="border-b border-[#e9ebef] px-4 py-3">
                  <h2 className="text-sm font-semibold text-[#252933]">Đánh giá của bạn đọc</h2>
                  <p className="mt-0.5 text-[11px] text-[#77808e]">Đánh giá được ghi nhận cho nhiệm vụ này</p>
                </div>
                {feedback ? (
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-1" aria-label={`Đánh giá ${feedback.rating}/5`}>
                      {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < feedback.rating ? 'fill-[#eab308] text-[#eab308]' : 'text-[#d5d9e0]'}`} />)}
                      <span className="ml-2 text-xs font-semibold text-[#404754]">{feedback.rating}/5</span>
                    </div>
                    {feedback.comment && <p className="mt-3 text-sm leading-5 text-[#596174]">{feedback.comment}</p>}
                  </div>
                ) : (
                  <p className="px-4 py-5 text-xs text-[#687386]">Chưa có đánh giá nào.</p>
                )}
              </section>
            )}
          </div>
        </aside>
      </div>

      {showInventoryDetails && inventoryReport && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowInventoryDetails(false) }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="inventory-report-details-title" className="flex max-h-[88vh] w-full max-w-3xl flex-col border border-[#d9dce5] bg-[#f7f8fa] text-[#252933] shadow-2xl">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e0e3e9] bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Báo cáo #{inventoryReport.id} · {inventoryReport.scopeType}</p>
                <h2 id="inventory-report-details-title" className="mt-1 text-lg font-semibold">Các sai lệch kiểm kê</h2>
                <p className="mt-1 text-xs text-[#687386]">{inventoryReport.data.items.length} sách cần được xử lý</p>
              </div>
              <button type="button" aria-label="Đóng chi tiết báo cáo" onClick={() => setShowInventoryDetails(false)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#687386] hover:bg-[#f1f2f5] hover:text-[#252933]">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
              {inventoryReport.data.items.map((item) => (
                <article key={item.bookId} className="border border-[#d9dce5] bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e9ebef] px-4 py-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1 break-words text-xs text-[#687386]">{item.author}</p>
                      <p className="mt-1 text-[11px] text-[#79808d]">Book ID {item.bookId} · {item.classification}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.issueType === 'MISPLACED' ? 'bg-[#fff4df] text-[#946200]' : 'bg-[#fff0ee] text-[#b42318]'}`}>
                      {item.issueType === 'MISPLACED' ? 'Sai vị trí' : 'Không tìm thấy'}
                    </span>
                  </div>

                  <div className="grid gap-px bg-[#e9ebef] sm:grid-cols-2">
                    <div className="bg-white px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Vị trí dự kiến</p>
                      <p className="mt-1 text-xs font-medium text-[#343a45]">{item.expectedLocation.floor} · {item.expectedLocation.aisle}</p>
                      <p className="mt-0.5 text-xs text-[#596174]">Kệ {item.expectedLocation.shelf} · Tầng {item.expectedLocation.shelfLevel}</p>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Vị trí đã quét</p>
                      {item.actualLocation ? (
                        <>
                          <p className="mt-1 text-xs font-medium text-[#343a45]">{item.actualLocation.floor} · {item.actualLocation.aisle}</p>
                          <p className="mt-0.5 text-xs text-[#596174]">Kệ {item.actualLocation.shelf} · Tầng {item.actualLocation.shelfLevel}</p>
                        </>
                      ) : (
                        <p className="mt-1 text-xs font-medium text-[#b42318]">Không tìm thấy trên các kệ đã quét</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <footer className="flex shrink-0 justify-end border-t border-[#e0e3e9] bg-white px-5 py-3">
              <button type="button" onClick={() => setShowInventoryDetails(false)} className="h-9 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">Đóng</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

export default TaskDetail
