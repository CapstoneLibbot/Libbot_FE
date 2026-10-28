import { useMemo, useState } from 'react'
import { ChevronDown, Layers3, Plus, Search, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { initialFloors } from '../../lib/mapData'

function FloorList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [floorVersion, setFloorVersion] = useState(0)

  const floors = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return initialFloors.filter((floor) => {
      const matchesSearch =
        !searchValue ||
        floor.code.toLowerCase().includes(searchValue) ||
        floor.name.toLowerCase().includes(searchValue)
      const matchesStatus = status === 'ALL' || floor.status === status

      return matchesSearch && matchesStatus
    })
  }, [floorVersion, search, status])

  const hasFilters = search !== '' || status !== 'ALL'

  const clearFilters = () => {
    setSearch('')
    setStatus('ALL')
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="space-y-5">
        <header className="flex w-full flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Layers3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#17181c]">Floors</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Manage library floors and their availability.</p>
            </div>
          </div>
          <button type="button" onClick={() => setCreateOpen(true)} className="ml-auto flex h-10 shrink-0 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"><Plus className="h-4 w-4" />Create Floor</button>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code or name..."
              className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm text-[#17181c] outline-none placeholder:text-[#7b8190] focus:border-primary"
            />
          </div>

          <div className="relative w-36">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#17181c] outline-none focus:border-primary"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        <p className="text-xs text-[#687386]">
          Showing {floors.length} of {initialFloors.length} floors
        </p>

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Code
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Name
                  </th>
                  <th className="w-[150px] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {floors.length > 0 ? (
                  floors.map((floor) => (
                    <tr
                      key={floor.id}
                      onClick={() => navigate(`/floors/${floor.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/floors/${floor.id}`)
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open ${floor.name}`}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-semibold">
                        <Link
                          to={`/floors/${floor.id}`}
                          className="text-primary hover:underline"
                        >
                          {floor.code}
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-medium">
                        <Link
                          to={`/floors/${floor.id}`}
                          className="text-[#17181c] hover:text-primary hover:underline"
                        >
                          {floor.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={floor.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-14 text-center">
                      <Layers3 className="mx-auto h-8 w-8 text-[#89909f]" />
                      <p className="mt-3 font-medium text-[#3f4654]">
                        No floors found
                      </p>
                      <p className="mt-1 text-sm text-[#7b8190]">
                        Try changing your search or filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {createOpen && <FloorFormDialog title="Create Floor" onClose={() => setCreateOpen(false)} onSubmit={(data) => { initialFloors.push({ id: Math.max(0, ...initialFloors.map((floor) => floor.id)) + 1, ...data }); setFloorVersion((value) => value + 1); setCreateOpen(false) }} />}
    </div>
  )
}

export type FloorFormData = { code: string; name: string; description: string | null; status: string }
export function FloorFormDialog({ title, initial, onClose, onSubmit }: { title: string; initial?: FloorFormData; onClose: () => void; onSubmit: (data: FloorFormData) => void }) { const [data, setData] = useState<FloorFormData>(initial || { code: '', name: '', description: null, status: 'ACTIVE' }); const input = 'mt-1.5 h-10 w-full border border-[#d7d9e2] px-3'; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"><section className="w-full max-w-lg bg-white shadow-xl"><header className="flex justify-between border-b p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={onClose}><X className="h-4 w-4" /></button></header><form onSubmit={(event) => { event.preventDefault(); onSubmit(data) }} className="space-y-4 p-5"><label>Code<input required maxLength={50} value={data.code} onChange={(event) => setData({ ...data, code: event.target.value })} className={input} /></label><label>Name<input required maxLength={100} value={data.name} onChange={(event) => setData({ ...data, name: event.target.value })} className={input} /></label><label>Description<textarea maxLength={500} value={data.description || ''} onChange={(event) => setData({ ...data, description: event.target.value || null })} className={`${input} h-20 py-2`} /></label><label>Status<select value={data.status} onChange={(event) => setData({ ...data, status: event.target.value })} className={input}><option>ACTIVE</option><option>INACTIVE</option><option>MAINTENANCE</option></select></label><footer className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="h-10 border px-4">Cancel</button><button className="h-10 bg-primary px-4 text-white">Save</button></footer></form></section></div> }

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isActive ? 'bg-[#d9f7e7] text-[#087443]' : 'bg-[#eef0f3] text-[#596174]'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export default FloorList
