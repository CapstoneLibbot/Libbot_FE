import { useMemo, useState } from 'react'
import {
  ChevronDown,
  Filter,
  Map as MapIcon,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router'

const MapStatus = {
  Active: 1,
  Archived: 2,
} as const

type MapStatus = (typeof MapStatus)[keyof typeof MapStatus]

type MapData = {
  id: number
  floorId: number
  name: string
  description: string
  version: number
  width: number
  height: number
  mapData: string
  status: MapStatus
}

const sampleMaps: MapData[] = [
  {
    id: 1,
    floorId: 1,
    name: 'Floor 1 - Version 1',
    description: 'Main library map for the first floor',
    version: 1,
    width: 1200,
    height: 800,
    mapData: '{}',
    status: MapStatus.Active,
  },
  {
    id: 2,
    floorId: 1,
    name: 'Floor 1 - Version 2',
    description: 'Updated layout for the first floor',
    version: 2,
    width: 1200,
    height: 800,
    mapData: '{}',
    status: MapStatus.Active,
  },
  {
    id: 3,
    floorId: 2,
    name: 'Floor 2 - Version 1',
    description: 'Main library map for the second floor',
    version: 1,
    width: 1400,
    height: 900,
    mapData: '{}',
    status: MapStatus.Active,
  },
  {
    id: 4,
    floorId: 3,
    name: 'Floor 3 - Version 1',
    description: 'Main library map for the third floor',
    version: 1,
    width: 1500,
    height: 1000,
    mapData: '{}',
    status: MapStatus.Active,
  },
  {
    id: 5,
    floorId: 1,
    name: 'Floor 1 - Version 3',
    description: 'Previous version of the first floor map',
    version: 3,
    width: 1200,
    height: 800,
    mapData: '{}',
    status: MapStatus.Archived,
  },
]

function ListMap() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | MapStatus>('All')
  const [version, setVersion] = useState('All')

  const filteredMaps = useMemo(() => {
    const searchValue = search.toLowerCase().trim()

    return sampleMaps.filter((map) => {
      const matchesSearch =
        !searchValue ||
        map.id.toString().includes(searchValue) ||
        map.name.toLowerCase().includes(searchValue)

      const matchesStatus =
        status === 'All' || map.status === status

      const matchesVersion =
        version === 'All' ||
        map.version.toString() === version

      return matchesSearch && matchesStatus && matchesVersion
    })
  }, [search, status, version])

  const clearFilters = () => {
    setSearch('')
    setStatus('All')
    setVersion('All')
  }

  const hasFilters =
    search !== '' || status !== 'All' || version !== 'All'

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <MapIcon className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#17181c]">
                  Maps
                </h1>

                <p className="mt-0.5 text-sm text-[#596174]">
                  Manage library maps and their versions.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/maps/create')}
            className="flex h-10 items-center gap-2 rounded-none bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Map
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search maps by ID or Name..."
              className="h-10 w-full rounded-none border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm text-[#17181c] outline-none transition placeholder:text-[#7b8190] focus:border-primary"
            />
          </div>

          <div className="relative w-36">
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value === 'All'
                    ? 'All'
                    : Number(event.target.value) as MapStatus,
                )
              }
              className="h-10 w-full appearance-none rounded-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#17181c] outline-none transition focus:border-primary"
            >
              <option value="All">All Status</option>
              <option value={MapStatus.Active}>Active</option>
              <option value={MapStatus.Archived}>Archived</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          </div>

          <div className="relative w-36">
            <select
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="h-10 w-full appearance-none rounded-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#17181c] outline-none transition focus:border-primary"
            >
              <option value="All">All Versions</option>
              <option value="1">Version 1</option>
              <option value="2">Version 2</option>
              <option value="3">Version 3</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="flex h-10 items-center gap-2 rounded-none border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] transition hover:bg-[#f1eff5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Clear
          </button>

          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-none border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] transition hover:bg-[#f1eff5]"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {/* Result Count */}
        <div className="text-xs text-[#687386]">
          Showing {filteredMaps.length} of {sampleMaps.length} maps
        </div>

        {/* Table */}
        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="w-[90px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Map ID
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Map Name
                  </th>

                  <th className="w-[130px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Floor
                  </th>

                  <th className="w-[110px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Version
                  </th>

                  <th className="w-[150px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredMaps.length > 0 ? (
                  filteredMaps.map((map) => (
                    <tr
                      key={map.id}
                      onClick={() => navigate(`/maps/${map.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          navigate(`/maps/${map.id}`)
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open ${map.name}`}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 transition hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-primary">
                        MAP-{map.id.toString().padStart(4, '0')}
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-[#17181c]">
                            {map.name}
                          </p>

                          <p className="mt-1 truncate text-xs text-[#747b8b]">
                            {map.description}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-[#414856]">
                        Floor {map.floorId}
                      </td>

                      <td className="px-4 py-4 font-medium text-[#414856]">
                        v{map.version}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={map.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-14 text-center"
                    >
                      <MapIcon className="mx-auto h-8 w-8 text-[#89909f]" />

                      <p className="mt-3 font-medium text-[#3f4654]">
                        No maps found
                      </p>

                      <p className="mt-1 text-sm text-[#7b8190]">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t border-[#d9dce5] px-4 py-3">
            <p className="text-xs text-[#687386]">
              Showing {filteredMaps.length} of {sampleMaps.length} maps
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="flex h-7 w-7 items-center justify-center text-[#a3a8b2] disabled:cursor-not-allowed"
              >
                ‹
              </button>

              <button
                type="button"
                className="flex h-7 min-w-7 items-center justify-center bg-primary px-2 text-xs font-medium text-white"
              >
                1
              </button>

              <button
                type="button"
                disabled
                className="flex h-7 w-7 items-center justify-center text-[#a3a8b2] disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: MapStatus }) {
  const config: Record<
    MapStatus,
    {
      label: string
      className: string
    }
  > = {
    [MapStatus.Active]: {
      label: 'Active',
      className: 'bg-[#d9f7e7] text-[#087443]',
    },
    [MapStatus.Archived]: {
      label: 'Archived',
      className: 'bg-[#eef0f3] text-[#596174]',
    },
  }

  const current = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${current.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {current.label}
    </span>
  )
}

export default ListMap
