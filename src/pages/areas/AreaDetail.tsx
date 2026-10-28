import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, MapPin, Pencil, Plus, Search, X } from 'lucide-react'

import { initialAreas } from '../../lib/mapData'
import type { MapArea } from '../../types/map'

type AreaFormData = Omit<MapArea, 'id'>

function AreaDetail() {
  const { id } = useParams()
  const area = id ? initialAreas.find((item) => item.id === Number(id)) : undefined

  if (id) return area ? <AreaDetailView area={area} /> : <AreaNotFound />
  return <AreaList />
}

function AreaList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [areaVersion, setAreaVersion] = useState(0)

  const areas = useMemo(() => {
    const term = search.trim().toLowerCase()
    return initialAreas.filter((area) => !term || area.code.toLowerCase().includes(term) || area.name.toLowerCase().includes(term))
  }, [areaVersion, search])

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="space-y-5">
        <header className="flex w-full flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
            <div><h1 className="text-2xl font-bold tracking-tight">Areas</h1><p className="mt-0.5 text-sm text-[#596174]">Manage library areas and their assigned endpoints.</p></div>
          </div>
          <button type="button" onClick={() => setIsCreateOpen(true)} className="ml-auto flex h-10 shrink-0 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"><Plus className="h-4 w-4" />Create Area</button>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by code or name..." className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#7b8190] focus:border-primary" /></div>
          <button type="button" onClick={() => setSearch('')} disabled={!search} className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50"><X className="h-4 w-4" />Clear</button>
        </div>

        <p className="text-xs text-[#687386]">Showing {areas.length} of {initialAreas.length} areas</p>

        <div className="overflow-hidden border border-[#d9dce5] bg-white"><div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b border-[#d9dce5] bg-[#f5f4f8]"><TableHeader>Code</TableHeader><TableHeader>Name</TableHeader></tr></thead>
            <tbody>{areas.length > 0 ? areas.map((area) => (
              <tr key={area.id} onClick={() => navigate(`/areas/${area.id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/areas/${area.id}`) } }} role="link" tabIndex={0} aria-label={`Open ${area.name}`} className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <td className="px-4 py-4 font-mono text-xs font-semibold text-primary">{area.code}</td><td className="px-4 py-4 font-medium">{area.name}</td>
              </tr>
            )) : <tr><td colSpan={2} className="px-6 py-14 text-center"><MapPin className="mx-auto h-8 w-8 text-[#89909f]" /><p className="mt-3 font-medium text-[#3f4654]">No areas found</p><p className="mt-1 text-sm text-[#7b8190]">Try changing your search.</p></td></tr>}</tbody>
          </table>
        </div></div>
      </div>

      {isCreateOpen && <AreaFormDialog title="Create Area" onClose={() => setIsCreateOpen(false)} onSubmit={(data) => { initialAreas.push({ id: Math.max(0, ...initialAreas.map((area) => area.id)) + 1, ...data }); setAreaVersion((value) => value + 1); setIsCreateOpen(false) }} />}
    </div>
  )
}

function AreaDetailView({ area }: { area: MapArea }) {
  const [isEditing, setIsEditing] = useState(false)
  const [, setVersion] = useState(0)

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <Link to="/areas" className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"><ArrowLeft className="h-4 w-4" />Areas</Link>
      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div><div><p className="text-xs font-medium uppercase text-[#687386]">Area #{area.id}</p><h1 className="text-2xl font-bold tracking-tight">{area.name}</h1></div></div>
        <button type="button" onClick={() => setIsEditing(true)} className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f5f5f7]"><Pencil className="h-4 w-4" />Update Area</button>
      </header>

      <section className="mt-8 max-w-3xl overflow-hidden border border-[#d9dce5] bg-white"><dl className="divide-y divide-[#d9dce5]"><DetailRow label="ID" value={String(area.id)} /><DetailRow label="Endpoint ID" value={String(area.endpoint_id)} /><DetailRow label="Code" value={area.code} /><DetailRow label="Name" value={area.name} /><DetailRow label="Description" value={area.description || '—'} /></dl></section>

      {isEditing && <AreaFormDialog title="Update Area" initial={area} onClose={() => setIsEditing(false)} onSubmit={(data) => { Object.assign(area, data); setVersion((value) => value + 1); setIsEditing(false) }} />}
    </div>
  )
}

function AreaNotFound() {
  return <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8"><h1 className="text-xl font-semibold">Area not found</h1><Link to="/areas" className="mt-4 inline-flex text-sm text-primary hover:underline">Back to Areas</Link></div>
}

function AreaFormDialog({ title, initial, onClose, onSubmit }: { title: string; initial?: AreaFormData | MapArea; onClose: () => void; onSubmit: (data: AreaFormData) => void }) {
  const [form, setForm] = useState<AreaFormData>(() => initial ? { endpoint_id: initial.endpoint_id, code: initial.code, name: initial.name, description: initial.description } : { endpoint_id: 0, code: '', name: '', description: null })
  const inputClassName = 'mt-1.5 h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm outline-none focus:border-primary'

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-labelledby="area-form-title" className="w-full max-w-xl border border-[#d9dce5] bg-white shadow-xl"><header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4"><div><h2 id="area-form-title" className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-[#687386]">Area information</p></div><button type="button" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button></header><form onSubmit={(event) => { event.preventDefault(); onSubmit(form) }} className="space-y-4 px-5 py-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Endpoint ID<input required min={1} type="number" value={form.endpoint_id || ''} onChange={(event) => setForm({ ...form, endpoint_id: Number(event.target.value) })} className={inputClassName} /></label><label className="text-sm font-medium">Code<input required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={inputClassName} /></label><label className="text-sm font-medium sm:col-span-2">Name<input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClassName} /></label><label className="text-sm font-medium sm:col-span-2">Description<textarea maxLength={500} value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value || null })} className={`${inputClassName} h-20 py-2`} /></label></div><footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4"><button type="button" onClick={onClose} className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]">Cancel</button><button type="submit" className="h-10 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">Save</button></footer></form></section></div>
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">{children}</th>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]"><dt className="text-[#687386]">{label}</dt><dd>{value}</dd></div>
}

export default AreaDetail
