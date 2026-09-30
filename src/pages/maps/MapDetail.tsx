import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, X } from 'lucide-react'
import MapDetailPanel from '../../components/map/MapDetailPanel'
import MapViewer, {
  type MapEndpoint,
  type MapZone,
} from '../../components/map/MapViewer'

type Tab = 'detail' | 'endpoint' | 'zone'

type MapInfo = {
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

const sampleMap: MapInfo = {
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

const initialEndpoints: MapEndpoint[] = [
  {
    id: 101,
    map_id: 1,
    code: 'EP-101',
    name: 'Main Entrance',
    description: 'Main entrance navigation point.',
    position_x: 5.88,
    position_y: 25.29,
    is_active: true,
    location: {
      kind: 'FACILITY',
      id: 1,
      name: 'Main Entrance',
    },
    group: {
      id: 1,
      name: 'Library Navigation',
      description: 'Common navigation points used by the robot.',
    },
  },
  {
    id: 102,
    map_id: 1,
    code: 'EP-102',
    name: 'Circulation Desk',
    description: 'Navigation point near the circulation desk.',
    position_x: -9,
    position_y: -4,
    is_active: true,
    location: {
      kind: 'FACILITY',
      id: 2,
      name: 'Circulation Desk',
    },
    group: {
      id: 1,
      name: 'Library Navigation',
      description: 'Common navigation points used by the robot.',
    },
  },
  {
    id: 103,
    map_id: 1,
    code: 'EP-103',
    name: 'Fiction Aisle A',
    description: 'Navigation point at the beginning of Fiction Aisle A.',
    position_x: -13,
    position_y: 6,
    is_active: true,
    location: {
      kind: 'AISLE',
      id: 1,
      name: 'Fiction Aisle A',
    },
    group: {
      id: 2,
      name: 'Collection Navigation',
      description: 'Navigation points associated with collection areas.',
    },
  },
  {
    id: 104,
    map_id: 1,
    code: 'EP-104',
    name: 'Shelf A-04',
    description: 'Navigation point near shelf A-04.',
    position_x: 3,
    position_y: 7,
    is_active: true,
    location: {
      kind: 'SHELF',
      id: 4,
      name: 'Shelf A-04',
    },
    group: {
      id: 2,
      name: 'Collection Navigation',
      description: 'Navigation points associated with collection areas.',
    },
  },
  {
    id: 105,
    map_id: 1,
    code: 'EP-105',
    name: 'Children Area',
    description: 'Navigation point for the children reading area.',
    position_x: 14,
    position_y: -4,
    is_active: true,
    location: {
      kind: 'FACILITY',
      id: 5,
      name: 'Children Reading Area',
    },
    group: {
      id: 1,
      name: 'Library Navigation',
      description: 'Common navigation points used by the robot.',
    },
  },
  {
    id: 106,
    map_id: 1,
    code: 'EP-106',
    name: 'Return Station',
    description: 'Book return robot station.',
    position_x: -15,
    position_y: -11,
    is_active: true,
    location: {
      kind: 'FACILITY',
      id: 6,
      name: 'Return Station',
    },
    group: {
      id: 3,
      name: 'Robot Station',
      description: 'Navigation points related to robot stations.',
    },
  },
  {
    id: 107,
    map_id: 1,
    code: 'EP-107',
    name: 'Elevator',
    description: 'Elevator navigation point.',
    position_x: 17,
    position_y: 9,
    is_active: true,
    location: null,
    group: {
      id: 1,
      name: 'Library Navigation',
      description: 'Common navigation points used by the robot.',
    },
  },
]

const initialZones: MapZone[] = [
  {
    id: 1,
    map_id: 1,
    code: 'Z-001',
    name: 'Staff Restricted Area',
    zone_type: 1,
    max_speed: 0,
    preferred_direction: 'NONE',
    corridor_width: 0,
    allow_turnaround: false,
    description: 'Robot must not enter the staff-only area.',
    min_x: 1,
    min_y: 7,
    max_x: 5,
    max_y: 6,
    is_active: true,
  },
  {
    id: 2,
    map_id: 1,
    code: 'Z-002',
    name: 'Reading Area Speed Limit',
    zone_type: 2,
    max_speed: 0.35,
    preferred_direction: 'NONE',
    corridor_width: 0,
    allow_turnaround: true,
    description: 'Reduced robot speed around the reading area.',
    min_x: 7,
    min_y: -8,
    max_x: 20,
    max_y: -1,
    is_active: true,
  },
  {
    id: 3,
    map_id: 1,
    code: 'Z-003',
    name: 'Main Corridor Direction',
    zone_type: 3,
    max_speed: 0,
    preferred_direction: 'EAST',
    corridor_width: 2.2,
    allow_turnaround: true,
    description: 'Preferred eastbound travel direction.',
    min_x: -5,
    min_y: 0,
    max_x: 10,
    max_y: 2.5,
    is_active: true,
  },
  {
    id: 4,
    map_id: 1,
    code: 'Z-004',
    name: 'Narrow Shelf Corridor',
    zone_type: 4,
    max_speed: 0.25,
    preferred_direction: 'NORTH',
    corridor_width: 1.2,
    allow_turnaround: false,
    description: 'Narrow corridor between book shelves.',
    min_x: -8,
    min_y: 4,
    max_x: -5,
    max_y: 12,
    is_active: true,
  },
]

function MapDetail() {
  const { id } = useParams()

  const [activeTab, setActiveTab] = useState<Tab>('detail')

  const [endpoints, setEndpoints] =
    useState<MapEndpoint[]>(initialEndpoints)

  const [zones, setZones] =
    useState<MapZone[]>(initialZones)

  const [selectedEndpointId, setSelectedEndpointId] =
    useState<number | null>(null)

  const [selectedZoneId, setSelectedZoneId] =
    useState<number | null>(null)

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
      location: null,
      group: null,
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
        <main className="min-h-[280px] min-w-0 flex-1">
          <MapViewer
            yamlUrl="/maps/floor1_library_v1.yaml"
            endpoints={endpoints}
            zones={zones}
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
        </main>

        <MapDetailPanel
          map={map}
          activeTab={activeTab}
          endpoints={endpoints}
          zones={zones}
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
          onZoneSelect={handleZoneSelect}
          onCreateEndpoint={handleCreateEndpoint}
          onDrawZone={() => {
            setActiveTab('zone')
            setSelectedEndpointId(null)
            setSelectedZoneId(null)
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
                  step="0.01"
                  defaultValue={createEndpointPosition.x.toFixed(
                    2,
                  )}
                  className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs text-white/55">
                Position Y
                <input
                  name="position_y"
                  type="number"
                  step="0.01"
                  defaultValue={createEndpointPosition.y.toFixed(
                    2,
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