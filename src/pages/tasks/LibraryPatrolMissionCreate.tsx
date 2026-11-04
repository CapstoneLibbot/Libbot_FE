import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Check, MapPinned } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { apiClient, getRobotRuntimes, getSavedMapEndpoints, type SavedMapEndpoint } from '@/features/maps/api/runtimeApi'
import type { RobotRuntime } from '@/features/maps/types/runtime'
import { apiErrorMessage, createMission, getDispatchWorkflows } from '@/features/dispatch/api'
import type { DispatchWorkflow } from '@/features/dispatch/types'

type MapDetails = { id: string; name: string; floorId: string | null; status: string }

const fieldClass = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#252933] outline-none focus:border-primary'

function LibraryPatrolMissionCreate({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<DispatchWorkflow | null>(null)
  const [runtimes, setRuntimes] = useState<RobotRuntime[]>([])
  const [runtimeId, setRuntimeId] = useState('')
  const [map, setMap] = useState<MapDetails | null>(null)
  const [endpoints, setEndpoints] = useState<SavedMapEndpoint[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [name, setName] = useState('Library Patrol')
  const [description, setDescription] = useState('Manual library patrol and environment monitoring.')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [workflowError, setWorkflowError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [allWorkflows, allRuntimes] = await Promise.all([getDispatchWorkflows(), getRobotRuntimes()])
        if (!active) return
        setRuntimes(allRuntimes)
        const activePatrols = allWorkflows.filter((item) => item.isActive && item.type.toUpperCase() === 'LIBRARY_PATROL')
        if (activePatrols.length > 1) {
          setWorkflowError('Configuration error: more than one active LIBRARY_PATROL workflow exists. Keep only one active workflow.')
          return
        }
        let patrol = activePatrols[0]
        if (!patrol) {
          patrol = (await apiClient.post<DispatchWorkflow>('/workflows/templates/library-patrol/create', {})).data
        }
        setWorkflow(patrol)
        const preferred = allRuntimes.find((runtime) => runtime.kind === 'SIM' && runtime.connected && runtime.telemetry?.activeMapId)
          ?? allRuntimes.find((runtime) => runtime.connected && runtime.telemetry?.activeMapId)
          ?? allRuntimes[0]
        if (preferred) setRuntimeId(preferred.id)
      } catch (cause) {
        if (active) setError(apiErrorMessage(cause, 'Unable to load the active patrol workflow and robot runtimes.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const selectedRuntime = runtimes.find((runtime) => runtime.id === runtimeId) ?? null
  const activeMapId = selectedRuntime?.telemetry?.activeMapId ?? null
  const selectableEndpoints = useMemo(
    () => endpoints.filter((endpoint) => endpoint.isActive && endpoint.endpointType !== 'CHARGER'),
    [endpoints],
  )
  const selectedEndpoints = selectedIds
    .map((id) => selectableEndpoints.find((endpoint) => endpoint.id === id))
    .filter((endpoint): endpoint is SavedMapEndpoint => endpoint !== undefined)

  useEffect(() => {
    let active = true
    setMap(null)
    setEndpoints([])
    setSelectedIds([])
    if (!activeMapId) {
      if (!loading && runtimeId) setError('The selected runtime has no active map. Activate a map and wait for fresh telemetry before creating a patrol.')
      return () => { active = false }
    }
    const loadMap = async () => {
      try {
        const [mapResponse, endpointResponse] = await Promise.all([
          apiClient.get<MapDetails>(`/maps/${encodeURIComponent(activeMapId)}`),
          getSavedMapEndpoints(activeMapId),
        ])
        if (!active) return
        setMap(mapResponse.data)
        setEndpoints(endpointResponse)
        setError('')
      } catch (cause) {
        if (active) setError(apiErrorMessage(cause, 'Unable to load active-map patrol endpoints.'))
      }
    }
    void loadMap()
    return () => { active = false }
  }, [activeMapId, loading, runtimeId])

  const toggleEndpoint = (endpointId: string) => {
    setSelectedIds((current) => current.includes(endpointId)
      ? current.filter((id) => id !== endpointId)
      : [...current, endpointId])
  }

  const moveSelected = (index: number, direction: -1 | 1) => {
    setSelectedIds((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!workflow || !selectedRuntime || !activeMapId || !map) {
      setError('Choose a connected runtime with an active map.')
      return
    }
    if (!selectedIds.length) {
      setError('Select at least one active waypoint for the patrol route.')
      return
    }
    setSubmitting(true)
    try {
      const latestRuntimes = await getRobotRuntimes()
      const latestRuntime = latestRuntimes.find((item) => item.id === runtimeId)
      const latestMapId = latestRuntime?.telemetry?.activeMapId
      if (!latestRuntime?.connected || latestRuntime.stale || latestMapId !== activeMapId) {
        throw new Error('Runtime is offline, telemetry is stale, or its active map changed. Refresh the page and try again.')
      }
      const mission = await createMission({
        workflowId: workflow.id,
        priority: 'NORMAL',
        runtimeId: runtimeId as 'sim' | 'real',
        name,
        description,
        initialContext: {
          map_id: activeMapId,
          floor_id: map.floorId,
          scope_type: 'ENDPOINTS',
          target_endpoints: selectedIds,
        },
      })
      navigate(`/tasks/${mission.id}`)
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create the patrol mission.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#596174] hover:text-primary">
            <ArrowLeft className="h-4 w-4" />Back to task types
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10"><MapPinned className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold text-[#17181c]">Create Library Patrol</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Select active-map waypoints in patrol order. The route starts from the robot's current pose.</p>
            </div>
          </div>
        </header>

        {loading ? <div className="border border-[#d9dce5] bg-white p-6 text-sm text-[#687386]">Loading active workflow and runtimes…</div> : (
          <form onSubmit={submit} className="space-y-5">
            <section className="grid gap-4 border border-[#d9dce5] bg-white p-5 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                Robot runtime
                <select required value={runtimeId} onChange={(event) => setRuntimeId(event.target.value)} className={fieldClass}>
                  <option value="">Choose runtime</option>
                  {runtimes.map((runtime) => <option key={runtime.id} value={runtime.id}>{runtime.displayName} · {runtime.id.toUpperCase()}</option>)}
                </select>
                <span className="block text-xs font-normal text-[#687386]">REAL missions require Arm and a valid lease before Start.</span>
              </label>
              <div className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                Active map
                <div className="flex h-10 items-center border border-[#e1e4eb] bg-[#f8f9fb] px-3 text-sm text-[#596174]">
                  {map ? `${map.name}${map.floorId ? ` · Floor ${map.floorId}` : ''}` : 'No active map'}
                </div>
                <span className="block truncate text-xs font-normal text-[#89909d]">{activeMapId ?? 'The runtime must report its active map.'}</span>
              </div>
              <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                Patrol mission name
                <input required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                Description
                <textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-20 w-full border border-[#d7d9e2] bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-[#3f4654]">Active waypoints on the runtime map</p>
                <p className="mt-1 text-xs text-[#687386]">Each click adds that waypoint to the route. Use the arrows to adjust the order.</p>
                {selectableEndpoints.length ? (
                  <div className="mt-3 divide-y divide-[#e9ebef] border border-[#d9dce5]">
                    {selectableEndpoints.map((endpoint) => (
                      <label key={endpoint.id} className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-[#f8f9fb]">
                        <input type="checkbox" checked={selectedIds.includes(endpoint.id)} onChange={() => toggleEndpoint(endpoint.id)} className="h-4 w-4 accent-primary" />
                        <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#252933]">{endpoint.name}</span><span className="text-[11px] text-[#89909d]">{endpoint.id} · ({endpoint.positionX.toFixed(2)}, {endpoint.positionY.toFixed(2)})</span></span>
                        {selectedIds.includes(endpoint.id) && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{selectedIds.indexOf(endpoint.id) + 1}</span>}
                      </label>
                    ))}
                  </div>
                ) : <p className="mt-3 border border-dashed border-[#cfd3dd] bg-[#fbfbfc] px-4 py-6 text-center text-sm text-[#687386]">No active waypoint endpoints found on this map.</p>}
              </div>
              {selectedEndpoints.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-[#3f4654]">Patrol order ({selectedEndpoints.length})</p>
                  <ol className="mt-2 space-y-2">
                    {selectedEndpoints.map((endpoint, index) => (
                      <li key={endpoint.id} className="flex items-center gap-3 border border-[#e0e3ea] bg-[#fbfcfe] px-3 py-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#252933]">{endpoint.name}</span>
                        <button type="button" onClick={() => moveSelected(index, -1)} disabled={index === 0} aria-label={`Move ${endpoint.name} earlier`} className="rounded p-1 text-[#596174] hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                        <button type="button" onClick={() => moveSelected(index, 1)} disabled={index === selectedEndpoints.length - 1} aria-label={`Move ${endpoint.name} later`} className="rounded p-1 text-[#596174] hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {workflow && <p className="sm:col-span-2 text-xs text-[#687386]">Workflow: <span className="font-medium text-[#3f4654]">{workflow.name}</span> · {workflow.id}</p>}
            </section>

            {(workflowError || error) && <div role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{workflowError || error}</div>}
            <div className="flex flex-wrap justify-between gap-3">
              <Link to="/tasks" className="inline-flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#596174] hover:bg-[#f8f9fb]">Cancel</Link>
              <button type="submit" disabled={submitting || loading || !!workflowError || !workflow || !map || selectedRuntime?.connected !== true || selectedRuntime.stale} className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? 'Creating…' : <><Check className="h-4 w-4" />Create mission</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LibraryPatrolMissionCreate
