import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Map as MapIcon, MapPin, Pencil, Plus, RefreshCw, SquareDashed, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import LiveOccupancyMap, { type OccupancyZoneBounds } from '../../features/maps/components/LiveOccupancyMap'
import {
  createSavedMapEndpoint,
  createSavedMapZone,
  deleteSavedMapEndpoint,
  deleteSavedMapZone,
  getSavedMapEndpointGroupMembers,
  getSavedMapEndpointGroups,
  getSavedMapEndpoints,
  getSavedMapZones,
  getSavedRobotMapDetails,
  updateSavedMapEndpoint,
  updateSavedMapZone,
  type SavedMapEndpoint,
  type SavedMapEndpointGroup,
  type SavedMapEndpointGroupMember,
  type SavedMapZone,
  type SavedRobotMapDetails,
} from '../../features/maps/api/runtimeApi'

type MapTab = 'detail' | 'endpoint' | 'zone'

function RobotMapDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [savedMap, setSavedMap] = useState<SavedRobotMapDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MapTab>('detail')
  const [endpoints, setEndpoints] = useState<SavedMapEndpoint[]>([])
  const [zones, setZones] = useState<SavedMapZone[]>([])
  const [endpointGroups, setEndpointGroups] = useState<SavedMapEndpointGroup[]>([])
  const [endpointGroupMembers, setEndpointGroupMembers] = useState<SavedMapEndpointGroupMember[]>([])
  const [endpointsLoading, setEndpointsLoading] = useState(true)
  const [zonesLoading, setZonesLoading] = useState(true)
  const [endpointsError, setEndpointsError] = useState<string | null>(null)
  const [zonesError, setZonesError] = useState<string | null>(null)
  const [endpointGroupFilterId, setEndpointGroupFilterId] = useState('')
  const [zoneTypeFilter, setZoneTypeFilter] = useState('')
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [endpointPlacementMode, setEndpointPlacementMode] = useState(false)
  const [endpointDraft, setEndpointDraft] = useState<{ positionX: number; positionY: number } | null>(null)
  const [endpointEditTarget, setEndpointEditTarget] = useState<SavedMapEndpoint | null>(null)
  const [drawZoneMode, setDrawZoneMode] = useState(false)
  const [zoneDraft, setZoneDraft] = useState<OccupancyZoneBounds | null>(null)
  const [zoneEditTarget, setZoneEditTarget] = useState<SavedMapZone | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [savingResource, setSavingResource] = useState(false)

  const loadMap = useCallback(async () => {
    if (!id) {
      setError('Map ID is missing.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setSavedMap(await getSavedRobotMapDetails(id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this robot map.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadMap()
  }, [loadMap])

  const refreshMapResources = useCallback(async () => {
    if (!id) return
    setEndpointsLoading(true)
    setZonesLoading(true)
    setEndpointsError(null)
    setZonesError(null)

    const [endpointResult, zoneResult, groupResult, memberResult] = await Promise.allSettled([
      getSavedMapEndpoints(id),
      getSavedMapZones(id),
      getSavedMapEndpointGroups(),
      getSavedMapEndpointGroupMembers(),
    ])

    if (endpointResult.status === 'fulfilled') setEndpoints(endpointResult.value)
    else setEndpointsError(endpointResult.reason instanceof Error ? endpointResult.reason.message : 'Could not load endpoints.')
    if (zoneResult.status === 'fulfilled') setZones(zoneResult.value)
    else setZonesError(zoneResult.reason instanceof Error ? zoneResult.reason.message : 'Could not load zones.')
    if (groupResult.status === 'fulfilled') setEndpointGroups(groupResult.value)
    if (memberResult.status === 'fulfilled') setEndpointGroupMembers(memberResult.value)
    setEndpointsLoading(false)
    setZonesLoading(false)
  }, [id])

  useEffect(() => {
    void refreshMapResources()
  }, [refreshMapResources])

  const handleCreateEndpoint = async (input: { name: string; endpointType: 'WAYPOINT' | 'CHARGER' | 'PARK'; positionX: number; positionY: number; theta: number }) => {
    if (!id || !endpointDraft) return
    setSavingResource(true)
    setActionError(null)
    try {
      await createSavedMapEndpoint({ mapId: id, ...input })
      setEndpointDraft(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not create endpoint.')
    } finally {
      setSavingResource(false)
    }
  }

  const handleUpdateEndpoint = async (endpoint: SavedMapEndpoint, input: EndpointCreateInput) => {
    if (!id) return
    setSavingResource(true)
    setActionError(null)
    try {
      await updateSavedMapEndpoint(endpoint.id, { mapId: id, ...input, isActive: endpoint.isActive })
      setEndpointEditTarget(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not update endpoint.')
    } finally {
      setSavingResource(false)
    }
  }

  const handleDeleteEndpoint = async (endpoint: SavedMapEndpoint) => {
    if (!window.confirm(`Remove endpoint "${endpoint.name}"?`)) return
    setSavingResource(true)
    setActionError(null)
    try {
      await deleteSavedMapEndpoint(endpoint.id)
      if (selectedEndpointId === endpoint.id) setSelectedEndpointId(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not remove endpoint.')
    } finally {
      setSavingResource(false)
    }
  }

  const handleCreateZone = async (input: {
    zoneType: 'KEEP_OUT' | 'SPEED_LIMIT' | 'NO_STOP'
    maxSpeed: number
    minX: number
    minY: number
    maxX: number
    maxY: number
  }) => {
    if (!id || !zoneDraft) return
    setSavingResource(true)
    setActionError(null)
    try {
      await createSavedMapZone({ mapId: id, ...input })
      setZoneDraft(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not create zone.')
    } finally {
      setSavingResource(false)
    }
  }

  const handleUpdateZone = async (zone: SavedMapZone, input: ZoneWriteInput) => {
    if (!id) return
    setSavingResource(true)
    setActionError(null)
    try {
      await updateSavedMapZone(zone.id, { mapId: id, ...input, isActive: zone.isActive })
      setZoneEditTarget(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not update zone.')
    } finally {
      setSavingResource(false)
    }
  }

  const handleDeleteZone = async (zone: SavedMapZone) => {
    if (!window.confirm(`Remove zone ${zone.zoneType.replaceAll('_', ' ')}?`)) return
    setSavingResource(true)
    setActionError(null)
    try {
      await deleteSavedMapZone(zone.id)
      if (selectedZoneId === zone.id) setSelectedZoneId(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not remove zone.')
    } finally {
      setSavingResource(false)
    }
  }

  const map = savedMap?.map
  const grid = savedMap?.grid
  const filteredEndpoints = endpoints.filter((endpoint) =>
    !endpointGroupFilterId || endpointGroupMembers.some((member) =>
      member.endpointId.toLowerCase() === endpoint.id.toLowerCase() &&
      member.endpointGroupId.toLowerCase() === endpointGroupFilterId.toLowerCase()),
  )
  const filteredZones = zones.filter((zone) => !zoneTypeFilter || zone.zoneType === zoneTypeFilter)

  const endpointGroupsFor = (endpointId: string) => endpointGroupMembers
    .filter((member) => member.endpointId.toLowerCase() === endpointId.toLowerCase())
    .map((member) => endpointGroups.find((group) => group.id.toLowerCase() === member.endpointGroupId.toLowerCase()))
    .filter((group): group is SavedMapEndpointGroup => Boolean(group))

  return (
    <div className="flex min-h-full flex-col bg-[#101014]">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#292930] bg-[#141419] px-4 py-3 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/maps')}
            aria-label="Back to maps"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#c4c5cc] transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15">
            <MapIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{map?.name ?? 'Robot map'}</h1>
            <p className="truncate text-xs text-[#9a9ba5]">
              {map ? `Map ${map.id} · Version ${map.version}` : 'Occupancy grid detail'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {map && (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadMap()}
            disabled={loading}
            className="flex h-9 items-center gap-2 rounded-md border border-[#35353e] px-3 text-sm text-[#dedee3] transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-row">
        <section className="flex min-h-[520px] min-w-0 flex-1 flex-col bg-[#0d0d11]">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#292930] px-4">
            <span className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-white">
              2D map
            </span>
            <span className="text-xs text-[#92939c]">Occupancy grid</span>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-5">
            {loading ? (
              <div className="text-sm text-[#a4a5ad]">Loading map data...</div>
            ) : error ? (
              <div className="max-w-md text-center">
                <p className="font-medium text-rose-400">Could not load map</p>
                <p className="mt-1 text-sm text-[#a4a5ad]">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadMap()}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Try again
                </button>
              </div>
            ) : grid ? (
              <div className="w-full">
                <LiveOccupancyMap
                  grid={grid}
                  endpoints={filteredEndpoints}
                  zones={filteredZones}
                  showEndpoints={activeTab === 'endpoint'}
                  showZones={activeTab === 'zone'}
                  drawZoneMode={drawZoneMode && activeTab === 'zone'}
                  endpointPlacementMode={endpointPlacementMode && activeTab === 'endpoint'}
                  onEndpointPlace={(position) => {
                    setEndpointDraft(position)
                    setEndpointPlacementMode(false)
                    setActionError(null)
                  }}
                  onZoneDraw={(bounds) => {
                    setZoneDraft(bounds)
                    setDrawZoneMode(false)
                    setActionError(null)
                  }}
                  selectedEndpointId={selectedEndpointId}
                  selectedZoneId={selectedZoneId}
                  onEndpointSelect={setSelectedEndpointId}
                  onZoneSelect={setSelectedZoneId}
                />
              </div>
            ) : null}
          </div>
        </section>

        <aside className="flex max-h-[calc(100vh-4rem)] min-h-[420px] w-[320px] shrink-0 flex-col border-l border-[#dedee3] bg-white sm:w-[340px] xl:w-[360px]">
          <div className="flex h-12 shrink-0 border-b border-[#e2e3e8] px-2">
            <TabButton active={activeTab === 'detail'} onClick={() => { setActiveTab('detail'); setDrawZoneMode(false); setEndpointPlacementMode(false) }}>Detail</TabButton>
            <TabButton active={activeTab === 'endpoint'} onClick={() => { setActiveTab('endpoint'); setDrawZoneMode(false) }}>Endpoint</TabButton>
            <TabButton active={activeTab === 'zone'} onClick={() => { setActiveTab('zone'); setDrawZoneMode(false); setEndpointPlacementMode(false) }}>Zone</TabButton>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === 'detail' && map && grid && (
              <div className="px-4 py-4 sm:px-5">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#747b88]">Map</p>
                <h2 className="break-words text-sm font-semibold text-[#20232a]">{map.name}</h2>
                <div className="mt-4 divide-y divide-[#e5e6ea] border-t border-[#e5e6ea]">
                  <DetailField label="ID" value={map.id} mono />
                  <DetailField label="Name" value={map.name} />
                  <DetailField label="Version" value={`v${map.version}`} />
                  <DetailField label="Width" value={`${map.width} px`} />
                  <DetailField label="Height" value={`${map.height} px`} />
                  <DetailField label="Resolution" value={`${grid.resolution.toFixed(3)} m/px`} />
                  <DetailField label="Origin" value={`${grid.originX.toFixed(3)}, ${grid.originY.toFixed(3)}`} />
                  <DetailField label="Origin yaw" value={`${grid.originYaw.toFixed(3)} rad`} />
                  <DetailField label="Updated" value={new Date(grid.timestamp).toLocaleString()} />
                </div>
              </div>
            )}

            {activeTab === 'endpoint' && (
              <div>
                {actionError && <p className="m-3 rounded-md bg-rose-50 p-2.5 text-sm text-rose-700">{actionError}</p>}
                <div className="flex items-center justify-between border-b border-[#e2e3e8] p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#747b88]">Endpoints</p>
                    <p className="mt-1 text-xs text-[#747b88]">{endpoints.length} endpoints</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null)
                      setEndpointDraft(null)
                      setEndpointPlacementMode(true)
                    }}
                    disabled={endpointPlacementMode}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" /> {endpointPlacementMode ? 'Click map' : 'Create'}
                  </button>
                </div>
                <label className="block border-b border-[#e2e3e8] px-4 py-3 text-xs text-[#596174]">
                  Filter by endpoint group
                  <select
                    value={endpointGroupFilterId}
                    onChange={(event) => setEndpointGroupFilterId(event.target.value)}
                    className="mt-1.5 h-9 w-full rounded-md border border-[#dfe1e7] bg-white px-3 text-sm text-[#303640] outline-none focus:border-primary"
                  >
                    <option value="">All groups</option>
                    {endpointGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                </label>
                {endpointsLoading ? (
                  <p className="py-8 text-center text-sm text-[#747b88]">Loading endpoints...</p>
                ) : endpointsError ? (
                  <p className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{endpointsError}</p>
                ) : filteredEndpoints.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[#747b88]">
                    {endpoints.length === 0 ? 'No endpoints are assigned to this map.' : 'No endpoints in this group.'}
                  </p>
                ) : (
                  <div className="divide-y divide-[#e2e3e8]">
                    {filteredEndpoints.map((endpoint) => {
                      const groups = endpointGroupsFor(endpoint.id)
                      return (
                        <div
                          key={endpoint.id}
                          className={`flex items-center gap-2 px-3 py-2 ${selectedEndpointId === endpoint.id ? 'bg-[#eeeef5]' : 'bg-[#f7f7fa]'}`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedEndpointId(endpoint.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left transition hover:bg-[#f2f2f6]"
                          >
                            <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#424650]">{endpoint.name}</p>
                              <p className="truncate text-xs text-[#69717e]">{endpoint.endpointType} · X {endpoint.positionX.toFixed(2)}, Y {endpoint.positionY.toFixed(2)}</p>
                              <p className="mt-1 truncate text-[11px] text-[#747b88]">
                                {groups.length > 0 ? groups.map((group) => group.name).join(', ') : 'Ungrouped endpoint'}
                              </p>
                            </div>
                            <StatusBadge active={endpoint.isActive} />
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              title="Edit endpoint"
                              aria-label={`Edit endpoint ${endpoint.name}`}
                              onClick={() => { setActionError(null); setEndpointEditTarget(endpoint) }}
                              disabled={savingResource}
                              className="rounded p-2 text-[#69717e] hover:bg-white hover:text-primary disabled:opacity-40"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Remove endpoint"
                              aria-label={`Remove endpoint ${endpoint.name}`}
                              onClick={() => void handleDeleteEndpoint(endpoint)}
                              disabled={savingResource}
                              className="rounded p-2 text-[#69717e] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'zone' && (
              <div>
                {actionError && <p className="m-3 rounded-md bg-rose-50 p-2.5 text-sm text-rose-700">{actionError}</p>}
                <div className="flex items-center justify-between gap-3 border-b border-[#e2e3e8] p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#747b88]">Zones</p>
                    <p className="mt-1 text-xs text-[#747b88]">{zones.length} zones</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null)
                      if (drawZoneMode) setDrawZoneMode(false)
                      else { setZoneDraft(null); setDrawZoneMode(true) }
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${drawZoneMode ? 'bg-primary text-primary-foreground' : 'bg-[#f1f2f5] text-[#515866] hover:bg-[#e7e8ed]'}`}
                  >
                    <SquareDashed className="h-4 w-4" /> {drawZoneMode ? 'Drawing...' : 'Draw Zone'}
                  </button>
                </div>
                <label className="block border-b border-[#e2e3e8] px-4 py-3 text-xs text-[#596174]">
                  Filter by zone type
                  <select
                    value={zoneTypeFilter}
                    onChange={(event) => setZoneTypeFilter(event.target.value)}
                    className="mt-1.5 h-9 w-full rounded-md border border-[#dfe1e7] bg-white px-3 text-sm text-[#303640] outline-none focus:border-primary"
                  >
                    <option value="">All types</option>
                    {zoneTypes.map((type) => <option key={type} value={type}>{zoneDisplayName(type)}</option>)}
                  </select>
                </label>
                {zonesLoading ? (
                  <p className="py-8 text-center text-sm text-[#747b88]">Loading zones...</p>
                ) : zonesError ? (
                  <p className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{zonesError}</p>
                ) : filteredZones.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[#747b88]">
                    {zones.length === 0 ? 'No zones are assigned to this map.' : 'No zones match this type.'}
                  </p>
                ) : (
                  <div className="divide-y divide-[#e2e3e8]">
                    {filteredZones.map((zone) => {
                      const index = zones.indexOf(zone) + 1
                      return (
                        <div
                          key={zone.id}
                          className={`flex items-center gap-2 px-3 py-2 ${selectedZoneId === zone.id ? 'bg-[#eeeef5]' : 'bg-[#f7f7fa]'}`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedZoneId(zone.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left transition hover:bg-[#f2f2f6]"
                          >
                            <SquareDashed className="h-4 w-4 shrink-0 text-[#747b88]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#424650]">Z-{String(index).padStart(3, '0')}</p>
                              <p className="truncate text-xs text-[#69717e]">
                                {zone.zoneType === 'SPEED_LIMIT' ? `${zoneDisplayName(zone.zoneType)} · ${zone.maxSpeed.toFixed(2)} m/s` : zoneDisplayName(zone.zoneType)}
                              </p>
                            </div>
                            <span className="text-right text-[10px] text-[#69717e]">{zone.zoneType.replace('_', ' ')}</span>
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              title="Edit zone"
                              aria-label={`Edit zone ${zone.zoneType}`}
                              onClick={() => { setActionError(null); setZoneEditTarget(zone) }}
                              disabled={savingResource}
                              className="rounded p-2 text-[#69717e] hover:bg-white hover:text-primary disabled:opacity-40"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Remove zone"
                              aria-label={`Remove zone ${zone.zoneType}`}
                              onClick={() => void handleDeleteZone(zone)}
                              disabled={savingResource}
                              className="rounded p-2 text-[#69717e] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {endpointDraft && (
        <CreateEndpointDialog
          position={endpointDraft}
          onClose={() => setEndpointDraft(null)}
          onSubmit={handleCreateEndpoint}
          saving={savingResource}
          error={actionError}
        />
      )}
      {endpointEditTarget && (
        <CreateEndpointDialog
          endpoint={endpointEditTarget}
          onClose={() => setEndpointEditTarget(null)}
          onSubmit={(input) => void handleUpdateEndpoint(endpointEditTarget, input)}
          saving={savingResource}
          error={actionError}
        />
      )}
      {zoneDraft && (
        <CreateZoneDialog
          bounds={zoneDraft}
          onClose={() => setZoneDraft(null)}
          onSubmit={handleCreateZone}
          saving={savingResource}
          error={actionError}
        />
      )}
      {zoneEditTarget && (
        <CreateZoneDialog
          bounds={zoneEditTarget}
          zone={zoneEditTarget}
          onClose={() => setZoneEditTarget(null)}
          onSubmit={(input) => void handleUpdateZone(zoneEditTarget, input)}
          saving={savingResource}
          error={actionError}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative px-3 text-sm transition ${active ? 'font-medium text-[#20232a]' : 'text-[#747b88] hover:text-[#20232a]'}`}
    >
      {children}
      {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />}
    </button>
  )
}

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#747b88]">{label}</p>
      <p className={`mt-1 break-words text-sm text-[#414856] ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

const zoneTypes = ['KEEP_OUT', 'SPEED_LIMIT', 'NO_STOP'] as const

function zoneDisplayName(zoneType: string) {
  switch (zoneType) {
    case 'KEEP_OUT': return 'Keep-out Zone'
    case 'SPEED_LIMIT': return 'Speed Zone'
    case 'NO_STOP': return 'No-stop Zone'
    default: return zoneType
  }
}

type EndpointCreateInput = { name: string; endpointType: 'WAYPOINT' | 'CHARGER' | 'PARK'; positionX: number; positionY: number; theta: number }
type ZoneCreateInput = {
  zoneType: 'KEEP_OUT' | 'SPEED_LIMIT' | 'NO_STOP'
  maxSpeed: number
  minX: number
  minY: number
  maxX: number
  maxY: number
}
type ZoneWriteInput = ZoneCreateInput

function DialogFrame({
  title,
  error,
  saving,
  onClose,
  onSubmit,
  children,
}: {
  title: string
  error: string | null
  saving: boolean
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose()
    }}>
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#20232a]">{title}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="text-sm text-[#747b88] hover:text-[#20232a]">Close</button>
        </div>
        <div className="space-y-3">{children}</div>
        {error && <p className="mt-3 rounded-md bg-rose-50 p-2.5 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-[#dfe1e7] px-3 py-2 text-sm text-[#515866] disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-[#596174]">
      {label}
      {children}
    </label>
  )
}

const inputClass = 'mt-1.5 h-10 w-full rounded-md border border-[#dfe1e7] bg-white px-3 text-sm text-[#303640] outline-none focus:border-primary'

function CreateEndpointDialog({
  position,
  endpoint,
  onClose,
  onSubmit,
  saving,
  error,
}: {
  position?: { positionX: number; positionY: number }
  endpoint?: SavedMapEndpoint
  onClose: () => void
  onSubmit: (input: EndpointCreateInput) => void
  saving: boolean
  error: string | null
}) {
  return (
    <DialogFrame
      title={endpoint ? 'Edit endpoint' : 'Create endpoint'}
      error={error}
      saving={saving}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        onSubmit({
          name: String(data.get('name') ?? '').trim(),
          endpointType: String(data.get('endpointType')) as EndpointCreateInput['endpointType'],
          positionX: Number(data.get('positionX')),
          positionY: Number(data.get('positionY')),
          theta: Number(data.get('theta')),
        })
      }}
    >
      <FormField label="Name"><input name="name" required autoFocus className={inputClass} placeholder="EP-101" defaultValue={endpoint?.name ?? ''} /></FormField>
      <FormField label="Endpoint type">
        <select name="endpointType" className={inputClass} defaultValue={endpoint?.endpointType ?? 'WAYPOINT'}>
          <option value="WAYPOINT">Waypoint</option>
          <option value="CHARGER">Charger</option>
          <option value="PARK">Park</option>
        </select>
      </FormField>
      <div className="grid grid-cols-3 gap-2">
        <FormField label="Position X"><input name="positionX" type="number" step="any" required className={inputClass} defaultValue={(endpoint?.positionX ?? position?.positionX ?? 0).toFixed(3)} /></FormField>
        <FormField label="Position Y"><input name="positionY" type="number" step="any" required className={inputClass} defaultValue={(endpoint?.positionY ?? position?.positionY ?? 0).toFixed(3)} /></FormField>
        <FormField label="Theta"><input name="theta" type="number" step="any" required className={inputClass} defaultValue={String(endpoint?.theta ?? 0)} /></FormField>
      </div>
    </DialogFrame>
  )
}

function CreateZoneDialog({
  bounds,
  zone,
  onClose,
  onSubmit,
  saving,
  error,
}: {
  bounds: OccupancyZoneBounds
  zone?: SavedMapZone
  onClose: () => void
  onSubmit: (input: ZoneWriteInput) => void
  saving: boolean
  error: string | null
}) {
  const [zoneType, setZoneType] = useState<ZoneCreateInput['zoneType']>(
    (zone?.zoneType as ZoneCreateInput['zoneType'] | undefined) ?? 'KEEP_OUT',
  )
  return (
    <DialogFrame
      title={zone ? 'Edit zone' : 'Create zone'}
      error={error}
      saving={saving}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        onSubmit({
          zoneType,
          maxSpeed: zoneType === 'SPEED_LIMIT' ? Number(data.get('maxSpeed')) : 0,
          minX: Number(data.get('minX')),
          minY: Number(data.get('minY')),
          maxX: Number(data.get('maxX')),
          maxY: Number(data.get('maxY')),
        })
      }}
    >
      <FormField label="Zone type">
        <select value={zoneType} onChange={(event) => setZoneType(event.target.value as ZoneCreateInput['zoneType'])} className={inputClass}>
          {zoneTypes.map((type) => <option key={type} value={type}>{zoneDisplayName(type)}</option>)}
        </select>
      </FormField>
      {zoneType === 'SPEED_LIMIT' && <FormField label="Maximum speed (m/s)"><input name="maxSpeed" type="number" min="0.01" step="any" required className={inputClass} defaultValue={String(zone?.maxSpeed || 0.5)} /></FormField>}
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Min X"><input name="minX" type="number" step="any" required className={inputClass} defaultValue={String(zone?.minX ?? bounds.minX)} /></FormField>
        <FormField label="Min Y"><input name="minY" type="number" step="any" required className={inputClass} defaultValue={String(zone?.minY ?? bounds.minY)} /></FormField>
        <FormField label="Max X"><input name="maxX" type="number" step="any" required className={inputClass} defaultValue={String(zone?.maxX ?? bounds.maxX)} /></FormField>
        <FormField label="Max Y"><input name="maxY" type="number" step="any" required className={inputClass} defaultValue={String(zone?.maxY ?? bounds.maxY)} /></FormField>
      </div>
    </DialogFrame>
  )
}

export default RobotMapDetail
