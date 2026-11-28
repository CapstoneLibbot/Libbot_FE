import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle2,
  CircleStop,
  Crosshair,
  LoaderCircle,
  Play,
  Radio,
  ShieldCheck,
} from 'lucide-react'

import OperationsMap2D from '../maps/components/OperationsMap2D'
import {
  armRuntime,
  cancelNavigationGoal,
  disarmRuntime,
  getLatestSavedRobotMap,
  getRobotRuntimes,
  getSavedRobotMapDetails,
  sendNavigationGoal,
  setInitialPose,
} from '../maps/api/runtimeApi'
import { signalRClient } from '../maps/services/signalRClient'
import type {
  OccupancyMapMetadata,
  Pose2D,
  RobotRuntime,
} from '../maps/types/runtime'
import { occupancyGridToMapMetadata, simulationMapToMetadata } from '../maps/utils/occupancyGrid'
import {
  apiErrorMessage,
  cancelJob,
  createJob,
  getDispatchWorkflows,
  getJobExecution,
  startJob,
  submitJobEvent,
} from './api'
import type {
  AutoChargeStartedEvent,
  DispatchRuntimeId,
  DispatchWorkflow,
  LibrarianNotificationEvent,
  JobExecution,
} from './types'
import { isTerminalJobStatus, parseInitialContext } from './utils'

type SelectionMode = 'INITIAL_POSE' | 'GOAL'
type ViewMode = 'SPLIT' | '2D' | '3D'

const RobotScene3D = lazy(() => import('../maps/components/RobotScene3D'))

const fieldClass = 'w-full rounded-md border border-[#d9dce5] bg-white px-3 py-2 text-sm text-[#252933] outline-none focus:border-primary'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45'
const runtimeStateLabels: Record<string, string> = {
  UNKNOWN: 'Không xác định',
  IDLE: 'Đang rảnh',
  READY: 'Sẵn sàng',
  ACTIVE: 'Đang hoạt động',
  RUNNING: 'Đang chạy',
  LOCALIZED: 'Đã định vị',
  INITIALIZING: 'Đang khởi tạo',
  NAVIGATING: 'Đang điều hướng',
  SUCCEEDED: 'Thành công',
  FAILED: 'Thất bại',
}
const workflowStepTypeLabels: Record<string, string> = {
  MOVE: 'Di chuyển',
  SCAN: 'Quét',
  PROCESS_DATA: 'Xử lý dữ liệu',
  EVALUATE: 'Đánh giá',
  DISPLAY: 'Hiển thị',
  WAIT: 'Chờ',
  NOTIFY: 'Thông báo',
}
const jobStatusLabels: Record<string, string> = {
  ACCEPTED: 'Đã tiếp nhận',
  QUEUED: 'Đang xếp hàng',
  RUNNING: 'Đang chạy',
  WAITING: 'Đang chờ',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
}

