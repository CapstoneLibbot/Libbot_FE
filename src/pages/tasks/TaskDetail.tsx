import { Activity, ArrowLeft, CalendarClock, CheckCircle2, Star, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import MapViewer, { type MapEndpoint, type MapRoutePoint } from '@/components/map/MapViewer'
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
  [JobPriority.Low]: 'Low',
  [JobPriority.Normal]: 'Normal',
  [JobPriority.High]: 'High',
  [JobPriority.Critical]: 'Critical',
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—'
}

function formatEventValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function TaskDetail() {
  const { id } = useParams()
  const [showInventoryDetails, setShowInventoryDetails] = useState(false)
  const jobId = Number(id)
  const job = getJobById(jobId)
  const events = getJobEvents(jobId)
  const feedback = getFeedback(jobId)
  const inventoryReport = getInventoryReport(jobId)
  const workflow = job ? getWorkflows().find((item) => item.id === job.workflowId) : undefined

  if (!job) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <Link to="/tasks" className="inline-flex items-center gap-2 text-sm font-medium text-[#596174] hover:text-primary">
            <ArrowLeft className="h-4 w-4" />Back to Tasks
          </Link>
          <div className="mt-8 border border-[#d9dce5] bg-white px-6 py-12 text-center">
            <h1 className="text-lg font-semibold text-[#252933]">Task not found</h1>
            <p className="mt-2 text-sm text-[#687386]">The requested Job ID does not exist in the current data.</p>
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
    ? `${targetEndpoints.length} shelves`
    : targetEndpoint?.name ?? 'destination'

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#0c0d10] text-white xl:h-screen">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#121318] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/tasks" aria-label="Back to Tasks" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/55 hover:bg-white/8 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Task #{job.id}</p>
            <h1 className="truncate text-sm font-semibold text-white">{job.name}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>{job.status}</span>
          <span className="hidden rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-white/70 sm:inline-flex">{priorityLabels[job.priority]} priority</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <main className="min-h-[380px] min-w-0 flex-1 xl:min-h-0">
          <div className="flex h-full min-h-[380px] flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#121318] px-4 py-2.5">
              <div>
                <h2 className="text-sm font-semibold">{sampleMap.name}</h2>
                <p className="mt-0.5 text-xs text-white/45">Map #{sampleMap.id} · {sampleMap.floor_name} · Robot {job.robotId ?? 'unassigned'}</p>
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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Task overview</p>
                <h2 className="mt-1 break-words text-base font-semibold text-[#20242c]">{job.name}</h2>
              </div>
              <Activity className="mt-1 h-5 w-5 shrink-0 text-primary" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div><p className="text-[#79808d]">Workflow</p><p className="mt-0.5 font-medium">{workflow?.name ?? `Workflow #${job.workflowId}`}</p></div>
              <div><p className="text-[#79808d]">Created by</p><p className="mt-0.5 font-medium">User #{job.createdBy}</p></div>
              <div><p className="text-[#79808d]">Started</p><p className="mt-0.5 font-medium">{formatDate(job.startedAt)}</p></div>
              <div><p className="text-[#79808d]">Completed</p><p className="mt-0.5 font-medium">{formatDate(job.completedAt)}</p></div>
              <div className="col-span-2 border-l-2 border-primary bg-[#f7f8fa] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Task description</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#343a45]">{job.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#252933]">Job events</h3>
                <p className="mt-0.5 text-[11px] text-[#77808e]">Workflow step execution records</p>
              </div>
              <span className="rounded-full bg-[#eef1f5] px-2 py-1 text-[10px] font-medium text-[#596174]">{events.length} events</span>
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
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#77808e]">Stage {index + 1} · {event.eventType.replaceAll('_', ' ')}</p>
                        <h3 className="mt-0.5 break-words text-sm font-semibold text-[#252933]">{event.data.stepName}</h3>
                        <p className="mt-0.5 text-[11px] text-[#687386]">Task {event.data.taskSequenceNo}: {event.data.taskName} · {event.data.stepType}</p>
                      </div>
                      <time className="shrink-0 text-[10px] text-[#7b8190]">{new Date(event.eventTime).toLocaleTimeString()}</time>
                    </div>

                    <details className="mt-2 border border-[#e1e4e9] bg-white">
                      <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium text-[#596174] hover:bg-[#fafbfc]">Parameters and execution result</summary>
                      <div className="space-y-3 border-t border-[#e9ebef] px-3 py-2.5">
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#818895]">Parameters</p>
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
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#818895]">Result</p>
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
                <p className="mt-2 text-sm font-semibold text-[#3f4654]">No execution events yet</p>
                <p className="mt-1 text-xs text-[#687386]">JobEvent entries will appear here as workflow steps run.</p>
              </div>
            )}

            {job.workflowId === 3 ? (
              <section className="mt-5 border border-[#e0e3e9] bg-white">
                <div className="border-b border-[#e9ebef] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-[#252933]">Inventory report</h2>
                      <p className="mt-0.5 text-[11px] text-[#77808e]">Report #{inventoryReport?.id ?? '—'} · {inventoryReport?.scopeType ?? '—'}</p>
                    </div>
                    {inventoryReport && (
                      <button type="button" onClick={() => setShowInventoryDetails(true)} className="h-8 shrink-0 border border-[#c9d5e8] bg-white px-3 text-xs font-semibold text-primary transition hover:bg-[#f2f6fc]">
                        View details
                      </button>
                    )}
                  </div>
                </div>
                {inventoryReport ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4 text-xs">
                    <div><dt className="text-[#79808d]">Shelves</dt><dd className="mt-1 text-base font-semibold text-[#252933]">{inventoryReport.totalShelfs}</dd></div>
                    <div><dt className="text-[#79808d]">Books scanned</dt><dd className="mt-1 text-base font-semibold text-[#252933]">{inventoryReport.totalBookScanned}</dd></div>
                    <div><dt className="text-[#79808d]">Available</dt><dd className="mt-1 text-base font-semibold text-[#237a45]">{inventoryReport.totalAvailable}</dd></div>
                    <div><dt className="text-[#79808d]">Misplaced</dt><dd className="mt-1 text-base font-semibold text-[#b45309]">{inventoryReport.totalMisplaced}</dd></div>
                    <div><dt className="text-[#79808d]">Missing</dt><dd className="mt-1 text-base font-semibold text-[#b42318]">{inventoryReport.totalMissing}</dd></div>
                    <div><dt className="text-[#79808d]">Created</dt><dd className="mt-1 font-medium text-[#404754]">{new Date(inventoryReport.createdAt).toLocaleString()}</dd></div>
                  </dl>
                ) : (
                  <p className="px-4 py-5 text-xs text-[#687386]">No inventory report has been recorded.</p>
                )}
              </section>
            ) : (
              <section className="mt-5 border border-[#e0e3e9] bg-white">
                <div className="border-b border-[#e9ebef] px-4 py-3">
                  <h2 className="text-sm font-semibold text-[#252933]">Reader feedback</h2>
                  <p className="mt-0.5 text-[11px] text-[#77808e]">Feedback recorded for this task</p>
                </div>
                {feedback ? (
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-1" aria-label={`Rating ${feedback.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < feedback.rating ? 'fill-[#eab308] text-[#eab308]' : 'text-[#d5d9e0]'}`} />)}
                      <span className="ml-2 text-xs font-semibold text-[#404754]">{feedback.rating}/5</span>
                    </div>
                    {feedback.comment && <p className="mt-3 text-sm leading-5 text-[#596174]">{feedback.comment}</p>}
                  </div>
                ) : (
                  <p className="px-4 py-5 text-xs text-[#687386]">No feedback has been recorded.</p>
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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Report #{inventoryReport.id} · {inventoryReport.scopeType}</p>
                <h2 id="inventory-report-details-title" className="mt-1 text-lg font-semibold">Inventory discrepancies</h2>
                <p className="mt-1 text-xs text-[#687386]">{inventoryReport.data.items.length} books need attention</p>
              </div>
              <button type="button" aria-label="Close report details" onClick={() => setShowInventoryDetails(false)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#687386] hover:bg-[#f1f2f5] hover:text-[#252933]">
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
                      {item.issueType === 'MISPLACED' ? 'Misplaced' : 'Missing'}
                    </span>
                  </div>

                  <div className="grid gap-px bg-[#e9ebef] sm:grid-cols-2">
                    <div className="bg-white px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Expected location</p>
                      <p className="mt-1 text-xs font-medium text-[#343a45]">{item.expectedLocation.floor} · {item.expectedLocation.aisle}</p>
                      <p className="mt-0.5 text-xs text-[#596174]">Shelf {item.expectedLocation.shelf} · Level {item.expectedLocation.shelfLevel}</p>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Scanned location</p>
                      {item.actualLocation ? (
                        <>
                          <p className="mt-1 text-xs font-medium text-[#343a45]">{item.actualLocation.floor} · {item.actualLocation.aisle}</p>
                          <p className="mt-0.5 text-xs text-[#596174]">Shelf {item.actualLocation.shelf} · Level {item.actualLocation.shelfLevel}</p>
                        </>
                      ) : (
                        <p className="mt-1 text-xs font-medium text-[#b42318]">Not found in scanned shelves</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <footer className="flex shrink-0 justify-end border-t border-[#e0e3e9] bg-white px-5 py-3">
              <button type="button" onClick={() => setShowInventoryDetails(false)} className="h-9 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">Close</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

export default TaskDetail