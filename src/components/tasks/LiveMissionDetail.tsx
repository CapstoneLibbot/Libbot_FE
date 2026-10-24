import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, Check, Circle, Clock3, Play, Radio, Send, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import MapViewer from '@/components/map/MapViewer'
import SdfScene3D from '@/components/map/SdfScene3D'
import { apiGet, apiPost, type BackendMission, type BackendWorkflow, type MissionExecutionState, type RobotRuntime } from '@/lib/missionApi'

type StepEvent = MissionExecutionState
type StepProgress = 'pending' | 'running' | 'waiting' | 'completed' | 'failed'
type RobotPose = { x: number; y: number; yaw: number }
type WaitChoice = { value: string; label: string; detail?: string }
type SimulationBookTarget = { shelfId: string; label: string; x: number; y: number; yaw: number }
type SimulationSceneMetadata = {
  robotSpawn?: RobotPose
  areas?: { label: string; x: number; y: number }[]
  simulationBookTarget?: SimulationBookTarget
}

function normalizeStatus(value?: string | null) {
  return (value ?? 'UNKNOWN').trim().toUpperCase()
}

function stepIdentifier(step: BackendWorkflow['steps'][number]) {
  const configuredId = step.configuration?.id
  return configuredId === undefined || configuredId === null ? step.id : String(configuredId)
}

function displayName(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString() : 'Waiting for robot'
}

function progressForStep(stepIds: string[], events: StepEvent[]): StepProgress {
  let progress: StepProgress = 'pending'
  for (const event of events) {
    if (!stepIds.some((stepId) => stepId.toLowerCase() === String(event.currentStep ?? '').toLowerCase())) continue
    const status = normalizeStatus(event.status)
    if (status === 'RUNNING' || status === 'ACCEPTED') progress = 'running'
    else if (status === 'WAITING') progress = 'waiting'
    else if (status === 'STEP_COMPLETED') progress = 'completed'
    else if (status === 'STEP_FAILED') progress = 'failed'
  }
  return progress
}

