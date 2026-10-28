import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Map as MapIcon, Plus, RefreshCw, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { getSavedMaps } from '../../features/maps/api/runtimeApi'
import type { SavedMap } from '../../features/maps/types/runtime'

function ListMap() {
  const navigate = useNavigate()
  const [maps, setMaps] = useState<SavedMap[]>([])
  const [search, setSearch] = useState('')
  const [version, setVersion] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMaps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const savedMaps = await getSavedMaps()
      setMaps(savedMaps.filter((map) => map.data?.format === 'occupancy-grid-v1'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được danh sách map từ robot.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMaps()
  }, [loadMaps])

  const versions = useMemo(
    () => [...new Set(maps.map((map) => map.version))].sort((left, right) => left.localeCompare(right)),
    [maps],
  )

  const filteredMaps = useMemo(() => {
    const searchValue = search.toLowerCase().trim()

    return maps.filter((map) => {
      const matchesSearch =
        !searchValue ||
        map.id.toLowerCase().includes(searchValue) ||
        map.name.toLowerCase().includes(searchValue)
      const matchesVersion = version === 'All' || map.version === version
      return matchesSearch && matchesVersion
    })
  }, [maps, search, version])

  const clearFilters = () => {
    setSearch('')
    setVersion('All')
  }

  const hasFilters = search !== '' || version !== 'All'

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <MapIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#17181c]">Maps</h1>
              <p className="mt-0.5 text-sm text-[#596174]">
                Saved occupancy maps from the real robot.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadMaps()}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-none border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] transition hover:bg-[#f1eff5] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate('/maps/create')}
              className="flex h-10 items-center gap-2 rounded-none bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Map
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search maps by ID or name..."
              className="h-10 w-full rounded-none border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm text-[#17181c] outline-none transition placeholder:text-[#7b8190] focus:border-primary"
            />
          </div>

          <div className="relative w-40">
            <select
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="h-10 w-full appearance-none rounded-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#17181c] outline-none transition focus:border-primary"
            >
              <option value="All">All versions</option>
              {versions.map((item) => <option key={item} value={item}>Version {item}</option>)}
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
        </div>

        <div className="text-xs text-[#687386]">
          Showing {filteredMaps.length} of {maps.length} maps
        </div>

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          {loading ? (
            <div className="px-6 py-14 text-center text-sm text-[#687386]">Loading saved robot maps...</div>
          ) : error ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium text-rose-700">Could not load maps</p>
              <p className="mt-1 text-sm text-[#7b8190]">{error}</p>
              <button
                type="button"
                onClick={() => void loadMaps()}
                className="mt-4 rounded-none bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                    <th className="w-[180px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Map ID</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Map name</th>
                    <th className="w-[170px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Dimensions</th>
                    <th className="w-[120px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Version</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaps.length > 0 ? filteredMaps.map((map) => (
                    <tr
                      key={map.id}
                      onClick={() => navigate(`/maps/${encodeURIComponent(map.id)}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') navigate(`/maps/${encodeURIComponent(map.id)}`)
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open ${map.name}`}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 transition hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-primary" title={map.id}>
                        {map.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#17181c]">{map.name}</p>
                        <p className="mt-1 text-xs text-[#747b8b]">Robot occupancy snapshot</p>
                      </td>
                      <td className="px-4 py-4 text-[#414856]">{map.width} × {map.height} px</td>
                      <td className="px-4 py-4 font-medium text-[#414856]">v{map.version}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-14 text-center">
                        <MapIcon className="mx-auto h-8 w-8 text-[#89909f]" />
                        <p className="mt-3 font-medium text-[#3f4654]">
                          {maps.length === 0 ? 'No saved robot maps' : 'No maps found'}
                        </p>
                        <p className="mt-1 text-sm text-[#7b8190]">
                          {maps.length === 0
                            ? 'Save an occupancy map from the robot to see it here.'
                            : 'Try changing your search or version filter.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[#d9dce5] px-4 py-3">
            <p className="text-xs text-[#687386]">Showing {filteredMaps.length} of {maps.length} maps</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListMap
