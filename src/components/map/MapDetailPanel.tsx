import { Link } from 'react-router'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  MapPin,
  Plus,
  SquareDashed,
} from 'lucide-react'
import type {
  MapEndpoint,
  MapZone,
} from './MapViewer'
import type { EndpointGroup } from '../../types/map'
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

type Tab = 'detail' | 'endpoint' | 'zone'

const linkedObjectPath = {
  AREA: 'areas',
  AISLE: 'aisles',
  SHELF: 'shelves',
} as const

type MapDetailPanelProps = {
  map: MapInfo
  activeTab: Tab
  endpoints: MapEndpoint[]
  endpointGroups: EndpointGroup[]
  endpointGroupFilterId: number | null
  zones: MapZone[]
  selectedEndpoint: MapEndpoint | null
  selectedZone: MapZone | null
  zoneDrawMode: boolean
  onTabChange: (tab: Tab) => void
  onEndpointSelect: (id: number) => void
  onEndpointBack: () => void
  onEndpointGroupFilterChange: (groupId: number | null) => void
  onZoneSelect: (id: number) => void
  onCreateEndpoint: () => void
  onDrawZone: () => void
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="border-b border-white/8 py-3 last:border-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-white/35">
        {label}
      </p>

      <div className="mt-1 break-words text-sm text-white/85">
        {value}
      </div>
    </div>
  )
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
        active
          ? 'bg-emerald-500/15 text-emerald-300'
          : 'bg-white/10 text-white/45'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-400' : 'bg-white/30'
        }`}
      />

      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function zoneTypeLabel(type: MapZone['zone_type']) {
  switch (type) {
    case 1:
      return 'EXCLUSION'
    case 2:
      return 'SPEED_LIMIT'
    case 3:
      return 'PREFERRED_DIRECTION'
    case 4:
      return 'NARROW_CORRIDOR'
  }
}

function MapDetailPanel({
  map,
  activeTab,
  endpoints,
  endpointGroups,
  endpointGroupFilterId,
  zones,
  selectedEndpoint,
  selectedZone,
  zoneDrawMode,
  onTabChange,
  onEndpointSelect,
  onEndpointBack,
  onEndpointGroupFilterChange,
  onZoneSelect,
  onCreateEndpoint,
  onDrawZone,
}: MapDetailPanelProps) {
  return (
    <aside className="flex h-[240px] w-full shrink-0 flex-col border-t border-white/10 bg-[#17181d] text-white xl:h-full xl:w-[360px] xl:border-l xl:border-t-0">
      <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-3">
        {[
          ['detail', 'Detail'],
          ['endpoint', 'Endpoint'],
          ['zone', 'Zone'],
        ].map(([value, label]) => {
          const active = activeTab === value

          return (
            <button
              key={value}
              type="button"
              onClick={() => onTabChange(value as Tab)}
              className={`relative h-full px-3 text-sm font-medium transition ${
                active
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {label}

              {active && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'detail' && (
          <div className="px-4 pb-6">
            <div className="border-b border-white/10 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                Map
              </p>

              <h2 className="mt-1 text-base font-semibold">
                {map.name}
              </h2>
            </div>

            <Field label="ID" value={map.id} />

            <Field
              label="Floor"
              value={
                <Link
                  to={`/floors/${map.floor_id}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {map.floor_name}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            />

            <Field label="Floor ID" value={map.floor_id} />

            <Field label="Name" value={map.name} />

            <Field
              label="Description"
              value={map.description}
            />

            <Field label="Version" value={`v${map.version}`} />

            <Field
              label="Width"
              value={`${map.width} px`}
            />

            <Field
              label="Height"
              value={`${map.height} px`}
            />

            <Field
              label="Map Data"
              value={
                <span className="font-mono text-xs">
                  {map.map_data}
                </span>
              }
            />

            <Field
              label="Status"
              value={
                <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  Active
                </span>
              }
            />
          </div>
        )}

        {activeTab === 'endpoint' && (
          <div>
            {selectedEndpoint ? (
              <div className="px-4 pb-6">
                <button
                  type="button"
                  onClick={onEndpointBack}
                  className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to endpoints
                </button>

                <div className="border-b border-white/10 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                    Selected Endpoint
                  </p>

                  <h2 className="mt-1 text-base font-semibold">
                    {selectedEndpoint.name}
                  </h2>
                </div>

                <Field label="ID" value={selectedEndpoint.id} />

                <Field
                  label="Map ID"
                  value={selectedEndpoint.map_id}
                />

                <Field
                  label="Code"
                  value={selectedEndpoint.code}
                />

                <Field
                  label="Name"
                  value={selectedEndpoint.name}
                />

                <Field
                  label="Description"
                  value={selectedEndpoint.description}
                />

                <Field
                  label="Position X"
                  value={selectedEndpoint.position_x.toFixed(3)}
                />

                <Field
                  label="Position Y"
                  value={selectedEndpoint.position_y.toFixed(3)}
                />

                <Field
                  label="Is Active"
                  value={<StatusPill active={selectedEndpoint.is_active} />}
                />

                <Field
                  label="Endpoint Groups"
                  value={
                    selectedEndpoint.endpoint_groups.length > 0 ? (
                      <div className="space-y-1">
                        {selectedEndpoint.endpoint_groups.map((group) => (
                          <p key={group.id}>{group.name}</p>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/35">None</span>
                    )
                  }
                />

                <Field
                  label="Linked Object"
                  value={
                    selectedEndpoint.linked_object ? (
                      <Link
                        to={`/${linkedObjectPath[selectedEndpoint.linked_object.kind]}/${selectedEndpoint.linked_object.id}`}
                        className="text-primary hover:underline"
                      >
                        {selectedEndpoint.linked_object.name}
                      </Link>
                    ) : (
                      <span className="text-white/35">None</span>
                    )
                  }
                />
              </div>
            ) : (
              <>
                <div className="border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                    Endpoints
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {endpoints.length} endpoint
                    {endpoints.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onCreateEndpoint}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-2 text-xs font-medium text-white hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create
                </button>
              </div>
                </div>

                <label className="block border-b border-white/10 px-4 py-3 text-xs text-white/55">
                  Filter by endpoint group
                  <select
                    value={endpointGroupFilterId ?? ''}
                    onChange={(event) =>
                      onEndpointGroupFilterChange(
                        event.target.value
                          ? Number(event.target.value)
                          : null,
                      )
                    }
                    className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-[#17181d] px-3 text-sm text-white outline-none focus:border-primary"
                  >
                    <option value="">All groups</option>
                    {endpointGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>

            <div className="border-b border-white/10">
              {endpoints.map((endpoint) => {
                return (
                  <button
                    key={endpoint.id}
                    type="button"
                    onClick={() => onEndpointSelect(endpoint.id)}
                    className="flex w-full items-center gap-3 border-b border-white/6 px-4 py-3 text-left transition last:border-0 hover:bg-white/4"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/85">
                        {endpoint.code}
                      </p>

                      <p className="truncate text-xs text-white/40">
                        {endpoint.name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-1">
                        {endpoint.endpoint_groups.map((group) => (
                          <span
                            key={group.id}
                            className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-white/55"
                          >
                            {group.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <StatusPill active={endpoint.is_active} />
                  </button>
                )
              })}
            </div>
                {endpoints.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-white/35">
                    No endpoints belong to this group.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'zone' && (
          <div>
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                    Zones
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {zones.length} zone{zones.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onDrawZone}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition ${
                    zoneDrawMode
                      ? 'bg-primary text-white'
                      : 'bg-white/8 text-white/80 hover:bg-white/12'
                  }`}
                >
                  <SquareDashed className="h-3.5 w-3.5" />
                  {zoneDrawMode ? 'Drawing...' : 'Draw Zone'}
                </button>
              </div>
            </div>

            <div className="border-b border-white/10">
              {zones.map((zone) => {
                const selected = zone.id === selectedZone?.id

                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onZoneSelect(zone.id)}
                    className={`flex w-full items-center gap-3 border-b border-white/6 px-4 py-3 text-left last:border-0 ${
                      selected
                        ? 'bg-primary/15'
                        : 'hover:bg-white/4'
                    }`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/8">
                      <SquareDashed className="h-3.5 w-3.5 text-white/60" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/85">
                        {zone.code}
                      </p>

                      <p className="truncate text-xs text-white/40">
                        {zone.name}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedZone && (
              <div className="px-4 pb-6">
                <div className="border-b border-white/10 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                    Selected Zone
                  </p>

                  <h2 className="mt-1 text-base font-semibold">
                    {selectedZone.name}
                  </h2>
                </div>

                <Field label="ID" value={selectedZone.id} />

                <Field
                  label="Map ID"
                  value={selectedZone.map_id}
                />

                <Field
                  label="Code"
                  value={selectedZone.code}
                />

                <Field
                  label="Name"
                  value={selectedZone.name}
                />

                <Field
                  label="Zone Type"
                  value={zoneTypeLabel(selectedZone.zone_type)}
                />

                <Field
                  label="Max Speed"
                  value={`${selectedZone.max_speed} m/s`}
                />

                <Field
                  label="Preferred Direction"
                  value={selectedZone.preferred_direction}
                />

                <Field
                  label="Corridor Width"
                  value={`${selectedZone.corridor_width} m`}
                />

                <Field
                  label="Allow Turnaround"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Check
                        className={`h-3.5 w-3.5 ${
                          selectedZone.allow_turnaround
                            ? 'text-emerald-400'
                            : 'text-white/20'
                        }`}
                      />
                      {selectedZone.allow_turnaround
                        ? 'Yes'
                        : 'No'}
                    </span>
                  }
                />

                <Field
                  label="Description"
                  value={selectedZone.description}
                />

                <Field
                  label="Min X"
                  value={selectedZone.min_x.toFixed(2)}
                />

                <Field
                  label="Min Y"
                  value={selectedZone.min_y.toFixed(2)}
                />

                <Field
                  label="Max X"
                  value={selectedZone.max_x.toFixed(2)}
                />

                <Field
                  label="Max Y"
                  value={selectedZone.max_y.toFixed(2)}
                />

                <Field
                  label="Is Active"
                  value={
                    <StatusPill active={selectedZone.is_active} />
                  }
                />
              </div>
            )}

            {!selectedZone && (
              <div className="px-4 py-8 text-center text-xs text-white/35">
                Select a zone on the map or from the list.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default MapDetailPanel