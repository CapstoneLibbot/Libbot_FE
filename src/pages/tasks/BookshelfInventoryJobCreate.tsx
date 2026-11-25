import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, QrCode } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { apiErrorMessage, createJob, getDispatchWorkflows } from '@/features/dispatch/api'
import type { DispatchWorkflow } from '@/features/dispatch/types'
import { apiClient, getRobotRuntimes, getSavedMapEndpoints, type SavedMapEndpoint } from '@/features/maps/api/runtimeApi'
import type { RobotRuntime } from '@/features/maps/types/runtime'
import { shelfApi, type InventoryShelfRecord } from '@/lib/shelfApi'

type MapDetails = { id: string; name: string; floorId: string | null; status: string }

const fieldClass = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#252933] outline-none focus:border-primary'

function BookshelfInventoryJobCreate({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<DispatchWorkflow | null>(null)
  const [runtimes, setRuntimes] = useState<RobotRuntime[]>([])
  const [runtimeId, setRuntimeId] = useState('')
  const [map, setMap] = useState<MapDetails | null>(null)
  const [shelves, setShelves] = useState<InventoryShelfRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [name, setName] = useState('Bookshelf Inventory')
  const [description, setDescription] = useState('Scan QR codes on both levels of each selected shelf.')
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
        const inventoryWorkflows = allWorkflows.filter((item) => item.isActive && item.type.toUpperCase() === 'BOOKSHELF_INVENTORY')
        if (inventoryWorkflows.length > 1) {
          setWorkflowError('Configuration error: more than one active BOOKSHELF_INVENTORY workflow exists. Keep only one active workflow.')
          return
        }
        const inventoryWorkflow = inventoryWorkflows[0]
          ?? (await apiClient.post<DispatchWorkflow>('/workflows/templates/bookshelf-inventory/create', {})).data
        setWorkflow(inventoryWorkflow)
        const preferred = allRuntimes.find((runtime) => runtime.kind === 'SIM' && runtime.connected && runtime.telemetry?.activeMapId)
          ?? allRuntimes.find((runtime) => runtime.connected && runtime.telemetry?.activeMapId)
          ?? allRuntimes[0]
        if (preferred) setRuntimeId(preferred.id)
      } catch (cause) {
        if (active) setError(apiErrorMessage(cause, 'Unable to load the inventory workflow and robot runtimes.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const selectedRuntime = runtimes.find((runtime) => runtime.id === runtimeId) ?? null
  const activeMapId = selectedRuntime?.telemetry?.activeMapId ?? null

  useEffect(() => {
    let active = true
    setMap(null)
    setShelves([])
    setSelectedIds([])
    if (!activeMapId) {
      if (!loading && runtimeId) setError('The selected runtime has no active map. Activate a map and wait for fresh telemetry before creating inventory.')
      return () => { active = false }
    }

    const loadMapAndShelves = async () => {
      try {
        const [mapResponse, allShelves, mapEndpoints, allShelfLevels] = await Promise.all([
          apiClient.get<MapDetails>(`/maps/${encodeURIComponent(activeMapId)}`),
          shelfApi.listInventoryShelves(),
          getSavedMapEndpoints(activeMapId),
          shelfApi.listInventoryShelfLevels(),
        ])
        if (!active) return
        const mapDetails = mapResponse.data
        const mapEndpointIds = new Set(mapEndpoints.filter((endpoint: SavedMapEndpoint) => endpoint.isActive).map((endpoint) => endpoint.id))
        const allAisles = await shelfApi.listInventoryAisles(mapDetails.floorId)
        const floorAisleIds = new Set(allAisles
          .filter((aisle) => aisle.status.toLowerCase() === 'active')
          .map((aisle) => aisle.id))
        const activeLevelsByShelf = allShelfLevels
          .filter((level) => level.status.toLowerCase() === 'active')
          .reduce((byShelf, level) => {
            const levels = byShelf.get(level.shelfId) ?? []
            levels.push(level.levelNumber)
            byShelf.set(level.shelfId, levels)
            return byShelf
          }, new Map<string, number[]>())
        const readyShelfIds = new Set(Array.from(activeLevelsByShelf.entries())
          .filter(([, levels]) => levels.length === 2 && levels.includes(1) && levels.includes(2))
          .map(([shelfId]) => shelfId))
        setMap(mapDetails)
        setShelves(allShelves.filter((shelf) => floorAisleIds.has(shelf.aisleId)
          && shelf.status.toLowerCase() === 'active'
          && readyShelfIds.has(shelf.id)
          && mapEndpointIds.has(shelf.startEndpointId)
          && mapEndpointIds.has(shelf.endEndpointId)))
        setError('')
      } catch (cause) {
        if (active) setError(apiErrorMessage(cause, 'Unable to load shelves on the active map.'))
      }
    }
    void loadMapAndShelves()
    return () => { active = false }
  }, [activeMapId, loading, runtimeId])

  const orderedShelves = useMemo(() => [...shelves].sort((left, right) => left.name.localeCompare(right.name)), [shelves])
  const selectedShelves = selectedIds
    .map((id) => orderedShelves.find((shelf) => shelf.id === id))
    .filter((shelf): shelf is InventoryShelfRecord => shelf !== undefined)

  const toggleShelf = (shelfId: string) => {
    setSelectedIds((current) => current.includes(shelfId)
      ? current.filter((id) => id !== shelfId)
      : [...current, shelfId])
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!workflow || !selectedRuntime || !activeMapId || !map?.floorId) {
      setError('Choose a connected runtime with an active map assigned to a floor.')
      return
    }
    if (!selectedIds.length) {
      setError('Select at least one shelf to inventory.')
      return
    }

    setSubmitting(true)
    try {
      const latestRuntimes = await getRobotRuntimes()
      const latestRuntime = latestRuntimes.find((item) => item.id === runtimeId)
      if (!latestRuntime?.connected || latestRuntime.stale || latestRuntime.telemetry?.activeMapId !== activeMapId) {
        throw new Error('Runtime is offline, telemetry is stale, or its active map changed. Refresh the page and try again.')
      }
      const job = await createJob({
        workflowId: workflow.id,
        priority: 'NORMAL',
        runtimeId: runtimeId as 'sim' | 'real',
        name,
        description,
        initialContext: {
          map_id: activeMapId,
          floor_id: map.floorId,
          scope_type: 'SHELVES',
          target_shelves: selectedIds,
        },
      })
      navigate(`/tasks/${job.id}`)
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create the inventory job.'))
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
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10"><QrCode className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold text-[#17181c]">Create Bookshelf Inventory</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Single-endpoint shelves are scanned in place; two-endpoint shelves are swept horizontally.</p>
            </div>
          </div>
        </header>

        {loading ? <div className="border border-[#d9dce5] bg-white p-6 text-sm text-[#687386]">Loading workflow, runtime and map…</div> : (
          <form onSubmit={submit} className="space-y-5">
            <section className="grid gap-4 border border-[#d9dce5] bg-white p-5 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                Robot runtime
                <select required value={runtimeId} onChange={(event) => setRuntimeId(event.target.value)} className={fieldClass}>
                  <option value="">Choose runtime</option>
                  {runtimes.map((runtime) => <option key={runtime.id} value={runtime.id}>{runtime.displayName} · {runtime.id.toUpperCase()}</option>)}
                </select>
              </label>
              <div className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                Active map
                <div className="flex h-10 items-center border border-[#e1e4eb] bg-[#f8f9fb] px-3 text-sm text-[#596174]">
                  {map ? `${map.name}${map.floorId ? ` · Floor ${map.floorId}` : ''}` : 'No active map'}
                </div>
              </div>
              <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                Job name
                <input required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                Description
                <textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-20 w-full border border-[#d7d9e2] bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-[#3f4654]">Shelves on the active map</p>
                <p className="mt-1 text-xs text-[#687386]">Each selected shelf must have an endpoint and exactly levels 1 and 2 configured.</p>
                {orderedShelves.length ? (
                  <div className="mt-3 divide-y divide-[#e9ebef] border border-[#d9dce5]">
                    {orderedShelves.map((shelf) => (
                      <label key={shelf.id} className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-[#f8f9fb]">
                        <input type="checkbox" checked={selectedIds.includes(shelf.id)} onChange={() => toggleShelf(shelf.id)} className="h-4 w-4 accent-primary" />
                        <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#252933]">{shelf.name}</span><span className="text-[11px] text-[#89909d]">{shelf.id}</span></span>
                        {selectedIds.includes(shelf.id) && <Check className="h-4 w-4 text-primary" />}
                      </label>
                    ))}
                  </div>
                ) : <p className="mt-3 border border-dashed border-[#cfd3dd] bg-[#fbfbfc] px-4 py-6 text-center text-sm text-[#687386]">No active shelf with active endpoints and active levels 1 and 2 was found on this map.</p>}
              </div>
              {selectedShelves.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-[#3f4654]">Inventory order ({selectedShelves.length})</p>
                  <ol className="mt-2 divide-y divide-[#e9ebef] border border-[#d9dce5]">
                    {selectedShelves.map((shelf, index) => <li key={shelf.id} className="flex gap-3 px-3 py-2.5 text-sm"><span className="font-semibold text-primary">{index + 1}.</span><span>{shelf.name}</span></li>)}
                  </ol>
                </div>
              )}
              {workflow && <p className="sm:col-span-2 text-xs text-[#687386]">Workflow: <span className="font-medium text-[#3f4654]">{workflow.name}</span> · {workflow.id}</p>}
            </section>

            {(workflowError || error) && <div role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{workflowError || error}</div>}
            <div className="flex flex-wrap justify-between gap-3">
              <Link to="/tasks" className="inline-flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#596174] hover:bg-[#f8f9fb]">Cancel</Link>
              <button type="submit" disabled={submitting || loading || !!workflowError || !workflow || !map?.floorId || selectedRuntime?.connected !== true || selectedRuntime.stale || selectedIds.length === 0} className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? 'Creating…' : <><Check className="h-4 w-4" />Create job</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default BookshelfInventoryJobCreate
