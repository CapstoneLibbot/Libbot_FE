import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Map as MapIcon, MapPin, Pencil, Plus, RefreshCw, SquareDashed, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import LiveOccupancyMap, {
  type OccupancyEndpointPlacement,
  type OccupancyZoneBounds,
} from '../../features/maps/components/LiveOccupancyMap'
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
  const [endpointDraft, setEndpointDraft] = useState<OccupancyEndpointPlacement | null>(null)
  const [endpointEditTarget, setEndpointEditTarget] = useState<SavedMapEndpoint | null>(null)
  const [drawZoneMode, setDrawZoneMode] = useState(false)
  const [zoneDraft, setZoneDraft] = useState<OccupancyZoneBounds | null>(null)
  const [zoneEditTarget, setZoneEditTarget] = useState<SavedMapZone | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [savingResource, setSavingResource] = useState(false)

  const loadMap = useCallback(async () => {
    if (!id) {
      setError('Thiếu mã bản đồ.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setSavedMap(await getSavedRobotMapDetails(id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tải bản đồ robot này.')
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
    else setEndpointsError(endpointResult.reason instanceof Error ? endpointResult.reason.message : 'Không thể tải điểm điều hướng.')
    if (zoneResult.status === 'fulfilled') setZones(zoneResult.value)
    else setZonesError(zoneResult.reason instanceof Error ? zoneResult.reason.message : 'Không thể tải khu vực.')
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
      setActionError(cause instanceof Error ? cause.message : 'Không thể tạo điểm điều hướng.')
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
      setActionError(cause instanceof Error ? cause.message : 'Không thể cập nhật điểm điều hướng.')
    } finally {
      setSavingResource(false)
    }
  }

  const handleDeleteEndpoint = async (endpoint: SavedMapEndpoint) => {
    if (!window.confirm(`Xóa điểm điều hướng "${endpoint.name}"?`)) return
    setSavingResource(true)
    setActionError(null)
    try {
      await deleteSavedMapEndpoint(endpoint.id)
      if (selectedEndpointId === endpoint.id) setSelectedEndpointId(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể xóa điểm điều hướng.')
    } finally {
      setSavingResource(false)
    }
  }

  const handleCreateZone = async (input: ZoneWriteInput) => {
    if (!id || !zoneDraft) return
    setSavingResource(true)
    setActionError(null)
    try {
      await createSavedMapZone({ mapId: id, ...input })
      setZoneDraft(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể tạo khu vực.')
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
      setActionError(cause instanceof Error ? cause.message : 'Không thể cập nhật khu vực.')
    } finally {
      setSavingResource(false)
    }
  }

  const handleDeleteZone = async (zone: SavedMapZone) => {
    if (!window.confirm(`Xóa khu vực ${zoneDisplayName(zone.zoneType)}?`)) return
    setSavingResource(true)
    setActionError(null)
    try {
      await deleteSavedMapZone(zone.id)
      if (selectedZoneId === zone.id) setSelectedZoneId(null)
      await refreshMapResources()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể xóa khu vực.')
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
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            title="Quay lại"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#c4c5cc] transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15">
            <MapIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{map?.name ?? 'Bản đồ robot'}</h1>
            <p className="truncate text-xs text-[#9a9ba5]">
              {map ? `Bản đồ ${map.id} · Phiên bản ${map.version}` : 'Chi tiết lưới chiếm dụng'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {map && (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Đã lưu
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadMap()}
            disabled={loading}
            className="flex h-9 items-center gap-2 rounded-md border border-[#35353e] px-3 text-sm text-[#dedee3] transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-row">
        <section className="flex min-h-[520px] min-w-0 flex-1 flex-col bg-[#0d0d11]">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#292930] px-4">
            <span className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-white">
              Bản đồ 2D
            </span>
            <span className="text-xs text-[#92939c]">Lưới chiếm dụng</span>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-5">
            {loading ? (
              <div className="text-sm text-[#a4a5ad]">Đang tải dữ liệu bản đồ...</div>
            ) : error ? (
              <div className="max-w-md text-center">
                <p className="font-medium text-rose-400">Không thể tải bản đồ</p>
                <p className="mt-1 text-sm text-[#a4a5ad]">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadMap()}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Thử lại
                </button>
              </div>
            ) : grid ? (
              <div className="w-full">
                <LiveOccupancyMap
                  grid={grid}
                  orientVertically
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
            <TabButton active={activeTab === 'detail'} onClick={() => { setActiveTab('detail'); setDrawZoneMode(false); setEndpointPlacementMode(false) }}>Chi tiết</TabButton>
            <TabButton active={activeTab === 'endpoint'} onClick={() => { setActiveTab('endpoint'); setDrawZoneMode(false) }}>Điểm điều hướng</TabButton>
            <TabButton active={activeTab === 'zone'} onClick={() => { setActiveTab('zone'); setDrawZoneMode(false); setEndpointPlacementMode(false) }}>Khu vực</TabButton>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === 'detail' && map && grid && (
              <div className="px-4 py-4 sm:px-5">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#747b88]">Bản đồ</p>
                <h2 className="break-words text-sm font-semibold text-[#20232a]">{map.name}</h2>
                <div className="mt-4 divide-y divide-[#e5e6ea] border-t border-[#e5e6ea]">
                  <DetailField label="ID" value={map.id} mono />
                  <DetailField label="Tên" value={map.name} />
                  <DetailField label="Phiên bản" value={`v${map.version}`} />
                  <DetailField label="Chiều rộng" value={`${map.width} px`} />
                  <DetailField label="Chiều cao" value={`${map.height} px`} />
                  <DetailField label="Độ phân giải" value={`${grid.resolution.toFixed(3)} m/px`} />
                  <DetailField label="Gốc tọa độ" value={`${grid.originX.toFixed(3)}, ${grid.originY.toFixed(3)}`} />
                  <DetailField label="Góc quay gốc" value={`${grid.originYaw.toFixed(3)} rad`} />
                  <DetailField label="Cập nhật lúc" value={new Date(grid.timestamp).toLocaleString('vi-VN')} />
                </div>
              </div>
            )}

            {activeTab === 'endpoint' && (
              <div>
                {actionError && <p className="m-3 rounded-md bg-rose-50 p-2.5 text-sm text-rose-700">{actionError}</p>}
                <div className="flex items-center justify-between border-b border-[#e2e3e8] p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#747b88]">Điểm điều hướng</p>
                    <p className="mt-1 text-xs text-[#747b88]">{endpoints.length} điểm điều hướng</p>
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
                    <Plus className="h-4 w-4" /> {endpointPlacementMode ? 'Kéo trên bản đồ' : 'Tạo mới'}
                  </button>
                </div>
                {endpointPlacementMode && (
                  <p className="border-b border-[#e2e3e8] bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                    Kéo từ vị trí điểm điều hướng theo hướng robot cần quay mặt.
                  </p>
                )}
                <label className="block border-b border-[#e2e3e8] px-4 py-3 text-xs text-[#596174]">
                  Lọc theo nhóm điểm điều hướng
                  <select
                    value={endpointGroupFilterId}
                    onChange={(event) => setEndpointGroupFilterId(event.target.value)}
                    className="mt-1.5 h-9 w-full rounded-md border border-[#dfe1e7] bg-white px-3 text-sm text-[#303640] outline-none focus:border-primary"
                  >
                    <option value="">Tất cả nhóm</option>
                    {endpointGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                </label>
                {endpointsLoading ? (
                  <p className="py-8 text-center text-sm text-[#747b88]">Đang tải điểm điều hướng...</p>
                ) : endpointsError ? (
                  <p className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{endpointsError}</p>
                ) : filteredEndpoints.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[#747b88]">
                    {endpoints.length === 0 ? 'Chưa có điểm điều hướng nào trên bản đồ này.' : 'Không có điểm điều hướng nào thuộc nhóm này.'}
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
                              <p className="truncate text-xs text-[#69717e]">{endpointTypeDisplayName(endpoint.endpointType)} · X {endpoint.positionX.toFixed(2)}, Y {endpoint.positionY.toFixed(2)}</p>
                              <p className="mt-1 truncate text-[11px] text-[#747b88]">
                                {groups.length > 0 ? groups.map((group) => group.name).join(', ') : 'Điểm điều hướng chưa phân nhóm'}
                              </p>
                            </div>
                            <StatusBadge active={endpoint.isActive} />
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              title="Sửa điểm điều hướng"
                              aria-label={`Sửa điểm điều hướng ${endpoint.name}`}
                              onClick={() => { setActionError(null); setEndpointEditTarget(endpoint) }}
                              disabled={savingResource}
                              className="rounded p-2 text-[#69717e] hover:bg-white hover:text-primary disabled:opacity-40"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Xóa điểm điều hướng"
                              aria-label={`Xóa điểm điều hướng ${endpoint.name}`}
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
                    <p className="text-xs font-medium uppercase tracking-wide text-[#747b88]">Khu vực</p>
                    <p className="mt-1 text-xs text-[#747b88]">{zones.length} khu vực</p>
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
                    <SquareDashed className="h-4 w-4" /> {drawZoneMode ? 'Đang vẽ...' : 'Vẽ khu vực'}
                  </button>
                </div>
                <label className="block border-b border-[#e2e3e8] px-4 py-3 text-xs text-[#596174]">
                  Lọc theo loại khu vực
                  <select
                    value={zoneTypeFilter}
                    onChange={(event) => setZoneTypeFilter(event.target.value)}
                    className="mt-1.5 h-9 w-full rounded-md border border-[#dfe1e7] bg-white px-3 text-sm text-[#303640] outline-none focus:border-primary"
                  >
                    <option value="">Tất cả loại</option>
                    {zoneTypes.map((type) => <option key={type} value={type}>{zoneDisplayName(type)}</option>)}
                  </select>
                </label>
                {zonesLoading ? (
                  <p className="py-8 text-center text-sm text-[#747b88]">Đang tải khu vực...</p>
                ) : zonesError ? (
                  <p className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{zonesError}</p>
                ) : filteredZones.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[#747b88]">
                    {zones.length === 0 ? 'Chưa có khu vực nào trên bản đồ này.' : 'Không có khu vực nào khớp với loại đã chọn.'}
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
                            <span className="text-right text-[10px] text-[#69717e]">{zoneDisplayName(zone.zoneType)}</span>
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              title="Sửa khu vực"
                              aria-label={`Sửa khu vực ${zoneDisplayName(zone.zoneType)}`}
                              onClick={() => { setActionError(null); setZoneEditTarget(zone) }}
                              disabled={savingResource}
                              className="rounded p-2 text-[#69717e] hover:bg-white hover:text-primary disabled:opacity-40"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Xóa khu vực"
                              aria-label={`Xóa khu vực ${zoneDisplayName(zone.zoneType)}`}
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
      {active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
    </span>
  )
}

const zoneTypes = ['KEEP_OUT', 'SPEED_LIMIT', 'NO_STOP'] as const

function endpointTypeDisplayName(endpointType: string) {
  switch (endpointType) {
    case 'WAYPOINT': return 'Điểm mốc'
    case 'CHARGER': return 'Trạm sạc'
    case 'PARK': return 'Điểm đỗ'
    default: return endpointType
  }
}

function zoneDisplayName(zoneType: string) {
  switch (zoneType) {
    case 'KEEP_OUT': return 'Khu vực cấm'
    case 'SPEED_LIMIT': return 'Khu vực giới hạn tốc độ'
    case 'NO_STOP': return 'Khu vực cấm dừng'
    default: return zoneType
  }
}

function orientedGeometryForBounds(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  rotationAngle: number,
) {
  const boxWidth = maxX - minX
  const boxHeight = maxY - minY
  const cosine = Math.abs(Math.cos(rotationAngle))
  const sine = Math.abs(Math.sin(rotationAngle))
  const determinant = cosine * cosine - sine * sine

  if (Math.abs(determinant) < 1e-6) {
    return { width: boxWidth, height: boxHeight, rotationAngle: 0 }
  }

  const width = (boxWidth * cosine - boxHeight * sine) / determinant
  const height = (boxHeight * cosine - boxWidth * sine) / determinant
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: boxWidth, height: boxHeight, rotationAngle: 0 }
  }

  return { width, height, rotationAngle }
}

type EndpointCreateInput = { name: string; endpointType: 'WAYPOINT' | 'CHARGER' | 'PARK'; positionX: number; positionY: number; theta: number }
type ZoneCreateInput = {
  name: string
  zoneType: 'KEEP_OUT' | 'SPEED_LIMIT' | 'NO_STOP'
  maxSpeed: number
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  rotationAngle: number
}
type ZoneWriteInput = Omit<ZoneCreateInput, 'width' | 'height' | 'rotationAngle'> & {
  width?: number | null
  height?: number | null
  rotationAngle?: number
}

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
          <button type="button" onClick={onClose} disabled={saving} className="text-sm text-[#747b88] hover:text-[#20232a]">Đóng</button>
        </div>
        <div className="space-y-3">{children}</div>
        {error && <p className="mt-3 rounded-md bg-rose-50 p-2.5 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-[#dfe1e7] px-3 py-2 text-sm text-[#515866] disabled:opacity-50">Hủy</button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu'}
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
  position?: OccupancyEndpointPlacement
  endpoint?: SavedMapEndpoint
  onClose: () => void
  onSubmit: (input: EndpointCreateInput) => void
  saving: boolean
  error: string | null
}) {
  return (
    <DialogFrame
      title={endpoint ? 'Sửa điểm điều hướng' : 'Tạo điểm điều hướng'}
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
      <FormField label="Tên"><input name="name" required autoFocus className={inputClass} placeholder="EP-101" defaultValue={endpoint?.name ?? ''} /></FormField>
      <FormField label="Loại điểm điều hướng">
        <select name="endpointType" className={inputClass} defaultValue={endpoint?.endpointType ?? 'WAYPOINT'}>
          <option value="WAYPOINT">Điểm mốc</option>
          <option value="CHARGER">Trạm sạc</option>
          <option value="PARK">Điểm đỗ</option>
        </select>
      </FormField>
      <div className="grid grid-cols-3 gap-2">
        <FormField label="Vị trí X"><input name="positionX" type="number" step="any" required className={inputClass} defaultValue={(endpoint?.positionX ?? position?.positionX ?? 0).toFixed(3)} /></FormField>
        <FormField label="Vị trí Y"><input name="positionY" type="number" step="any" required className={inputClass} defaultValue={(endpoint?.positionY ?? position?.positionY ?? 0).toFixed(3)} /></FormField>
        <FormField label="Hướng">
          <input
            name="theta"
            type="number"
            step="any"
            required
            readOnly={!endpoint}
            className={`${inputClass} ${endpoint ? '' : 'cursor-not-allowed bg-[#f5f6f8] text-[#687386]'}`}
            defaultValue={String(endpoint?.theta ?? position?.theta ?? 0)}
            title={endpoint ? 'Hướng tính theo radian' : 'Hướng được chọn trên bản đồ, tính theo radian'}
          />
        </FormField>
      </div>
      {!endpoint && (
        <p className="text-xs text-[#687386]">
          Hướng được tính từ mũi tên đã vẽ trên bản đồ ({(((position?.theta ?? 0) * 180) / Math.PI).toFixed(1)}°).
        </p>
      )}
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
  bounds: Pick<OccupancyZoneBounds, 'minX' | 'minY' | 'maxX' | 'maxY'> & {
    width?: number | null
    height?: number | null
    rotationAngle?: number
  }
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
      title={zone ? 'Sửa khu vực' : 'Tạo khu vực'}
      error={error}
      saving={saving}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const minX = Number(data.get('minX'))
        const minY = Number(data.get('minY'))
        const maxX = Number(data.get('maxX'))
        const maxY = Number(data.get('maxY'))
        const geometry = zone?.width != null && zone.height != null
          ? orientedGeometryForBounds(minX, minY, maxX, maxY, zone.rotationAngle ?? 0)
          : zone
            ? {}
            : {
                width: bounds.width,
                height: bounds.height,
                rotationAngle: bounds.rotationAngle,
              }
        onSubmit({
          name: String(data.get('name')).trim(),
          zoneType,
          maxSpeed: zoneType === 'SPEED_LIMIT' ? Number(data.get('maxSpeed')) : 0,
          minX,
          minY,
          maxX,
          maxY,
          ...geometry,
        })
      }}
    >
      <FormField label="Tên khu vực"><input name="name" required autoFocus className={inputClass} placeholder="Khu vực đọc sách" defaultValue={zone?.name ?? ''} /></FormField>
      <FormField label="Loại khu vực">
        <select value={zoneType} onChange={(event) => setZoneType(event.target.value as ZoneCreateInput['zoneType'])} className={inputClass}>
          {zoneTypes.map((type) => <option key={type} value={type}>{zoneDisplayName(type)}</option>)}
        </select>
      </FormField>
      {zoneType === 'SPEED_LIMIT' && <FormField label="Tốc độ tối đa (m/s)"><input name="maxSpeed" type="number" min="0.01" step="any" required className={inputClass} defaultValue={String(zone?.maxSpeed || 0.5)} /></FormField>}
      <div className="grid grid-cols-2 gap-2">
        <FormField label="X nhỏ nhất"><input name="minX" type="number" step="any" required className={inputClass} defaultValue={String(zone?.minX ?? bounds.minX)} /></FormField>
        <FormField label="Y nhỏ nhất"><input name="minY" type="number" step="any" required className={inputClass} defaultValue={String(zone?.minY ?? bounds.minY)} /></FormField>
        <FormField label="X lớn nhất"><input name="maxX" type="number" step="any" required className={inputClass} defaultValue={String(zone?.maxX ?? bounds.maxX)} /></FormField>
        <FormField label="Y lớn nhất"><input name="maxY" type="number" step="any" required className={inputClass} defaultValue={String(zone?.maxY ?? bounds.maxY)} /></FormField>
      </div>
    </DialogFrame>
  )
}

export default RobotMapDetail
