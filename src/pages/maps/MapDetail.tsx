import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, X } from 'lucide-react'
import MapDetailPanel from '../../components/map/MapDetailPanel'
import {
  initialAisles,
  initialEndpointGroupMembers,
  initialEndpointGroups,
} from '../../lib/mapData'
import MapViewer, {
  type MapEndpoint,
  type MapZone,
} from '../../components/map/MapViewer'
import SdfScene3D from '../../components/map/SdfScene3D'

type Tab = 'detail' | 'endpoint' | 'zone'
type MapViewMode = '2d' | 'gazebo3d'

export type MapInfo = {
  id: number
  floor_id: number
  floor_name: string
  name: string
  description: string
  version: number
  width: number
  height: number
  map_data: string
  status: 1 | 2
}

export const sampleMap: MapInfo = {
  id: 1,
  floor_id: 1,
  floor_name: 'Tầng 1',
  name: 'Tầng 1 - Phiên bản 1',
  description:
    'Bản đồ tầng thư viện với các kệ sách, khu vực phục vụ và đường di chuyển dành cho robot.',
  version: 1,
  width: 900,
  height: 600,
  map_data: '/maps/floor1_library_v1.pgm',
  status: 1,
}

const endpointSeeds: Omit<MapEndpoint, 'endpoint_groups'>[] = [
  {
    id: 101,
    map_id: 1,
    code: 'EP-101',
    name: 'Kệ A-01',
    description: 'Điểm điều hướng được gán cho kệ A-01.',
    position_x: 5.880,
    position_y: 25.290,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 1, name: 'Kệ A-01' },
  },
  {
    id: 102,
    map_id: 1,
    code: 'EP-102',
    name: 'Kệ A-02',
    description: 'Điểm điều hướng được gán cho kệ A-02.',
    position_x: 11.100,
    position_y: 9.040,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 2, name: 'Kệ A-02' },
  },
  {
    id: 106,
    map_id: 1,
    code: 'EP-106',
    name: 'Kệ A-03',
    description: 'Điểm điều hướng được gán cho kệ A-03.',
    position_x: 24.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 3, name: 'Kệ A-03' },
  },
  {
    id: 107,
    map_id: 1,
    code: 'EP-107',
    name: 'Kệ A-04',
    description: 'Điểm điều hướng được gán cho kệ A-04.',
    position_x: 28.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 4, name: 'Kệ A-04' },
  },
  {
    id: 108,
    map_id: 1,
    code: 'EP-108',
    name: 'Kệ A-05',
    description: 'Điểm điều hướng được gán cho kệ A-05.',
    position_x: 31.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 5, name: 'Kệ A-05' },
  },
  {
    id: 109,
    map_id: 1,
    code: 'EP-109',
    name: 'Kệ A-06',
    description: 'Điểm điều hướng được gán cho kệ A-06.',
    position_x: 35,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 6, name: 'Kệ A-06' },
  },
  {
    id: 110,
    map_id: 1,
    code: 'EP-110',
    name: 'Kệ A-07',
    description: 'Điểm điều hướng được gán cho kệ A-07.',
    position_x: 38.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 7, name: 'Kệ A-07' },
  },
  {
    id: 111,
    map_id: 1,
    code: 'EP-111',
    name: 'Kệ A-08',
    description: 'Điểm điều hướng được gán cho kệ A-08.',
    position_x: 42,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 8, name: 'Kệ A-08' },
  },
  {
    id: 112,
    map_id: 1,
    code: 'EP-112',
    name: 'Kệ A-09',
    description: 'Điểm điều hướng được gán cho kệ A-09.',
    position_x: 45.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 9, name: 'Kệ A-09' },
  },
  {
    id: 113,
    map_id: 1,
    code: 'EP-113',
    name: 'Kệ A-10',
    description: 'Điểm điều hướng được gán cho kệ A-10.',
    position_x: 49,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 10, name: 'Kệ A-10' },
  },
  {
    id: 114,
    map_id: 1,
    code: 'EP-114',
    name: 'Đầu dãy sách A',
    description: 'Điểm đầu của dãy sách A.',
    position_x: 26.5,
    position_y: 28,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 1, name: 'Dãy sách A' },
  },
  {
    id: 115,
    map_id: 1,
    code: 'EP-115',
    name: 'Cuối dãy sách A',
    description: 'Điểm cuối của dãy sách A.',
    position_x: 26.5,
    position_y: 16.5,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 1, name: 'Dãy sách A' },
  },
  {
    id: 116,
    map_id: 1,
    code: 'EP-116',
    name: 'Đầu dãy sách B',
    description: 'Điểm đầu của dãy sách B.',
    position_x: 33.3,
    position_y: 28,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 2, name: 'Dãy sách B' },
  },
  {
    id: 117,
    map_id: 1,
    code: 'EP-117',
    name: 'Cuối dãy sách B',
    description: 'Điểm cuối của dãy sách B.',
    position_x: 33.3,
    position_y: 16.5,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 2, name: 'Dãy sách B' },
  },
  {
    id: 118,
    map_id: 1,
    code: 'EP-118',
    name: 'Đầu dãy sách C',
    description: 'Điểm đầu của dãy sách C.',
    position_x: 40,
    position_y: 28,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 3, name: 'Dãy sách C' },
  },
  {
    id: 119,
    map_id: 1,
    code: 'EP-119',
    name: 'Cuối dãy sách C',
    description: 'Điểm cuối của dãy sách C.',
    position_x: 40,
    position_y: 16.5,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 3, name: 'Dãy sách C' },
  },
  {
    id: 120,
    map_id: 1,
    code: 'EP-120',
    name: 'Đầu dãy sách D',
    description: 'Điểm đầu của dãy sách D.',
    position_x: 47,
    position_y: 28,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 4, name: 'Dãy sách D' },
  },
  {
    id: 121,
    map_id: 1,
    code: 'EP-121',
    name: 'Cuối dãy sách D',
    description: 'Điểm cuối của dãy sách D.',
    position_x: 47,
    position_y: 16.5,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 4, name: 'Dãy sách D' },
  },
]