function LiveMissionDetail({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<BackendMission | null>(null)
  const [workflow, setWorkflow] = useState<BackendWorkflow | null>(null)
  const [execution, setExecution] = useState<MissionExecutionState | null>(null)
  const [events, setEvents] = useState<StepEvent[]>([])
  const [runtime, setRuntime] = useState<RobotRuntime | null>(null)
  const [spawnPose, setSpawnPose] = useState<RobotPose | null>(null)
  const [simulationBookTarget, setSimulationBookTarget] = useState<SimulationBookTarget | null>(null)
  const [roomLabels, setRoomLabels] = useState<{ label: string; x: number; y: number }[]>([])
  const [mapViewMode, setMapViewMode] = useState<'2d' | 'gazebo3d'>('gazebo3d')
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [speedPending, setSpeedPending] = useState(false)
  const [runPending, setRunPending] = useState(false)
  const [waitInput, setWaitInput] = useState('')
  const [waitChoices, setWaitChoices] = useState<WaitChoice[]>([])
  const [waitChoicesLoading, setWaitChoicesLoading] = useState(false)
  const [eventPending, setEventPending] = useState(false)
  const [submittedWaitKey, setSubmittedWaitKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let nextPoll: number | undefined

    const refresh = async () => {
      try {
        const missionResponse = await apiGet<BackendMission>(`/api/missions/${missionId}`)
        if (!active) return
        setMission(missionResponse)
        const requests = await Promise.allSettled([
          missionResponse.workflowId
            ? apiGet<BackendWorkflow>(`/api/workflows/${missionResponse.workflowId}`)
            : Promise.reject(new Error('Mission has no workflow assigned.')),
          apiGet<MissionExecutionState>(`/api/missions/${missionId}/execution`),
          apiGet<StepEvent[]>(`/api/missions/${missionId}/execution/events`),
        ])
        if (!active) return

        if (requests[0].status === 'fulfilled') setWorkflow(requests[0].value)
        else setError(requests[0].reason instanceof Error ? requests[0].reason.message : 'Unable to load workflow steps.')
        if (requests[1].status === 'fulfilled') setExecution(requests[1].value)
        if (requests[2].status === 'fulfilled') setEvents(requests[2].value)
        if (requests[0].status === 'fulfilled'
          && (requests[1].status === 'fulfilled' || requests[2].status === 'fulfilled')) setError(null)
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Cannot reach the backend.')
      }

      if (active) nextPoll = window.setTimeout(refresh, 1200)
    }

    void refresh()
    return () => {
      active = false
      if (nextPoll !== undefined) window.clearTimeout(nextPoll)
    }
  }, [missionId])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/maps/library-map.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<SimulationSceneMetadata>
      })
      .then((scene) => {
        setSpawnPose(scene.robotSpawn ?? null)
        setRoomLabels(scene.areas ?? [])
        setSimulationBookTarget(scene.simulationBookTarget ?? null)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setSpawnPose(null)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let active = true
    let nextPoll: number | undefined
    const refreshRuntime = async () => {
      try {
        const nextRuntime = await apiGet<RobotRuntime>(
          `/api/robot-runtimes/${encodeURIComponent(mission?.runtimeId || 'sim')}`,
        )
        if (active) setRuntime(nextRuntime)
      } catch {
        if (active) setRuntime((current) => current ? { ...current, stale: true } : null)
      }
      if (active) nextPoll = window.setTimeout(refreshRuntime, 250)
    }
    void refreshRuntime()
    return () => {
      active = false
      if (nextPoll !== undefined) window.clearTimeout(nextPoll)
    }
  }, [mission?.runtimeId])

  useEffect(() => {
    const eventType = execution?.expectedEventType?.trim().toUpperCase()
    if (normalizeStatus(execution?.status) !== 'WAITING' || mission?.runtimeId !== 'sim'
      || !eventType || !['BOOK_SELECTED', 'FACILITY_SELECTED'].includes(eventType)) {
      setWaitChoices([])
      setWaitChoicesLoading(false)
      return
    }

    let active = true
    setWaitChoicesLoading(true)
    const path = eventType === 'BOOK_SELECTED'
      ? '/api/workflow-data/simulation/books/search'
      : '/api/workflow-data/simulation/facilities/search'
    apiGet<{ books?: { bookId: string; title: string; author?: string }[]; facilities?: { facilityId: string; name: string; type?: string }[] }>(path)
      .then((result) => {
        if (!active) return
        const choices = eventType === 'BOOK_SELECTED'
          ? (result.books ?? []).map((book) => ({ value: book.bookId, label: book.title, detail: book.author }))
          : (result.facilities ?? []).map((facility) => ({ value: facility.facilityId, label: facility.name, detail: facility.type }))
        setWaitChoices(choices)
      })
      .catch(() => { if (active) setWaitChoices([]) })
      .finally(() => { if (active) setWaitChoicesLoading(false) })
    return () => { active = false }
  }, [execution?.expectedEventType, execution?.status, mission?.runtimeId])

  useEffect(() => {
    if (mission?.runtimeId !== 'sim') {
      setSimulationSpeed(1)
      return
    }
    let active = true
    apiGet<{ multiplier: number }>('/api/robot-runtimes/sim/simulation-speed')
      .then((result) => { if (active) setSimulationSpeed(result.multiplier) })
      .catch((requestError: unknown) => {
        if (active) setActionError(requestError instanceof Error ? requestError.message : 'Cannot read Gazebo speed.')
      })
    return () => { active = false }
  }, [mission?.runtimeId])

  const orderedSteps = useMemo(
    () => [...(workflow?.steps ?? [])].sort((first, second) => first.sequence - second.sequence),
    [workflow],
  )
  const currentStep = orderedSteps.find((step) =>
    stepIdentifier(step).toLowerCase() === String(execution?.currentStep ?? '').toLowerCase()
    || step.id.toLowerCase() === String(execution?.currentStep ?? '').toLowerCase()
    || step.name.toLowerCase() === String(execution?.currentStepName ?? '').toLowerCase(),
  )
  const status = normalizeStatus(execution?.status ?? mission?.status)
  const missionIsComplete = status === 'SUCCEEDED' || status === 'COMPLETED'
  const missionHasFailed = status === 'FAILED' || status === 'CANCELLED'
  const missionInProgress = status === 'ACCEPTED' || status === 'RUNNING' || status === 'WAITING'
  const isSimulation = (mission?.runtimeId ?? 'sim').toLowerCase() === 'sim'
  const liveRobotPose = runtime?.telemetry?.pose ?? null
  const robotPose = liveRobotPose ?? spawnPose
  const canRun = isSimulation
    ? !missionInProgress
    : ['QUEUED', 'PENDING', 'FAILED', 'CANCELLED'].includes(status)
  const expectedEventType = execution?.expectedEventType?.trim().toUpperCase() ?? ''
  const waitKey = `${execution?.executionId ?? ''}:${execution?.currentStep ?? ''}:${expectedEventType}`
  const waitAlreadySubmitted = submittedWaitKey === waitKey

  const runMission = async () => {
    setRunPending(true)
    setActionError(null)
    try {
      await apiPost(`/api/missions/${missionId}/start`, { runtimeId: mission?.runtimeId ?? 'sim' })
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to start the mission.')
    } finally {
      setRunPending(false)
    }
  }

  const changeSimulationSpeed = async (multiplier: number) => {
    setSpeedPending(true)
    setActionError(null)
    try {
      await apiPost('/api/robot-runtimes/sim/simulation-speed', { multiplier })
      setSimulationSpeed(multiplier)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to change Gazebo speed.')
    } finally {
      setSpeedPending(false)
    }
  }

  const submitWaitEvent = async (value: string) => {
    const selected = value.trim()
    if (!selected || !expectedEventType || eventPending || waitAlreadySubmitted) return
    setEventPending(true)
    setActionError(null)
    try {
      await apiPost(`/api/missions/${missionId}/execution/events`, {
        eventType: expectedEventType,
        data: { value: selected },
      })
      setSubmittedWaitKey(waitKey)
      setWaitInput('')
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to submit the workflow choice.')
    } finally {
      setEventPending(false)
    }
  }

  useEffect(() => {
    if (mission?.runtimeId !== 'sim' || status !== 'WAITING' || !expectedEventType
      || waitAlreadySubmitted || eventPending) return

    let automaticValue: string | undefined
    if (expectedEventType === 'BOOK_SELECTED' || expectedEventType === 'FACILITY_SELECTED') {
      if (expectedEventType === 'BOOK_SELECTED' && execution?.expectedBookId) {
        automaticValue = execution.expectedBookId
      } else {
        if (waitChoicesLoading) return
        automaticValue = waitChoices[0]?.value
      }
    } else if (expectedEventType === 'BOOK_ACTION' || expectedEventType === 'MAP_ACTION') {
      automaticValue = execution?.allowedValues?.includes('START_GUIDANCE') ? 'START_GUIDANCE' : undefined
    } else if (expectedEventType === 'RATING_SUBMIT') {
      automaticValue = '5'
    }

    if (automaticValue) void submitWaitEvent(automaticValue)
  }, [
    mission?.runtimeId,
    status,
    expectedEventType,
    waitAlreadySubmitted,
    eventPending,
    waitChoicesLoading,
    waitChoices,
    execution?.allowedValues,
    execution?.expectedBookId,
  ])

  if (!mission && error) {
    return (
      <div className="min-h-screen bg-[#0c0d10] p-6 text-white">
        <Link to="/tasks" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to tasks</Link>
        <section role="alert" className="mx-auto mt-10 max-w-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <h1 className="text-lg font-semibold">Mission monitor unavailable</h1>
          <p className="mt-2 text-sm text-white/65">{error}. Check that the backend is running and VITE_API_BASE_URL points to it.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#0c0d10] text-white xl:h-screen">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#121318] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/tasks" aria-label="Back to tasks" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/55 hover:bg-white/10 hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Robot workflow monitor</p>
            <h1 className="truncate text-sm font-semibold">{mission?.workflowName ?? 'Loading mission…'}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canRun && (
            <button
              type="button"
              onClick={() => void runMission()}
              disabled={runPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#07140d] hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
            >
              <Play className="h-3.5 w-3.5" />{runPending ? 'Starting…' : missionIsComplete || missionHasFailed ? 'Run again' : 'Run'}
            </button>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${missionHasFailed ? 'bg-rose-400/15 text-rose-300' : missionIsComplete ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-200'}`}>{displayName(status)}</span>
          <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:inline-flex ${runtime?.connected ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/8 text-white/50'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${runtime?.connected ? 'bg-emerald-400' : 'bg-white/30'}`} />{runtime?.displayName ?? mission?.runtimeId ?? 'Robot'}{runtime?.stale ? ' · stale' : ''}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse xl:flex-row-reverse">
        <main className="min-h-[420px] min-w-0 flex-1 xl:min-h-0">
          <div className="flex h-full min-h-[420px] flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#121318] px-4 py-2.5">
              <div>
                <h2 className="text-sm font-semibold">Library simulation</h2>
                <p className="mt-0.5 text-xs text-white/45">50 × 60 m · robot position updates live</p>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden items-center gap-1.5 text-xs text-white/45 lg:inline-flex">
                  <Radio className="h-3.5 w-3.5" />
                  {runtime?.telemetry?.navigationState ?? 'Awaiting telemetry'}
                  {robotPose && ` · X ${robotPose.x.toFixed(1)} · Y ${robotPose.y.toFixed(1)} m`}
                </span>
                <div className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => setMapViewMode('2d')}
                    aria-pressed={mapViewMode === '2d'}
                    className={`rounded px-2.5 py-1.5 text-[11px] font-medium transition ${mapViewMode === '2d' ? 'bg-white/12 text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    2D map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapViewMode('gazebo3d')}
                    aria-pressed={mapViewMode === 'gazebo3d'}
                    className={`rounded px-2.5 py-1.5 text-[11px] font-medium transition ${mapViewMode === 'gazebo3d' ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/50 hover:text-white'}`}
                  >
                    Gazebo 3D
                  </button>
                </div>
                {mission?.runtimeId === 'sim' && (
                  <div aria-label="Gazebo simulation speed" className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-black/20 p-1">
                    <span className="px-1 text-[10px] font-medium text-white/40">Speed</span>
                    {[1, 2, 3, 4].map((multiplier) => (
                      <button
                        key={multiplier}
                        type="button"
                        onClick={() => void changeSimulationSpeed(multiplier)}
                        disabled={speedPending}
                        aria-pressed={simulationSpeed === multiplier}
                        className={`rounded px-2 py-1.5 text-[11px] font-semibold transition disabled:cursor-wait disabled:opacity-50 ${simulationSpeed === multiplier ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/50 hover:text-white'}`}
                      >
                        x{multiplier}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="min-h-[340px] flex-1">
              {mapViewMode === '2d' ? (
                <MapViewer
                  yamlUrl="/maps/library_sim.yaml"
                  endpoints={[]}
                  aisles={[]}
                  zones={[]}
                  selectedEndpointId={null}
                  selectedZoneId={null}
                  showEndpoints={false}
                  showZones={false}
                  zoneDrawMode={false}
                  showEndpointLabels={false}
                  liveRobotPose={robotPose}
                  roomLabels={simulationBookTarget
                    ? [...roomLabels, { label: simulationBookTarget.label, x: simulationBookTarget.x, y: simulationBookTarget.y }]
                    : roomLabels}
                  onEndpointSelect={() => undefined}
                  onZoneSelect={() => undefined}
                  onMapClick={() => undefined}
                  onZoneDrawComplete={() => undefined}
                />
              ) : (
                <SdfScene3D liveRobotPose={liveRobotPose} />
              )}
            </div>
          </div>
        </main>

        <aside className="flex max-h-[72vh] min-h-[440px] w-full shrink-0 flex-col border-t border-white/10 bg-[#f7f8fa] text-[#252933] xl:max-h-none xl:min-h-0 xl:w-[430px] xl:border-r xl:border-t-0">
          <div className="shrink-0 border-b border-[#e0e3e9] bg-white px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Execution progress</p>
            <h2 className="mt-1 break-words text-base font-semibold">{workflow?.name ?? mission?.workflowName ?? 'Workflow'}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#687386]">
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Updated {formatTime(execution?.updatedAt)}</span>
              {runtime?.telemetry?.battery !== null && runtime?.telemetry?.battery !== undefined && <span>Battery {Math.round(runtime.telemetry.battery)}%</span>}
            </div>
            {currentStep && missionInProgress && (
              <div className="mt-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">Robot is working on</p>
                <p className="mt-1 text-sm font-semibold text-[#252933]">{currentStep.sequence}. {currentStep.name}</p>
              </div>
            )}
            {status === 'WAITING' && expectedEventType && (
              <div className="mt-4 border border-cyan-200 bg-cyan-50 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-800">
                  {mission?.runtimeId === 'sim' ? 'Demo is continuing automatically' : 'Workflow is waiting for your choice'}
                </p>
                <p className="mt-1 text-xs text-[#465164]">{displayName(expectedEventType)} · chọn hoặc nhập để workflow tiếp tục.</p>
                {waitAlreadySubmitted ? (
                  <p className="mt-3 text-xs font-medium text-emerald-700">Đã nhận lựa chọn. Workflow đang chạy tiếp…</p>
                ) : (
                  <>
                    {(execution?.allowedValues?.length ?? 0) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {execution?.allowedValues?.map((value) => (
                          <button key={value} type="button" onClick={() => void submitWaitEvent(value)} disabled={eventPending}
                            className="border border-cyan-700 bg-white px-3 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-50">
                            {eventPending ? 'Đang gửi…' : displayName(value)}
                          </button>
                        ))}
                      </div>
                    )}
                    {waitChoicesLoading && <p className="mt-3 text-xs text-[#687386]">Đang tải lựa chọn demo…</p>}
                    {waitChoices.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {waitChoices.map((choice) => (
                          <button key={choice.value} type="button" onClick={() => void submitWaitEvent(choice.value)} disabled={eventPending}
                            className="flex w-full items-center justify-between gap-3 border border-[#c8dce7] bg-white px-3 py-2 text-left hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-50">
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-[#252933]">{choice.label}</span>
                              {choice.detail && <span className="mt-0.5 block truncate text-[10px] text-[#687386]">{choice.detail}</span>}
                            </span>
                            <Send className="h-3.5 w-3.5 shrink-0 text-cyan-800" />
                          </button>
                        ))}
                      </div>
                    )}
                    {!execution?.allowedValues?.length && !waitChoicesLoading && waitChoices.length === 0 && (
                      <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void submitWaitEvent(waitInput) }}>
                        <input value={waitInput} onChange={(event) => setWaitInput(event.target.value)}
                          aria-label="Workflow choice" placeholder={expectedEventType === 'BOOK_SELECTED' ? 'Book ID' : expectedEventType === 'FACILITY_SELECTED' ? 'Facility ID' : 'Giá trị lựa chọn'}
                          className="h-9 min-w-0 flex-1 border border-[#cbd2dc] bg-white px-2.5 text-xs text-[#252933] outline-none focus:border-cyan-700" />
                        <button type="submit" disabled={!waitInput.trim() || eventPending}
                          className="inline-flex h-9 items-center gap-1.5 bg-cyan-800 px-3 text-xs font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <Send className="h-3.5 w-3.5" />{eventPending ? 'Đang gửi…' : 'Gửi'}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}
            {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
            {actionError && <p role="alert" className="mt-3 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{actionError}</p>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {orderedSteps.length ? (
              <ol className="space-y-2">
                {orderedSteps.map((step) => {
                  const identifier = stepIdentifier(step)
                  let progress = progressForStep([identifier, step.id, step.name], events)
                  if (progress === 'pending' && execution?.currentStep
                    && identifier.toLowerCase() === execution.currentStep.toLowerCase()) {
                    const currentStatus = normalizeStatus(execution.status)
                    progress = currentStatus === 'WAITING' ? 'waiting'
                      : currentStatus === 'STEP_COMPLETED' ? 'completed'
                        : currentStatus === 'STEP_FAILED' || currentStatus === 'FAILED' ? 'failed'
                          : 'running'
                  }
                  const isCurrent = currentStep?.id === step.id && missionInProgress
                  const style = progress === 'running' || progress === 'waiting'
                    ? 'border-amber-300 bg-amber-50 shadow-[0_0_0_2px_rgba(245,158,11,0.11)]'
                    : progress === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : progress === 'failed'
                        ? 'border-rose-200 bg-rose-50'
                        : 'border-[#e1e4e9] bg-white'
                  return (
                    <li key={step.id} aria-current={isCurrent ? 'step' : undefined} className={`relative flex gap-3 border px-3 py-3 transition-colors ${style} ${isCurrent ? 'animate-pulse' : ''}`}>
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${progress === 'completed' ? 'bg-emerald-600 text-white' : progress === 'failed' ? 'bg-rose-600 text-white' : progress === 'running' || progress === 'waiting' ? 'bg-amber-500 text-white' : 'bg-[#eef0f4] text-[#687386]'}`}>
                        {progress === 'completed' ? <Check className="h-4 w-4" />
                          : progress === 'failed' ? <XCircle className="h-4 w-4" />
                            : progress === 'running' || progress === 'waiting' ? <Activity className="h-4 w-4" />
                              : <Circle className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#79808d]">Step {step.sequence} · {displayName(step.type)}</p>
                          {isCurrent && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-amber-800">Now</span>}
                        </div>
                        <h3 className="mt-1 break-words text-sm font-semibold text-[#252933]">{step.name}</h3>
                        {progress === 'waiting' && <p className="mt-1 text-[11px] text-amber-800">Waiting for input</p>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <div className="border border-dashed border-[#cfd3dd] bg-white px-4 py-8 text-center text-sm text-[#687386]">
                {mission ? 'Loading workflow steps…' : 'Connecting to mission…'}
              </div>
            )}
            {execution?.error && <div className="mt-4 border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-800">{execution.error}</div>}
            <p className="mt-4 text-center text-[10px] text-[#89909d]">Progress refreshes automatically while the mission runs.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default LiveMissionDetail
