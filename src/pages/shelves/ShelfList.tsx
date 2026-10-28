import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Search, Warehouse, X } from 'lucide-react'
import { useNavigate } from 'react-router'

import { initialAisles, initialShelves } from '../../lib/mapData'

function ShelfList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | 1 | 2 | 3>('ALL')
  const [aisleId, setAisleId] = useState('ALL')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [shelves, setShelves] = useState(initialShelves)
  const aisleNames = useMemo(
    () => new Map(initialAisles.map((aisle) => [aisle.id, aisle.name])),
    [],
  )

  const filteredShelves = useMemo(() => {
    const term = search.trim().toLowerCase()
    return shelves.filter((shelf) => {
      const matchesSearch = !term || shelf.code.toLowerCase().includes(term) || shelf.name.toLowerCase().includes(term)
      return matchesSearch && (status === 'ALL' || shelf.status === status) && (aisleId === 'ALL' || shelf.aisle_id === Number(aisleId))
    })
  }, [aisleId, search, shelves, status])

  const clearFilters = () => {
    setSearch('')
    setStatus('ALL')
    setAisleId('ALL')
  }
  const hasFilters = search !== '' || status !== 'ALL' || aisleId !== 'ALL'

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10"><Warehouse className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold tracking-tight">Shelves</h1><p className="mt-0.5 text-sm text-[#596174]">Manage library shelves and their aisle assignments.</p></div></div>
          <button type="button" onClick={() => setIsCreateOpen(true)} className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"><Plus className="h-4 w-4" />Create Shelf</button>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by code or name..." className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#7b8190] focus:border-primary" /></div>
          <div className="relative w-40"><select value={status} onChange={(event) => setStatus(event.target.value === 'ALL' ? 'ALL' : Number(event.target.value) as 1 | 2 | 3)} className="h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm outline-none focus:border-primary"><option value="ALL">All Status</option><option value={1}>Active</option><option value={2}>Inactive</option><option value={3}>Maintenance</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" /></div>
          <div className="relative w-48"><select value={aisleId} onChange={(event) => setAisleId(event.target.value)} className="h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm outline-none focus:border-primary"><option value="ALL">All Aisles</option>{initialAisles.map((aisle) => <option key={aisle.id} value={aisle.id}>{aisle.code} · {aisle.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" /></div>
          <button type="button" onClick={clearFilters} disabled={!hasFilters} className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50"><X className="h-4 w-4" />Clear</button>
        </div>

        <p className="text-xs text-[#687386]">Showing {filteredShelves.length} of {shelves.length} shelves</p>

        <div className="overflow-hidden border border-[#d9dce5] bg-white"><div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead><tr className="border-b border-[#d9dce5] bg-[#f5f4f8]"><Header>Code</Header><Header>Name</Header><Header>Aisle</Header><Header className="w-[150px]">Status</Header></tr></thead>
            <tbody>{filteredShelves.length > 0 ? filteredShelves.map((shelf) => (
              <tr key={shelf.id} onClick={() => navigate(`/shelves/${shelf.id}`)} onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/shelves/${shelf.id}`) }
              }} role="link" tabIndex={0} aria-label={`Open ${shelf.name}`} className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <td className="px-4 py-4 font-mono text-xs font-semibold text-primary">{shelf.code}</td><td className="px-4 py-4 font-medium">{shelf.name}</td><td className="px-4 py-4 text-[#596174]">{aisleNames.get(shelf.aisle_id) || 'Unknown aisle'}</td><td className="px-4 py-4"><StatusBadge status={shelf.status} /></td>
              </tr>
            )) : <tr><td colSpan={4} className="px-6 py-14 text-center"><Warehouse className="mx-auto h-8 w-8 text-[#89909f]" /><p className="mt-3 font-medium text-[#3f4654]">No shelves found</p><p className="mt-1 text-sm text-[#7b8190]">Try changing your search or filter.</p></td></tr>}</tbody>
          </table>
        </div></div>
      </div>
      {isCreateOpen && <ShelfFormDialog title="Create Shelf" onClose={() => setIsCreateOpen(false)} onSubmit={(data) => { const item = { id: Math.max(0, ...initialShelves.map((shelf) => shelf.id)) + 1, ...data }; initialShelves.push(item); setShelves([...initialShelves]); setIsCreateOpen(false) }} />}
    </div>
  )
}

export type ShelfFormData = { endpoint_id: number; aisle_id: number; code: string; name: string; description: string | null; status: 1 | 2 | 3 }
export function ShelfFormDialog({ title, initial, onClose, onSubmit }: { title: string; initial?: ShelfFormData; onClose: () => void; onSubmit: (data: ShelfFormData) => void }) {
  const [form, setForm] = useState<ShelfFormData>(initial || { endpoint_id: 0, aisle_id: initialAisles[0]?.id || 0, code: '', name: '', description: null, status: 1 })
  const input = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm outline-none focus:border-primary'
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-labelledby="shelf-form-title" className="w-full max-w-xl border border-[#d9dce5] bg-white shadow-xl"><header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4"><div><h2 id="shelf-form-title" className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-[#687386]">Shelf information</p></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"><X className="h-4 w-4" /></button></header><form onSubmit={(event) => { event.preventDefault(); onSubmit(form) }} className="space-y-4 px-5 py-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Endpoint ID<input required min={1} type="number" value={form.endpoint_id || ''} onChange={(event) => setForm({ ...form, endpoint_id: Number(event.target.value) })} className={`${input} mt-1.5`} /></label><label className="text-sm font-medium">Aisle<select required value={form.aisle_id} onChange={(event) => setForm({ ...form, aisle_id: Number(event.target.value) })} className={`${input} mt-1.5`}>{initialAisles.map((aisle) => <option key={aisle.id} value={aisle.id}>{aisle.code} · {aisle.name}</option>)}</select></label><label className="text-sm font-medium">Code<input required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={`${input} mt-1.5`} /></label><label className="text-sm font-medium">Name<input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`${input} mt-1.5`} /></label><label className="text-sm font-medium sm:col-span-2">Description<textarea maxLength={500} value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value || null })} className={`${input} mt-1.5 h-20 py-2`} /></label><label className="text-sm font-medium">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: Number(event.target.value) as 1 | 2 | 3 })} className={`${input} mt-1.5`}><option value={1}>Active</option><option value={2}>Inactive</option><option value={3}>Maintenance</option></select></label></div><footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4"><button type="button" onClick={onClose} className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]">Cancel</button><button type="submit" className="h-10 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">Save</button></footer></form></section></div>
}

function Header({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654] ${className}`}>{children}</th> }

export function StatusBadge({ status }: { status: 1 | 2 | 3 }) {
  const config = {
    1: { label: 'Active', className: 'bg-[#d9f7e7] text-[#087443]' },
    2: { label: 'Inactive', className: 'bg-[#eef0f3] text-[#596174]' },
    3: { label: 'Maintenance', className: 'bg-[#fff0d8] text-[#a65000]' },
  } as const
  const current = config[status]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${current.className}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{current.label}</span>
}

export default ShelfList
