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
  floor_name: 'Floor 1',
  name: 'Floor 1 - Version 1',
  description:
    'Library floor map with reading areas, shelves, service rooms and robot corridors.',
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
    name: 'Shelf A-01',
    description: 'Endpoint assigned to Shelf A-01.',
    position_x: 5.880,
    position_y: 25.290,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 1, name: 'Shelf A-01' },
  },
  {
    id: 102,
    map_id: 1,
    code: 'EP-102',
    name: 'Shelf A-02',
    description: 'Endpoint assigned to Shelf A-02.',
    position_x: 11.100,
    position_y: 9.040,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 2, name: 'Shelf A-02' },
  },
  {
    id: 103,
    map_id: 1,
    code: 'EP-103',
    name: 'Desk of Librarian',
    description: 'Endpoint assigned to Desk of Librarian.',
    position_x: 28.740,
    position_y: 6.350,
    is_active: true,
    linked_object: { kind: 'AREA', id: 1, name: 'Desk of Librarian' },
  },
  {
    id: 104,
    map_id: 1,
    code: 'EP-104',
    name: 'Reading desk area A',
    description: 'Endpoint assigned to Reading desk area A.',
    position_x: 40,
    position_y: 7,
    is_active: true,
    linked_object: { kind: 'AREA', id: 2, name: 'Reading desk area A' },
  },
  {
    id: 105,
    map_id: 1,
    code: 'EP-105',
    name: 'Reading desk area B',
    description: 'Endpoint assigned to Reading desk area B.',
    position_x: 54,
    position_y: 7,
    is_active: true,
    linked_object: { kind: 'AREA', id: 3, name: 'Reading desk area B' },
  },
  {
    id: 106,
    map_id: 1,
    code: 'EP-106',
    name: 'Shelf A-03',
    description: 'Endpoint assigned to Shelf A-03.',
    position_x: 24.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 3, name: 'Shelf A-03' },
  },
  {
    id: 107,
    map_id: 1,
    code: 'EP-107',
    name: 'Shelf A-04',
    description: 'Endpoint assigned to Shelf A-04.',
    position_x: 28.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 4, name: 'Shelf A-04' },
  },
  {
    id: 108,
    map_id: 1,
    code: 'EP-108',
    name: 'Shelf A-05',
    description: 'Endpoint assigned to Shelf A-05.',
    position_x: 31.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 5, name: 'Shelf A-05' },
  },
  {
    id: 109,
    map_id: 1,
    code: 'EP-109',
    name: 'Shelf A-06',
    description: 'Endpoint assigned to Shelf A-06.',
    position_x: 35,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 6, name: 'Shelf A-06' },
  },
  {
    id: 110,
    map_id: 1,
    code: 'EP-110',
    name: 'Shelf A-07',
    description: 'Endpoint assigned to Shelf A-07.',
    position_x: 38.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 7, name: 'Shelf A-07' },
  },
  {
    id: 111,
    map_id: 1,
    code: 'EP-111',
    name: 'Shelf A-08',
    description: 'Endpoint assigned to Shelf A-08.',
    position_x: 42,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 8, name: 'Shelf A-08' },
  },
  {
    id: 112,
    map_id: 1,
    code: 'EP-112',
    name: 'Shelf A-09',
    description: 'Endpoint assigned to Shelf A-09.',
    position_x: 45.5,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 9, name: 'Shelf A-09' },
  },
  {
    id: 113,
    map_id: 1,
    code: 'EP-113',
    name: 'Shelf A-10',
    description: 'Endpoint assigned to Shelf A-10.',
    position_x: 49,
    position_y: 23,
    is_active: true,
    linked_object: { kind: 'SHELF', id: 10, name: 'Shelf A-10' },
  },
  {
    id: 114,
    map_id: 1,
    code: 'EP-114',
    name: 'Aisle A Start',
    description: 'Start endpoint for Aisle A.',
    position_x: 26.5,
    position_y: 28,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 1, name: 'Aisle A' },
  },
  {
    id: 115,
    map_id: 1,
    code: 'EP-115',
    name: 'Aisle A End',
    description: 'End endpoint for Aisle A.',
    position_x: 26.5,
    position_y: 16.5,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 1, name: 'Aisle A' },
  },
  {
    id: 116,
    map_id: 1,
    code: 'EP-116',
    name: 'Aisle B Start',
    description: 'Start endpoint for Aisle B.',
    position_x: 33.3,
    position_y: 28,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 2, name: 'Aisle B' },
  },
  {
    id: 117,
    map_id: 1,
    code: 'EP-117',
    name: 'Aisle B End',
    description: 'End endpoint for Aisle B.',
    position_x: 33.3,
    position_y: 16.5,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 2, name: 'Aisle B' },
  },
  {
    id: 118,
    map_id: 1,
    code: 'EP-118',
    name: 'Aisle C Start',
    description: 'Start endpoint for Aisle C.',
    position_x: 40,
    position_y: 28,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 3, name: 'Aisle C' },
  },
  {
    id: 119,
    map_id: 1,
    code: 'EP-119',
    name: 'Aisle C End',
    description: 'End endpoint for Aisle C.',
    position_x: 40,
    position_y: 16.5,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 3, name: 'Aisle C' },
  },
  {
    id: 120,
    map_id: 1,
    code: 'EP-120',
    name: 'Aisle D Start',
    description: 'Start endpoint for Aisle D.',
    position_x: 47,
    position_y: 28,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 4, name: 'Aisle D' },
  },
  {
    id: 121,
    map_id: 1,
    code: 'EP-121',
    name: 'Aisle D End',
    description: 'End endpoint for Aisle D.',
    position_x: 47,
    position_y: 16.5,
    is_active: true,
    linked_object: { kind: 'AISLE', id: 4, name: 'Aisle D' },
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
    name: 'Restroom Area',
    zone_type: 1,
    max_speed: 0,
    preferred_direction: 'NONE',
    corridor_width: 0,
    allow_turnaround: false,
    description: 'Robot must not enter the restroom area.',
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
    name: 'crowded area',
    zone_type: 2,
    max_speed: 0.35,
    preferred_direction: 'NONE',
    corridor_width: 0,
    allow_turnaround: true,
    description: 'Maximum speed is limited to 0.35 m/s in this crowded area.',
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
    name: 'One-way Street Area',
    zone_type: 3,
    max_speed: 0,
    preferred_direction: 'FORWARD',
    corridor_width: 0,
    allow_turnaround: true,
    description: 'Preferred travel direction is from Min to Max.',
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
    name: 'Narrow Area',
    zone_type: 4,
    max_speed: 0,
    preferred_direction: 'NONE',
    corridor_width: 1.2,
    allow_turnaround: false,
    description: 'Narrow corridor with turnaround disabled.',
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
      name: String(formData.get('name') ?? 'New Endpoint'),
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
      name: String(formData.get('name') ?? 'New Zone'),
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
              Map #{map.id} · {map.floor_name} · v{map.version}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
          Active
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
                2D map
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
                Nguồn: library_layout.json · cảnh Gazebo tĩnh 50×60 m, độc lập với map biên tập 2D
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
                  Create Endpoint
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Create a navigation point on the library map.
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
                Map ID
                <input
                  value={map.id}
                  readOnly
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/60"
                />
              </label>

              <label className="text-xs text-white/55">
                Code
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
                Name
                <input
                  name="name"
                  required
                  placeholder="Endpoint name"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="col-span-2 text-xs text-white/55">
                Description
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Position X
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
                Position Y
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
                Active
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateEndpointPosition(null)}
                className="rounded-md px-4 py-2 text-sm text-white/60 hover:bg-white/8 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Create Endpoint
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
                  Create Zone
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Configure the zone you just drew on the map.
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
                Code
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
                Name
                <input
                  name="name"
                  required
                  placeholder="Zone name"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Zone Type
                <select
                  name="zone_type"
                  defaultValue="1"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-[#17181d] px-3 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="1">
                    1 - EXCLUSION
                  </option>
                  <option value="2">
                    2 - SPEED_LIMIT
                  </option>
                  <option value="3">
                    3 - PREFERRED_DIRECTION
                  </option>
                  <option value="4">
                    4 - NARROW_CORRIDOR
                  </option>
                </select>
              </label>

              <label className="text-xs text-white/55">
                Max Speed
                <input
                  name="max_speed"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Preferred Direction
                <select
                  name="preferred_direction"
                  defaultValue="NONE"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-[#17181d] px-3 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="NONE">NONE</option>
                  <option value="FORWARD">FORWARD (Min to Max)</option>
                  <option value="REVERSE">REVERSE (Max to Min)</option>
                  <option value="NORTH">NORTH</option>
                  <option value="SOUTH">SOUTH</option>
                  <option value="EAST">EAST</option>
                  <option value="WEST">WEST</option>
                </select>
              </label>

              <label className="text-xs text-white/55">
                Corridor Width
                <input
                  name="corridor_width"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="col-span-2 text-xs text-white/55">
                Description
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <div className="rounded-lg border border-white/8 bg-white/3 p-3">
                <p className="text-[11px] uppercase tracking-wide text-white/35">
                  Min
                </p>

                <p className="mt-1 font-mono text-xs text-white/70">
                  X {createZoneRect.min_x.toFixed(2)}
                  {' · '}
                  Y {createZoneRect.min_y.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg border border-white/8 bg-white/3 p-3">
                <p className="text-[11px] uppercase tracking-wide text-white/35">
                  Max
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
                Allow turnaround
              </label>

              <label className="col-span-2 flex items-center gap-2 text-sm text-white/70">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 accent-primary"
                />
                Active
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateZoneRect(null)}
                className="rounded-md px-4 py-2 text-sm text-white/60 hover:bg-white/8 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Create Zone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default MapDetail
