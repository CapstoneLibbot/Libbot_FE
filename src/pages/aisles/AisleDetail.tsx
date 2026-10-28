import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ChevronDown, Pencil, Plus, Route, Search, X } from 'lucide-react'

import { initialAisles, initialFloors, initialShelves } from '../../lib/mapData'

function AisleDetail() {
  const { id } = useParams()
  const aisle = id
    ? initialAisles.find((item) => item.id === Number(id))
    : undefined

  if (id) return aisle ? <AisleDetailView aisle={aisle} /> : <AisleNotFound />

  return <AisleList />
}

function AisleList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [floorId, setFloorId] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [, setVersion] = useState(0)
  const floorsById = useMemo(
    () => new Map(initialFloors.map((floor) => [floor.id, floor])),
    [],
  )

  const aisles = useMemo(() => {
    const term = search.trim().toLowerCase()
    return initialAisles.filter((item) => {
      const matchesSearch = !term || item.code.toLowerCase().includes(term) || item.name.toLowerCase().includes(term)
      const matchesStatus = status === 'ALL' || item.status === status
      const matchesFloor = floorId === 'ALL' || item.floor_id === Number(floorId)
      return matchesSearch && matchesStatus && matchesFloor
    })
  }, [floorId, search, status])

  const clearFilters = () => {
    setSearch('')
    setStatus('ALL')
    setFloorId('ALL')
  }
  const hasFilters = search !== '' || status !== 'ALL' || floorId !== 'ALL'

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
            <Route className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Aisles</h1>
            <p className="mt-0.5 text-sm text-[#596174]">Manage library aisles and their floor assignments.</p>
          </div></div><button type="button" onClick={() => setCreateOpen(true)} className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Create Aisle</button>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by code or name..." className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#7b8190] focus:border-primary" />
          </div>
          <SelectFilter value={status} onChange={setStatus} ariaLabel="Filter by status">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </SelectFilter>
          <SelectFilter value={floorId} onChange={setFloorId} ariaLabel="Filter by floor">
            <option value="ALL">All Floors</option>
            {initialFloors.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
          </SelectFilter>
          <button type="button" onClick={clearFilters} disabled={!hasFilters} className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50">
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        <p className="text-xs text-[#687386]">Showing {aisles.length} of {initialAisles.length} aisles</p>

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead><tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                <TableHeader>Code</TableHeader><TableHeader>Name</TableHeader><TableHeader>Floor</TableHeader><TableHeader className="w-[150px]">Status</TableHeader>
              </tr></thead>
              <tbody>
                {aisles.length > 0 ? aisles.map((item) => (
                  <tr key={item.id} onClick={() => navigate(`/aisles/${item.id}`)} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/aisles/${item.id}`)
                    }
                  }} role="link" tabIndex={0} aria-label={`Open ${item.name}`} className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-primary">{item.code}</td>
                    <td className="px-4 py-4 font-medium">{item.name}</td>
                    <td className="px-4 py-4 text-[#596174]">{floorsById.get(item.floor_id)?.name || 'Unknown floor'}</td>
                    <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  </tr>
                )) : <EmptyTable colSpan={4} title="No aisles found" description="Try changing your search or filters." />}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {createOpen && <AisleFormDialog title="Create Aisle" onClose={() => setCreateOpen(false)} onSubmit={(data) => { initialAisles.push({ id: Math.max(0, ...initialAisles.map((item) => item.id)) + 1, ...data }); setVersion((value) => value + 1); setCreateOpen(false) }} />}
    </div>
  )
}

function AisleDetailView({ aisle }: { aisle: (typeof initialAisles)[number] }) {
  const [editing, setEditing] = useState(false)
  const [addingShelf, setAddingShelf] = useState(false)
  const [, setVersion] = useState(0)
  const floor = initialFloors.find((item) => item.id === aisle.floor_id)
  const shelves = initialShelves.filter((shelf) => shelf.aisle_id === aisle.id)

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <Link to="/aisles" className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"><ArrowLeft className="h-4 w-4" />Aisles</Link>
      <header className="mt-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Route className="h-5 w-5" /></div>
        <div><p className="text-xs font-medium uppercase text-[#687386]">Aisle #{aisle.id}</p><h1 className="text-2xl font-bold tracking-tight">{aisle.name}</h1></div>
      </div><button type="button" onClick={() => setEditing(true)} className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium"><Pencil className="h-4 w-4" />Update Aisle</button></header>

      <section className="mt-8 max-w-3xl overflow-hidden border border-[#d9dce5] bg-white">
        <dl className="divide-y divide-[#d9dce5]">
          <DetailRow label="ID" value={aisle.id.toString()} />
          <DetailRow label="Endpoint A ID" value={aisle.endpointA_id.toString()} />
          <DetailRow label="Endpoint B ID" value={aisle.endpointB_id.toString()} />
          <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-[#687386]">Floor</dt>
            <dd>{floor ? <Link to={`/floors/${floor.id}`} className="text-primary hover:underline">{floor.name} ({floor.code})</Link> : `Floor #${aisle.floor_id}`}</dd>
          </div>
          <DetailRow label="Code" value={aisle.code} />
          <DetailRow label="Name" value={aisle.name} />
          <DetailRow label="Description" value={aisle.description || '—'} />
          <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]"><dt className="text-[#687386]">Status</dt><dd><StatusBadge status={aisle.status} /></dd></div>
        </dl>
      </section>

      <section className="mt-9">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Route className="h-5 w-5 text-primary" /><div><h2 className="text-lg font-semibold">Shelves</h2><p className="mt-0.5 text-sm text-[#687386]">{shelves.length} shelf{shelves.length === 1 ? '' : 's'} belonging to this aisle.</p></div></div><button type="button" onClick={() => setAddingShelf(true)} className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Create Shelf</button></div>
        <div className="mt-4 overflow-hidden border border-[#d9dce5] bg-white"><div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-[#d9dce5] bg-[#f5f4f8]"><TableHeader>Code</TableHeader><TableHeader>Name</TableHeader><TableHeader className="w-[150px]">Status</TableHeader></tr></thead>
            <tbody>{shelves.length > 0 ? shelves.map((shelf) => (
              <tr key={shelf.id} className="border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc]">
                <td className="px-4 py-4 font-mono text-xs font-semibold"><Link to={`/shelves/${shelf.id}`} className="text-primary hover:underline">{shelf.code}</Link></td>
                <td className="px-4 py-4 font-medium"><Link to={`/shelves/${shelf.id}`} className="text-[#17181c] hover:text-primary hover:underline">{shelf.name}</Link></td>
                <td className="px-4 py-4"><StatusBadge status={shelf.status} /></td>
              </tr>
            )) : <EmptyTable colSpan={3} title="No shelves found" description="This aisle does not have any shelves yet." />}</tbody>
          </table>
        </div></div>
      </section>
      {editing && <AisleFormDialog title="Update Aisle" initial={aisle} onClose={() => setEditing(false)} onSubmit={(data) => { Object.assign(aisle, data); setVersion((value) => value + 1); setEditing(false) }} />}
      {addingShelf && <ShelfForAisleDialog aisleId={aisle.id} onClose={() => setAddingShelf(false)} onSubmit={(data) => { initialShelves.push({ id: Math.max(0, ...initialShelves.map((item) => item.id)) + 1, aisle_id: aisle.id, ...data }); setVersion((value) => value + 1); setAddingShelf(false) }} />}
    </div>
  )
}

function AisleNotFound() {
  return <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8"><h1 className="text-xl font-semibold">Aisle not found</h1><Link to="/aisles" className="mt-4 inline-flex text-sm text-primary hover:underline">Back to Aisles</Link></div>
}

type AisleFormData = { endpointA_id: number; endpointB_id: number; floor_id: number; code: string; name: string; description: string | null; status: string }
function AisleFormDialog({ title, initial, onClose, onSubmit }: { title: string; initial?: AisleFormData; onClose: () => void; onSubmit: (data: AisleFormData) => void }) {
  const [form, setForm] = useState<AisleFormData>(initial || { endpointA_id: 0, endpointB_id: 0, floor_id: initialFloors[0]?.id || 0, code: '', name: '', description: null, status: 'ACTIVE' })
  const input = 'mt-1.5 h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm'
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"><section className="w-full max-w-xl border border-[#d9dce5] bg-white shadow-xl"><header className="flex justify-between border-b border-[#e4e6eb] p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={onClose}><X className="h-4 w-4" /></button></header><form onSubmit={(event) => { event.preventDefault(); if (form.endpointA_id !== form.endpointB_id) onSubmit(form) }} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><label>Endpoint A ID<input required min={1} type="number" value={form.endpointA_id || ''} onChange={(event) => setForm({ ...form, endpointA_id: Number(event.target.value) })} className={input} /></label><label>Endpoint B ID<input required min={1} type="number" value={form.endpointB_id || ''} onChange={(event) => setForm({ ...form, endpointB_id: Number(event.target.value) })} className={input} /></label><label>Floor<select value={form.floor_id} onChange={(event) => setForm({ ...form, floor_id: Number(event.target.value) })} className={input}>{initialFloors.map((floor) => <option key={floor.id} value={floor.id}>{floor.code} · {floor.name}</option>)}</select></label><label>Code<input required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={input} /></label><label className="sm:col-span-2">Name<input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={input} /></label><label className="sm:col-span-2">Description<textarea maxLength={500} value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value || null })} className={`${input} h-20 py-2`} /></label><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={input}><option>ACTIVE</option><option>INACTIVE</option><option>MAINTENANCE</option></select></label></div><footer className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="h-10 border px-4">Cancel</button><button className="h-10 bg-primary px-4 text-white">Save</button></footer></form></section></div>
}
function ShelfForAisleDialog({ aisleId, onClose, onSubmit }: { aisleId: number; onClose: () => void; onSubmit: (data: { endpoint_id: number; code: string; name: string; description: string | null; status: 1 | 2 | 3 }) => void }) { const [data, setData] = useState({ endpoint_id: 0, code: '', name: '', description: null as string | null, status: 1 as 1 | 2 | 3 }); const input = 'mt-1.5 h-10 w-full border border-[#d7d9e2] px-3'; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4"><section className="w-full max-w-lg bg-white shadow-xl"><header className="flex justify-between border-b p-5"><h2 className="text-lg font-semibold">Create Shelf</h2><button type="button" onClick={onClose}><X className="h-4 w-4" /></button></header><form onSubmit={(event) => { event.preventDefault(); onSubmit(data) }} className="space-y-4 p-5"><p className="text-sm text-[#687386]">Aisle #{aisleId} is assigned automatically.</p><label>Endpoint ID<input required min={1} type="number" value={data.endpoint_id || ''} onChange={(event) => setData({ ...data, endpoint_id: Number(event.target.value) })} className={input} /></label><label>Code<input required value={data.code} onChange={(event) => setData({ ...data, code: event.target.value })} className={input} /></label><label>Name<input required value={data.name} onChange={(event) => setData({ ...data, name: event.target.value })} className={input} /></label><label>Description<textarea value={data.description || ''} onChange={(event) => setData({ ...data, description: event.target.value || null })} className={`${input} h-20 py-2`} /></label><label>Status<select value={data.status} onChange={(event) => setData({ ...data, status: Number(event.target.value) as 1 | 2 | 3 })} className={input}><option value={1}>Active</option><option value={2}>Inactive</option><option value={3}>Maintenance</option></select></label><footer className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="h-10 border px-4">Cancel</button><button className="h-10 bg-primary px-4 text-white">Save</button></footer></form></section></div> }

function SelectFilter({ value, onChange, ariaLabel, children }: { value: string; onChange: (value: string) => void; ariaLabel: string; children: ReactNode }) {
  return <div className="relative w-40"><select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel} className="h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm outline-none focus:border-primary">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" /></div>
}

function TableHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654] ${className}`}>{children}</th>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]"><dt className="text-[#687386]">{label}</dt><dd>{value}</dd></div>
}

function EmptyTable({ colSpan, title, description }: { colSpan: number; title: string; description: string }) {
  return <tr><td colSpan={colSpan} className="px-6 py-14 text-center"><Route className="mx-auto h-8 w-8 text-[#89909f]" /><p className="mt-3 font-medium text-[#3f4654]">{title}</p><p className="mt-1 text-sm text-[#7b8190]">{description}</p></td></tr>
}

function StatusBadge({ status }: { status: string | number }) {
  const normalized = typeof status === 'number' ? ({ 1: 'ACTIVE', 2: 'INACTIVE', 3: 'MAINTENANCE' }[status] || 'INACTIVE') : status
  const styles: Record<string, string> = { ACTIVE: 'bg-[#d9f7e7] text-[#087443]', INACTIVE: 'bg-[#eef0f3] text-[#596174]', MAINTENANCE: 'bg-[#fff0d8] text-[#a65000]' }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[normalized] || styles.INACTIVE}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{normalized.charAt(0) + normalized.slice(1).toLowerCase()}</span>
}

export default AisleDetail