export const initialEndpoints: MapEndpoint[] = endpointSeeds.map((endpoint) => ({
  ...endpoint,
  endpoint_groups: initialEndpointGroups.filter((group) =>
    initialEndpointGroupMembers.some(
      (member) =>
        member.endpoint_id === endpoint.id &&
        member.endpoint_group_id === group.id,
    ),
  ),
}))

export const initialZones: MapZone[] = [
  {
    id: 1,
    map_id: 1,
    code: 'Z-001',
    name: 'Khu vực cấm nhà vệ sinh',
    zone_type: 1,
    max_speed: 0,
    preferred_direction: 'NONE',
    corridor_width: 0,
    allow_turnaround: false,
    description: 'Robot không được đi vào khu vực nhà vệ sinh.',
    min_x: 60.94,
    min_y: 30.12,
    max_x: 72.11,
    max_y: 39.85,
    is_active: true,
  },
  {
    id: 2,
    map_id: 1,
    code: 'Z-002',
    name: 'Khu vực đông người',
    zone_type: 2,
    max_speed: 0.35,
    preferred_direction: 'NONE',
    corridor_width: 0,
    allow_turnaround: true,
    description: 'Tốc độ tối đa trong khu vực đông người này được giới hạn ở mức 0,35 m/s.',
    min_x: 20.12,
    min_y: 3.21,
    max_x: 65.05,
    max_y: 13.07,
    is_active: true,
  },
  {
    id: 3,
    map_id: 1,
    code: 'Z-003',
    name: 'Khu vực đường một chiều',
    zone_type: 3,
    max_speed: 0,
    preferred_direction: 'FORWARD',
    corridor_width: 0,
    allow_turnaround: true,
    description: 'Hướng di chuyển ưu tiên từ giá trị nhỏ nhất đến giá trị lớn nhất.',
    min_x: 24.69,
    min_y: 15.82,
    max_x: 28.41,
    max_y: 28.88,
    is_active: true,
  },
  {
    id: 4,
    map_id: 1,
    code: 'Z-004',
    name: 'Hành lang hẹp',
    zone_type: 4,
    max_speed: 0,
    preferred_direction: 'NONE',
    corridor_width: 1.2,
    allow_turnaround: false,
    description: 'Hành lang hẹp không cho phép quay đầu.',
    min_x: 45.07,
    min_y: 16.34,
    max_x: 49.38,
    max_y: 28.36,
    is_active: true,
  },
]