export default function DispatchWorkflowPage() {
  const [workflows, setWorkflows] = useState<DispatchWorkflow[]>([])
  const [workflowId, setWorkflowId] = useState('')
  const [runtimes, setRuntimes] = useState<RobotRuntime[]>([])
  const [runtimeId, setRuntimeId] = useState<DispatchRuntimeId>('sim')
  const [runtime, setRuntime] = useState<RobotRuntime | null>(null)
  const [map, setMap] = useState<OccupancyMapMetadata | null>(null)
  const [mapLabel, setMapLabel] = useState('Bản đồ mô phỏng thư viện')
  const [mapLoading, setMapLoading] = useState(true)
  const [mapError, setMapError] = useState('')
  const [view, setView] = useState<ViewMode>('SPLIT')
  const [mode, setMode] = useState<SelectionMode>('GOAL')
  const [draft, setDraft] = useState<Pose2D | null>(null)
  const [leaseId, setLeaseId] = useState<string | null>(null)
  const leaseRef = useRef<string | null>(null)
  const runtimeIdRef = useRef<DispatchRuntimeId>('sim')
  const [priority, setPriority] = useState('HIGH')
  const [contextText, setContextText] = useState('{\n  "query": "technology"\n}')
  const [busyAction, setBusyAction] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [jobId, setJobId] = useState('')
  const [execution, setExecution] = useState<JobExecution | null>(null)
  const [eventText, setEventText] = useState('{\n  "value": ""\n}')

  const selectedWorkflow = workflows.find((workflow) => workflow.id === workflowId) ?? null
  const telemetry = runtime?.telemetry
  const isReal = runtimeId === 'real'
  const online = Boolean(runtime?.connected && !runtime.stale)
  const localized = telemetry?.localizationState === 'LOCALIZED'
  const navigationReady = Boolean(telemetry?.navigationReady)
  const isNavigating = ['SENDING', 'NAVIGATING', 'CANCELING'].includes(telemetry?.navigationState ?? '')
  const terminalJob = isTerminalJobStatus(execution?.status)
  const canDispatch = Boolean(
    selectedWorkflow && online && localized && navigationReady && (!isReal || (runtime?.armed && leaseId)),
  )
  const canSetInitialPose = Boolean(
    draft && isReal && online && runtime?.navigationActive && runtime?.armed && leaseId,
  )
  const canSendGoal = Boolean(
    draft && online && localized && navigationReady && !isNavigating && (!isReal || (runtime?.armed && leaseId)),
  )

  const refreshRuntimes = useCallback(async () => {
    try {
      const next = await getRobotRuntimes()
      setRuntimes(next)
      setRuntime(next.find((item) => item.id.toLowerCase() === runtimeId) ?? null)
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Could not load robot runtimes.'))
    }
  }, [runtimeId])

  useEffect(() => {
    void getDispatchWorkflows()
      .then((items) => {
        const active = items.filter((workflow) => workflow.isActive)
        setWorkflows(active)
        setWorkflowId((current) => current || active[0]?.id || '')
      })
      .catch((cause) => setError(apiErrorMessage(cause, 'Could not load workflows.')))
  }, [])

  useEffect(() => {
    void refreshRuntimes()
    const timer = window.setInterval(() => void refreshRuntimes(), 2000)
    return () => window.clearInterval(timer)
  }, [refreshRuntimes])

  useEffect(() => {
    let active = true
    setMapLoading(true)
    setMapError('')
    setMap(null)

    if (runtimeId === 'sim') {
      const controller = new AbortController()
      void fetch('/maps/library-map.json', { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.json() as Promise<Parameters<typeof simulationMapToMetadata>[0]>
        })
        .then((nextMap) => {
          if (active) {
            setMap(simulationMapToMetadata(nextMap))
            setMapLabel('Simulation library map')
          }
        })
        .catch((cause) => {
          if (active && !controller.signal.aborted) setMapError(apiErrorMessage(cause, 'Could not load simulation map.'))
        })
        .finally(() => { if (active) setMapLoading(false) })
      return () => {
        active = false
        controller.abort()
      }
    }

    void (async () => {
      try {
        const latest = await getLatestSavedRobotMap()
        const targetId = runtime?.telemetry?.activeMapId ?? latest?.id
        if (!targetId) throw new Error('No saved robot map is available.')
        const details = await getSavedRobotMapDetails(targetId)
        if (!active) return
        setMap(occupancyGridToMapMetadata(details.grid))
        setMapLabel(details.map.name)
      } catch (cause) {
        if (active) setMapError(apiErrorMessage(cause, 'Could not load the active robot map.'))
      } finally {
        if (active) setMapLoading(false)
      }
    })()

    return () => { active = false }
  }, [runtimeId, runtime?.telemetry?.activeMapId])

  useEffect(() => {
    void signalRClient.subscribeRuntime(runtimeId)
    const unsubscribeTelemetry = signalRClient.subscribe<RobotRuntime>('RobotTelemetryUpdated', (payload) => {
      if (payload.id.toLowerCase() === runtimeId) setRuntime(payload)
    })
    const unsubscribeStep = signalRClient.subscribe<JobExecution>('JobStepChanged', (payload) => {
      if (payload.jobId === jobId) setExecution(payload)
    })
    const unsubscribeStatus = signalRClient.subscribe<{ jobId: string; status: string }>('JobStatusChanged', (payload) => {
      if (payload.jobId === jobId) {
        setExecution((current) => current ? { ...current, status: payload.status } : current)
      }
    })
    return () => {
      unsubscribeTelemetry()
      unsubscribeStep()
      unsubscribeStatus()
      void signalRClient.unsubscribeRuntime(runtimeId)
    }
  }, [runtimeId, jobId])

  useEffect(() => {
    void signalRClient.subscribeLibrarian()
    const unsubscribeAutoCharge = signalRClient.subscribe<AutoChargeStartedEvent>('AutoChargeStarted', (payload) => {
      if (payload.runtimeId.toLowerCase() !== 'real') return
      setRuntimeId('real')
      setJobId(payload.jobId)
      setExecution({
        jobId: payload.jobId,
        executionId: payload.executionId ?? undefined,
        runtimeId: 'real',
        status: payload.status ?? (payload.queued ? 'QUEUED' : 'ACCEPTED'),
      })
      setError('')
      setNotice(`Pin còn ${payload.batteryPercent.toFixed(0)}%. Robot đang tự quay về trạm sạc${payload.queued ? ' sau khi kết thúc bước hiện tại' : ''}.`)
    })
    const unsubscribeLibrarianNotification = signalRClient.subscribe<LibrarianNotificationEvent>('LibrarianNotification', (payload) => {
      if (payload.runtimeId && payload.runtimeId.toLowerCase() !== 'real') return
      if (payload.type === 'LOW_BATTERY_RETURN_BLOCKED') {
        setError(payload.message)
      } else {
        setNotice(payload.message)
      }
    })
    return () => {
      unsubscribeAutoCharge()
      unsubscribeLibrarianNotification()
      void signalRClient.unsubscribeLibrarian()
    }
  }, [])

  useEffect(() => {
    if (!jobId || terminalJob) return
    let active = true
    const poll = async () => {
      try {
        const next = await getJobExecution(jobId)
        if (active) setExecution(next)
      } catch (cause) {
        if (active) setError(apiErrorMessage(cause, 'Could not read job execution state.'))
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), 1500)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [jobId, terminalJob])

  useEffect(() => {
    leaseRef.current = leaseId
    runtimeIdRef.current = runtimeId
  }, [leaseId, runtimeId])

  useEffect(() => {
    const release = () => {
      if (!leaseRef.current) return
      void fetch(`/api/robot-runtimes/${runtimeIdRef.current}/arm`, { method: 'DELETE', keepalive: true })
    }
    window.addEventListener('beforeunload', release)
    return () => {
      window.removeEventListener('beforeunload', release)
      if (leaseRef.current) void disarmRuntime(runtimeIdRef.current)
    }
  }, [])

  const selectRuntime = async (next: DispatchRuntimeId) => {
    if (leaseId) {
      try { await disarmRuntime(runtimeId) } catch { /* Lease may already have expired. */ }
    }
    setRuntimeId(next)
    setLeaseId(null)
    setDraft(null)
    setJobId('')
    setExecution(null)
    setError('')
    setNotice('')
    if (next === 'sim') setMode('GOAL')
  }

  const runAction = async (name: string, action: () => Promise<void>) => {
    setBusyAction(name)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không thể hoàn tất yêu cầu.'))
    } finally {
      setBusyAction('')
    }
  }

  const handleArm = () => runAction('arm', async () => {
    const lease = await armRuntime(runtimeId)
    setLeaseId(lease.leaseId)
    await refreshRuntimes()
    setNotice(`Đã cho phép điều khiển robot đến ${new Date(lease.expiresAt).toLocaleTimeString('vi-VN')}.`)
  })

  const handleDisarm = () => runAction('disarm', async () => {
    await disarmRuntime(runtimeId)
    setLeaseId(null)
    await refreshRuntimes()
    setNotice('Đã khóa điều khiển robot thực.')
  })

  const handleMapCommand = () => runAction('map-command', async () => {
    if (!draft) return
    if (mode === 'INITIAL_POSE') {
      await setInitialPose(runtimeId, draft, leaseId)
      setNotice('Đã gửi vị trí ban đầu. Đang chờ định vị.')
    } else {
      const response = await sendNavigationGoal(runtimeId, draft, leaseId)
      setNotice(`Điểm đích điều hướng ${response.commandId.slice(0, 8)} đã được chấp nhận.`)
    }
    setDraft(null)
  })

  const handleStopNavigation = () => runAction('stop-navigation', async () => {
    if (!telemetry?.activeGoalId) return
    await cancelNavigationGoal(runtimeId, telemetry.activeGoalId, leaseId)
    setNotice('Đã gửi yêu cầu hủy điều hướng.')
  })

  const handleDispatch = () => runAction('dispatch', async () => {
    if (!selectedWorkflow) return
    const initialContext = parseInitialContext(contextText)
    const job = await createJob({
      workflowId: selectedWorkflow.id,
      priority,
      runtimeId,
      initialContext,
    })
    setJobId(job.id)
    try {
      await startJob(job.id, runtimeId, leaseId)
      setExecution({ jobId: job.id, runtimeId, status: 'ACCEPTED' })
      setNotice(`Đã điều phối nhiệm vụ ${job.id.slice(0, 8)} đến ${runtimeId.toUpperCase()}.`)
    } catch (cause) {
      setExecution({ jobId: job.id, runtimeId, status: 'QUEUED', error: apiErrorMessage(cause, 'Không thể khởi chạy nhiệm vụ.') })
      throw cause
    }
  })

  const handleCancelJob = () => runAction('cancel-job', async () => {
    if (!jobId) return
    await cancelJob(jobId)
    setExecution((current) => current ? { ...current, status: 'CANCELLED' } : current)
    setNotice('Đã gửi yêu cầu hủy nhiệm vụ.')
  })

  const sendEvent = (data?: unknown) => runAction('event', async () => {
    if (!jobId || !execution?.expectedEventType) return
    const payload = data ?? parseInitialContext(eventText)
    await submitJobEvent(jobId, execution.expectedEventType, payload)
    setNotice(`Đã gửi sự kiện ${execution.expectedEventType}.`)
  })

  const statusText = useMemo(() => {
    if (!runtime) return 'Môi trường chạy không khả dụng'
    if (!online) return 'Ngoại tuyến hoặc dữ liệu đã cũ'
    if (!localized) return `Định vị: ${runtimeStateLabels[telemetry?.localizationState ?? 'UNKNOWN'] ?? telemetry?.localizationState ?? 'UNKNOWN'}`
    if (!navigationReady) return runtimeStateLabels[telemetry?.navigationModeState ?? ''] ?? telemetry?.navigationModeState ?? 'Nav2 chưa sẵn sàng'
    return runtimeStateLabels[telemetry?.navigationState ?? 'IDLE'] ?? telemetry?.navigationState ?? 'IDLE'
  }, [localized, navigationReady, online, runtime, telemetry])

  return (
    <div className="h-full min-h-0 overflow-x-auto overflow-y-hidden bg-[#0c1419] p-3 text-[#dce8ec]">
      <div className="mx-auto grid h-full min-h-0 min-w-[1160px] max-w-[1800px] grid-cols-[250px_minmax(540px,1fr)_340px] grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
        <header className="col-span-3 flex items-center justify-between gap-4 rounded-xl border border-[#294852] bg-gradient-to-br from-[#102129] to-[#142f39] px-5 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#23c2df]">Trung tâm điều khiển LibBot</p>
            <div className="flex items-baseline gap-3"><h1 className="text-xl font-bold text-white">Dispatch Workflow</h1><p className="hidden text-xs text-[#91a8b0] 2xl:block">Khởi chạy và theo dõi quy trình của hệ thống tại một nơi.</p></div>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
            <Radio className="h-4 w-4" /> {statusText}
          </div>
        </header>

        <section className="col-span-3 flex items-center justify-between gap-3 rounded-xl border border-[#294852] bg-[#102129] p-1.5">
          <div className="flex gap-2">
            {(['sim', 'real'] as const).map((id) => (
              <button key={id} type="button" onClick={() => void selectRuntime(id)} className={`${buttonClass} ${runtimeId === id ? 'bg-[#087f9a] text-white' : 'bg-[#14272f] text-[#9fb1b8]'}`}>
                {id.toUpperCase()} <span className="font-normal">{runtimes.find((item) => item.id.toLowerCase() === id)?.displayName ?? 'runtime'}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(['SPLIT', '2D', '3D'] as const).map((item) => (
              <button key={item} type="button" onClick={() => setView(item)} className={`${buttonClass} ${view === item ? 'bg-[#087f9a] text-white' : 'bg-[#14272f] text-[#9fb1b8]'}`}>
                {item === '3D' ? <Box className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />} {item === 'SPLIT' ? 'Chia đôi' : item}
              </button>
            ))}
          </div>
        </section>

        <div className="contents">
          <aside className="col-start-1 row-start-3 min-h-0 space-y-2 overflow-y-auto pr-1">
            <ControlCard title="Dữ liệu vận hành">
              <Metric label="Kết nối" value={online ? 'Trực tuyến' : 'Ngoại tuyến'} />
              <Metric label="Định vị" value={telemetry?.localizationState ?? 'UNKNOWN'} />
              <Metric label="Điều hướng" value={telemetry?.navigationState ?? 'IDLE'} />
              <Metric label="Pin" value={telemetry?.battery == null ? '—' : `${telemetry.battery.toFixed(0)}%`} />
              <Metric label="Tọa độ" value={telemetry ? `${telemetry.pose.x.toFixed(2)}, ${telemetry.pose.y.toFixed(2)}` : '—'} />
            </ControlCard>

            {isReal && (
              <ControlCard title="Khóa an toàn robot thực">
                <p className="mb-3 text-xs leading-5 text-[#8da3ab]">Cần cấp quyền điều khiển tạm thời để gửi lệnh đến robot thực.</p>
                {runtime?.armed && leaseId ? (
                  <button type="button" onClick={() => void handleDisarm()} disabled={Boolean(busyAction)} className={`${buttonClass} w-full border border-[#526570] bg-[#18343e] text-white`}><ShieldCheck className="h-4 w-4" /> Ngắt điều khiển</button>
                ) : (
                  <button type="button" onClick={() => void handleArm()} disabled={!online || Boolean(busyAction)} className={`${buttonClass} w-full bg-primary text-white`}><ShieldCheck className="h-4 w-4" /> Cho phép điều khiển robot</button>
                )}
              </ControlCard>
            )}

            <ControlCard title="Lệnh bản đồ">
              <div className="grid grid-cols-2 gap-1">
                <button type="button" disabled={!isReal} onClick={() => { setMode('INITIAL_POSE'); setDraft(null) }} className={`${buttonClass} px-2 text-xs ${mode === 'INITIAL_POSE' ? 'bg-[#087f9a] text-white' : 'bg-[#14272f] text-[#9fb1b8]'}`}>Vị trí ban đầu</button>
                <button type="button" onClick={() => { setMode('GOAL'); setDraft(null) }} className={`${buttonClass} px-2 text-xs ${mode === 'GOAL' ? 'bg-[#087f9a] text-white' : 'bg-[#14272f] text-[#9fb1b8]'}`}>Điểm đích điều hướng</button>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#8da3ab]">Nhấp lên bản đồ 2D để đặt điểm. Kéo để xác định hướng.</p>
              {draft && (
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-md bg-[#172d36] p-2 font-mono text-xs">
                  <strong className="col-span-2 text-[#faad37]">Vị trí đã chọn</strong>
                  <span>X {draft.x.toFixed(2)}</span><span>Y {draft.y.toFixed(2)}</span>
                  <span className="col-span-2">Yaw {(draft.yaw * 180 / Math.PI).toFixed(0)}°</span>
                </div>
              )}
              <button type="button" onClick={() => void handleMapCommand()} disabled={mode === 'GOAL' ? !canSendGoal || Boolean(busyAction) : !canSetInitialPose || Boolean(busyAction)} className={`${buttonClass} mt-3 w-full bg-primary text-white`}>
                <Crosshair className="h-4 w-4" /> Xác nhận {mode === 'GOAL' ? 'điểm đích' : 'vị trí ban đầu'}
              </button>
            </ControlCard>

            <button type="button" onClick={() => void handleStopNavigation()} disabled={!telemetry?.activeGoalId || Boolean(busyAction)} className={`${buttonClass} w-full border border-rose-400 bg-rose-700 py-3 text-white`}>
              <CircleStop className="h-4 w-4" /> Dừng điều hướng
            </button>
            <p className="text-center text-[11px] text-[#8da3ab]">Thao tác này không thay thế nút dừng khẩn cấp vật lý.</p>
          </aside>

          <main className={`col-start-2 row-start-3 grid h-full min-h-0 min-w-0 gap-3 ${view === 'SPLIT' ? 'grid-rows-2' : 'grid-rows-1'}`}>
            {(view === 'SPLIT' || view === '2D') && (
              <VisualPanel title={mapLabel} subtitle="Bản đồ chiếm dụng 2D">
                {map ? <OperationsMap2D map={map} robot={telemetry?.pose} draft={draft} path={telemetry?.plannedPath} onDraftChange={(pose) => { if (online) setDraft(pose) }} /> : <MapPlaceholder loading={mapLoading} error={mapError} />}
              </VisualPanel>
            )}
            {(view === 'SPLIT' || view === '3D') && (
              <VisualPanel title={`${mapLabel} · Mô hình số`} subtitle="Kéo để xoay · Cuộn để thu phóng">
                {map ? <Suspense fallback={<MapPlaceholder loading error="" />}><RobotScene3D map={map} robot={telemetry?.pose} draft={draft} path={telemetry?.plannedPath} /></Suspense> : <MapPlaceholder loading={mapLoading} error={mapError} />}
              </VisualPanel>
            )}
          </main>
        </div>

        <section className="col-start-3 row-start-3 flex min-h-0 flex-col gap-3 overflow-hidden rounded-xl border border-[#d9dce5] bg-white p-3 text-[#252933]">
          <div className="flex min-h-0 flex-[0.8] flex-col border-b border-[#e4e5ea] pb-3">
            <h2 className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary" /> Quy trình</h2>
            <select value={workflowId} onChange={(event) => { setWorkflowId(event.target.value); setJobId(''); setExecution(null) }} className={`${fieldClass} mt-3`}>
              {workflows.length === 0 && <option value="">Không có quy trình đang hoạt động</option>}
              {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
            </select>
            <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {selectedWorkflow?.steps.slice().sort((a, b) => a.sequence - b.sequence).map((step) => {
                const active = execution?.currentStep === step.id || execution?.currentStep === step.name || execution?.currentStep === String(step.configuration?.id ?? '')
                return (
                  <div key={step.id} className={`flex gap-2 rounded-md px-2 py-1.5 text-xs ${active ? 'bg-blue-50 font-semibold text-primary' : 'text-[#596174]'}`}>
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${active ? 'bg-primary' : 'bg-[#c6cad3]'}`} />
                    <span>{step.sequence}. {step.name} <span className="text-[10px] uppercase text-[#89909d]">{step.type}</span></span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="shrink-0 border-b border-[#e4e5ea] pb-3">
            <h2 className="font-semibold">Cấu hình điều phối</h2>
            <label className="mt-2 block text-xs font-medium text-[#596174]">Mức ưu tiên
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className={`${fieldClass} mt-1`}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select>
            </label>
            <label className="mt-2 block text-xs font-medium text-[#596174]">Ngữ cảnh ban đầu (JSON)
              <textarea value={contextText} onChange={(event) => setContextText(event.target.value)} rows={3} spellCheck={false} className={`${fieldClass} mt-1 resize-none font-mono text-xs`} />
            </label>
            <button type="button" onClick={() => void handleDispatch()} disabled={!canDispatch || Boolean(busyAction) || (Boolean(jobId) && !terminalJob)} className={`${buttonClass} mt-3 w-full bg-emerald-600 py-2.5 text-white`}>
              {busyAction === 'dispatch' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Điều phối đến {runtimeId.toUpperCase()}
            </button>
            {!canDispatch && <p className="mt-2 text-xs text-amber-700">Môi trường chạy cần trực tuyến, đã định vị và sẵn sàng Nav2{isReal ? ', đồng thời phải được cấp quyền điều khiển' : ''}.</p>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Thực thi nhiệm vụ</h2>
              {execution && <StatusPill status={execution.status} />}
            </div>
            {execution ? (
              <div className="mt-3 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 rounded-md bg-[#f5f6f8] p-3 text-xs">
                  <span className="text-[#687386]">Mã nhiệm vụ</span><span className="truncate font-mono">{execution.jobId}</span>
                  <span className="text-[#687386]">Bước hiện tại</span><span>{execution.currentStepName ?? execution.currentStep ?? 'Đang chờ robot'}</span>
                  <span className="text-[#687386]">Loại bước</span><span>{workflowStepTypeLabels[execution.currentStepType ?? ''] ?? execution.currentStepType ?? '—'}</span>
                  <span className="text-[#687386]">Cập nhật lúc</span><span>{execution.updatedAt ? new Date(execution.updatedAt).toLocaleTimeString('vi-VN') : '—'}</span>
                </div>
                {execution.error && <p className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">{execution.error}</p>}
                {execution.expectedEventType && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-900">{execution.expectedEventType === 'CHARGER_CONNECTED' ? 'Robot đã vào trạm. Xác nhận dây sạc đã được kết nối.' : `Đang chờ ${execution.expectedEventType}`}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(execution.allowedValues ?? []).map((value) => <button key={value} type="button" onClick={() => void sendEvent({ value })} disabled={Boolean(busyAction)} className={`${buttonClass} bg-primary text-white`}>{execution.expectedEventType === 'CHARGER_CONNECTED' && value === 'CONFIRMED' ? 'Đã cắm sạc' : value}</button>)}
                    </div>
                    {execution.expectedEventType !== 'CHARGER_CONNECTED' && (
                      <>
                        <textarea value={eventText} onChange={(event) => setEventText(event.target.value)} rows={3} className={`${fieldClass} mt-2 font-mono text-xs`} />
                        <button type="button" onClick={() => void sendEvent()} disabled={Boolean(busyAction)} className={`${buttonClass} mt-2 border border-primary text-primary`}>Gửi sự kiện</button>
                      </>
                    )}
                  </div>
                )}
                {!terminalJob && <button type="button" onClick={() => void handleCancelJob()} disabled={Boolean(busyAction)} className={`${buttonClass} border border-rose-300 text-rose-700`}><CircleStop className="h-4 w-4" /> Hủy nhiệm vụ</button>}
              </div>
            ) : <p className="mt-3 text-sm text-[#687386]">Điều phối quy trình để xem trạng thái thực thi trực tiếp.</p>}
          </div>
        </section>

        {(notice || error || telemetry?.error) && (
          <div role={error || telemetry?.error ? 'alert' : 'status'} className={`fixed bottom-5 right-5 z-50 flex max-w-md items-start gap-2 rounded-lg border p-3 text-sm shadow-xl ${error || telemetry?.error ? 'border-rose-400 bg-rose-950 text-rose-100' : 'border-cyan-400 bg-[#173b46] text-cyan-50'}`}>
            {error || telemetry?.error ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{error || telemetry?.error || notice}</span>
            <button type="button" onClick={() => { setError(''); setNotice('') }} aria-label="Đóng thông báo" className="ml-2">×</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ControlCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-[#294852] bg-[#102129] p-3"><h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white">{title}</h2>{children}</section>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 border-b border-[#263c44] py-1.5 text-xs last:border-0"><span className="text-[#80959d]">{label}</span><span className="font-mono font-semibold text-[#e9f3f6]">{value}</span></div>
}

function VisualPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[#294852] bg-[#0a151a]"><header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#294852] px-3 py-2 text-xs"><strong className="truncate text-white">{title}</strong><span className="shrink-0 text-[11px] text-[#81979f]">{subtitle}</span></header><div className="min-h-0 flex-1">{children}</div></section>
}

function MapPlaceholder({ loading, error }: { loading: boolean; error: string }) {
  return <div className="grid h-full min-h-0 place-items-center px-6 text-center text-sm text-[#82979f]">{loading ? <span className="flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" /> Đang tải bản đồ…</span> : error || 'Bản đồ không khả dụng.'}</div>
}

function StatusPill({ status }: { status: string }) {
  const terminal = isTerminalJobStatus(status)
  const failed = ['FAILED', 'CANCELLED'].includes(status.toUpperCase())
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${failed ? 'bg-rose-100 text-rose-700' : terminal ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{jobStatusLabels[status.toUpperCase()] || status}</span>
}