function MapDetail() {
  const { id } = useParams()

  const [activeTab, setActiveTab] = useState<Tab>('detail')
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('2d')

  const [endpoints, setEndpoints] =
    useState<MapEndpoint[]>(initialEndpoints)

  const [zones, setZones] =
    useState<MapZone[]>(initialZones)

  const [selectedEndpointId, setSelectedEndpointId] =
    useState<number | null>(null)

  const [selectedZoneId, setSelectedZoneId] =
    useState<number | null>(null)

  const [endpointGroupFilterId, setEndpointGroupFilterId] =
    useState<number | null>(null)

  const [zoneTypeFilter, setZoneTypeFilter] =
    useState<MapZone['zone_type'] | null>(null)

  const [zoneDrawMode, setZoneDrawMode] = useState(false)

  const [createEndpointPosition, setCreateEndpointPosition] =
    useState<{
      x: number
      y: number
    } | null>(null)

  const [createZoneRect, setCreateZoneRect] =
    useState<{
      min_x: number
      min_y: number
      max_x: number
      max_y: number
      width: number
      height: number
      rotation_angle: number
    } | null>(null)

  const selectedEndpoint = useMemo(
    () =>
      endpoints.find(
        (endpoint) => endpoint.id === selectedEndpointId,
      ) ?? null,
    [endpoints, selectedEndpointId],
  )

  const selectedZone = useMemo(
    () =>
      zones.find((zone) => zone.id === selectedZoneId) ?? null,
    [zones, selectedZoneId],
  )

  const filteredEndpoints = useMemo(
    () =>
      endpointGroupFilterId === null
        ? endpoints
        : endpoints.filter((endpoint) =>
            endpoint.endpoint_groups.some(
              (group) => group.id === endpointGroupFilterId,
            ),
          ),
    [endpoints, endpointGroupFilterId],
  )

  const filteredZones = useMemo(
    () =>
      zoneTypeFilter === null
        ? zones
        : zones.filter((zone) => zone.zone_type === zoneTypeFilter),
    [zones, zoneTypeFilter],
  )

  const handleEndpointSelect = (endpointId: number) => {
    setSelectedEndpointId(endpointId)
    setSelectedZoneId(null)
    setActiveTab('endpoint')
  }

  const handleZoneSelect = (zoneId: number) => {
    setSelectedZoneId(zoneId)
    setSelectedEndpointId(null)
    setActiveTab('zone')
  }

  const handleMapClick = ({
    x,
    y,
  }: {
    x: number
    y: number
    screenX: number
    screenY: number
  }) => {
    if (activeTab === 'endpoint') {
      setCreateEndpointPosition({
        x,
        y,
      })

      return
    }

    if (activeTab === 'zone') {
      setSelectedEndpointId(null)
      setSelectedZoneId(null)
    }
  }

  const handleCreateEndpoint = () => {
    setActiveTab('endpoint')
    setEndpointGroupFilterId(null)
    setSelectedEndpointId(null)

    setCreateEndpointPosition({
      x: 0,
      y: 0,
    })
  }

  const handleCreateEndpointSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    const nextId =
      Math.max(0, ...endpoints.map((endpoint) => endpoint.id)) + 1

    const positionX = Number(
      formData.get('position_x') ?? 0,
    )

    const positionY = Number(
      formData.get('position_y') ?? 0,
    )

    const newEndpoint: MapEndpoint = {
      id: nextId,
      map_id: sampleMap.id,
      code: String(formData.get('code') ?? `EP-${nextId}`),
      name: String(formData.get('name') ?? 'Điểm điều hướng mới'),
      description: String(
        formData.get('description') ?? '',
      ),
      position_x: positionX,
      position_y: positionY,
      is_active: formData.get('is_active') === 'on',
      linked_object: null,
      endpoint_groups: [],
    }

    setEndpoints((current) => [...current, newEndpoint])
    setSelectedEndpointId(nextId)
    setCreateEndpointPosition(null)
  }

  const handleZoneDrawComplete = (rect: {
    min_x: number
    min_y: number
    max_x: number
    max_y: number
    width: number
    height: number
    rotation_angle: number
  }) => {
    setZoneDrawMode(false)
    setCreateZoneRect(rect)
  }

  const handleCreateZoneSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!createZoneRect) {
      return
    }

    const formData = new FormData(event.currentTarget)

    const nextId =
      Math.max(0, ...zones.map((zone) => zone.id)) + 1

    const newZone: MapZone = {
      id: nextId,
      map_id: sampleMap.id,
      code: String(formData.get('code') ?? `Z-${nextId}`),
      name: String(formData.get('name') ?? 'Khu vực mới'),
      zone_type: Number(
        formData.get('zone_type') ?? 1,
      ) as MapZone['zone_type'],
      max_speed: Number(
        formData.get('max_speed') ?? 0,
      ),
      preferred_direction: String(
        formData.get('preferred_direction') ?? 'NONE',
      ),
      corridor_width: Number(
        formData.get('corridor_width') ?? 0,
      ),
      allow_turnaround:
        formData.get('allow_turnaround') === 'on',
      description: String(
        formData.get('description') ?? '',
      ),
      min_x: createZoneRect.min_x,
      min_y: createZoneRect.min_y,
      max_x: createZoneRect.max_x,
      max_y: createZoneRect.max_y,
      width: createZoneRect.width,
      height: createZoneRect.height,
      rotation_angle: createZoneRect.rotation_angle,
      is_active: formData.get('is_active') === 'on',
    }

    setZones((current) => [...current, newZone])
    setSelectedZoneId(nextId)
    setCreateZoneRect(null)
  }

  const mapId = Number(id) || sampleMap.id

  const map = {
    ...sampleMap,
    id: mapId,
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#0c0d10] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#121318] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/maps"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/55 hover:bg-white/8 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {map.name}
            </h1>

            <p className="text-xs text-white/35">
              Bản đồ #{map.id} · {map.floor_name} · v{map.version}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
          Đang hoạt động
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row">
        <main className="flex min-h-[320px] min-w-0 flex-1 flex-col">
          <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-white/8 bg-[#121318] px-4">
            <div className="flex items-center gap-1 rounded-md border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setMapViewMode('2d')}
                aria-pressed={mapViewMode === '2d'}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${mapViewMode === '2d' ? 'bg-white/12 text-white' : 'text-white/50 hover:text-white'}`}
              >
                Bản đồ 2D
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode('gazebo3d')}
                aria-pressed={mapViewMode === 'gazebo3d'}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${mapViewMode === 'gazebo3d' ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/50 hover:text-white'}`}
              >
                Gazebo 3D
              </button>
            </div>
            {mapViewMode === 'gazebo3d' && (
              <span className="truncate text-[11px] text-amber-200/70">
                Nguồn: library_layout.json · cảnh Gazebo tĩnh 50×60 m, độc lập với bản đồ 2D đang biên tập
              </span>
            )}
          </div>
          <div className="min-h-[280px] min-w-0 flex-1">
            {mapViewMode === '2d' ? (
              <MapViewer
                yamlUrl="/maps/floor1_library_v1.yaml"
                endpoints={filteredEndpoints}
                aisles={initialAisles}
                zones={filteredZones}
                selectedEndpointId={selectedEndpointId}
                selectedZoneId={selectedZoneId}
                showEndpoints={activeTab === 'endpoint'}
                showZones={activeTab === 'zone'}
                zoneDrawMode={zoneDrawMode}
                onEndpointSelect={handleEndpointSelect}
                onZoneSelect={handleZoneSelect}
                onMapClick={handleMapClick}
                onZoneDrawComplete={handleZoneDrawComplete}
              />
            ) : (
              <SdfScene3D />
            )}
          </div>
        </main>

        <MapDetailPanel
          map={map}
          activeTab={activeTab}
          endpoints={filteredEndpoints}
          endpointGroups={initialEndpointGroups}
          endpointGroupFilterId={endpointGroupFilterId}
          zones={filteredZones}
          zoneTypeFilter={zoneTypeFilter}
          selectedEndpoint={selectedEndpoint}
          selectedZone={selectedZone}
          zoneDrawMode={zoneDrawMode}
          onTabChange={(tab) => {
            setActiveTab(tab)

            if (tab !== 'endpoint') {
              setCreateEndpointPosition(null)
            }

            if (tab !== 'zone') {
              setZoneDrawMode(false)
            }
          }}
          onEndpointSelect={handleEndpointSelect}
          onEndpointBack={() => setSelectedEndpointId(null)}
          onEndpointGroupFilterChange={(groupId) => {
            setEndpointGroupFilterId(groupId)
            setSelectedEndpointId(null)
          }}
          onZoneSelect={handleZoneSelect}
          onZoneBack={() => setSelectedZoneId(null)}
          onZoneTypeFilterChange={(zoneType) => {
            setZoneTypeFilter(zoneType)
            setSelectedZoneId(null)
          }}
          onCreateEndpoint={handleCreateEndpoint}
          onDrawZone={() => {
            setActiveTab('zone')
            setSelectedEndpointId(null)
            setSelectedZoneId(null)
            setZoneTypeFilter(null)
            setZoneDrawMode((current) => !current)
          }}
        />
      </div>

      {createEndpointPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateEndpointSubmit}
            className="w-full max-w-lg rounded-xl border border-white/10 bg-[#17181d] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Tạo điểm điều hướng
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Tạo điểm điều hướng trên bản đồ thư viện.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateEndpointPosition(null)}
                className="rounded-md p-2 text-white/40 hover:bg-white/8 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-xs text-white/55">
                Mã bản đồ
                <input
                  value={map.id}
                  readOnly
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/60"
                />
              </label>

              <label className="text-xs text-white/55">
                Mã
                <input
                  name="code"
                  defaultValue={`EP-${
                    Math.max(
                      0,
                      ...endpoints.map(
                        (endpoint) => endpoint.id,
                      ),
                    ) + 1
                  }`}
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="col-span-2 text-xs text-white/55">
                Tên
                <input
                  name="name"
                  required
                  placeholder="Tên điểm điều hướng"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="col-span-2 text-xs text-white/55">
                Mô tả
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Vị trí X
                <input
                  name="position_x"
                  type="number"
                  step="0.001"
                  defaultValue={createEndpointPosition.x.toFixed(
                    3,
                  )}
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Vị trí Y
                <input
                  name="position_y"
                  type="number"
                  step="0.001"
                  defaultValue={createEndpointPosition.y.toFixed(
                    3,
                  )}
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="col-span-2 flex items-center gap-2 text-sm text-white/70">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 accent-primary"
                />
                Đang hoạt động
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateEndpointPosition(null)}
                className="rounded-md px-4 py-2 text-sm text-white/60 hover:bg-white/8 hover:text-white"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Tạo điểm điều hướng
              </button>
            </div>
          </form>
        </div>
      )}

      {createZoneRect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateZoneSubmit}
            className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#17181d] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Tạo khu vực
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Cấu hình khu vực bạn vừa vẽ trên bản đồ.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateZoneRect(null)}
                className="rounded-md p-2 text-white/40 hover:bg-white/8 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-xs text-white/55">
                Mã
                <input
                  name="code"
                  defaultValue={`Z-${
                    Math.max(
                      0,
                      ...zones.map((zone) => zone.id),
                    ) + 1
                  }`}
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Tên
                <input
                  name="name"
                  required
                  placeholder="Tên khu vực"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Loại khu vực
                <select
                  name="zone_type"
                  defaultValue="1"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-[#17181d] px-3 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="1">
                    1 - Khu vực cấm
                  </option>
                  <option value="2">
                    2 - Giới hạn tốc độ
                  </option>
                  <option value="3">
                    3 - Hướng ưu tiên
                  </option>
                  <option value="4">
                    4 - Hành lang hẹp
                  </option>
                </select>
              </label>

              <label className="text-xs text-white/55">
                Tốc độ tối đa
                <input
                  name="max_speed"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Hướng ưu tiên
                <select
                  name="preferred_direction"
                  defaultValue="NONE"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-[#17181d] px-3 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="NONE">Không có</option>
                  <option value="FORWARD">Xuôi (Từ nhỏ đến lớn)</option>
                  <option value="REVERSE">Ngược (Từ lớn đến nhỏ)</option>
                  <option value="NORTH">Bắc</option>
                  <option value="SOUTH">Nam</option>
                  <option value="EAST">Đông</option>
                  <option value="WEST">Tây</option>
                </select>
              </label>

              <label className="text-xs text-white/55">
                Chiều rộng hành lang
                <input
                  name="corridor_width"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="col-span-2 text-xs text-white/55">
                Mô tả
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <div className="rounded-lg border border-white/8 bg-white/3 p-3">
                <p className="text-[11px] uppercase tracking-wide text-white/35">
                  Nhỏ nhất
                </p>

                <p className="mt-1 font-mono text-xs text-white/70">
                  X {createZoneRect.min_x.toFixed(2)}
                  {' · '}
                  Y {createZoneRect.min_y.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg border border-white/8 bg-white/3 p-3">
                <p className="text-[11px] uppercase tracking-wide text-white/35">
                  Lớn nhất
                </p>

                <p className="mt-1 font-mono text-xs text-white/70">
                  X {createZoneRect.max_x.toFixed(2)}
                  {' · '}
                  Y {createZoneRect.max_y.toFixed(2)}
                </p>
              </div>

              <label className="col-span-2 flex items-center gap-2 text-sm text-white/70">
                <input
                  name="allow_turnaround"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 accent-primary"
                />
                Cho phép quay đầu
              </label>

              <label className="col-span-2 flex items-center gap-2 text-sm text-white/70">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 accent-primary"
                />
                Đang hoạt động
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateZoneRect(null)}
                className="rounded-md px-4 py-2 text-sm text-white/60 hover:bg-white/8 hover:text-white"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Tạo khu vực
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default MapDetail
