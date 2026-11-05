import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Search, Trash2, Warehouse, X } from 'lucide-react'
import { shelfApi } from '@/lib/shelfApi'
import type { AisleRecord, EndpointRecord, ShelfRecord, ShelfWriteRequest } from '@/lib/shelfApi'

type ShelfForm = { aisleId: string; endpointId: string; code: string; name: string }
const emptyForm: ShelfForm = { aisleId: '', endpointId: '', code: '', name: '' }
const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none placeholder:text-[#89909d] focus:border-primary disabled:bg-[#f5f5f7]'
const selectClassName = inputClassName + ' appearance-none'

function ShelfList() {
  const [shelves, setShelves] = useState<ShelfRecord[]>([])
  const [aisles, setAisles] = useState<AisleRecord[]>([])
  const [endpoints, setEndpoints] = useState<EndpointRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [activeShelf, setActiveShelf] = useState<ShelfRecord | null>(null)
  const [form, setForm] = useState<ShelfForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  async function loadData() {
    setLoading(true)
    setLoadError('')
    try {
      const [shelfItems, aisleItems, endpointItems] = await Promise.all([
        shelfApi.list(),
        shelfApi.listAisles(),
        shelfApi.listEndpoints(),
      ])
      setShelves(shelfItems)
      setAisles(aisleItems)
      setEndpoints(endpointItems)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load shelves.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  const aisleNames = useMemo(() => new Map(aisles.map((aisle) => [aisle.id, aisle.code + ' · ' + aisle.name])), [aisles])
  const endpointNames = useMemo(() => new Map(endpoints.map((endpoint) => [endpoint.id, `${endpoint.name} (${endpoint.endpointType})`])), [endpoints])
  const filteredShelves = useMemo(() => {
    const term = search.trim().toLowerCase()
    return shelves.filter((shelf) => [shelf.code, shelf.name, aisleNames.get(shelf.aisleId) ?? ''].some((value) => value.toLowerCase().includes(term)))
  }, [aisleNames, search, shelves])

  function openCreate() {
    setActiveShelf(null)
    setForm({ ...emptyForm, aisleId: aisles[0]?.id ?? '' })
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(shelf: ShelfRecord) {
    setActiveShelf(shelf)
    setForm({ aisleId: shelf.aisleId, endpointId: shelf.endpointId ?? '', code: shelf.code, name: shelf.name })
    setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    const request: ShelfWriteRequest = {
      aisleId: form.aisleId,
      endpointId: form.endpointId || null,
      code: form.code.trim(),
      name: form.name.trim(),
    }
    try {
      const saved = activeShelf ? await shelfApi.update(activeShelf.id, request) : await shelfApi.create(request)
      setShelves((current) => activeShelf ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
      setFormOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this shelf.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(shelf: ShelfRecord) {
    if (!window.confirm('Delete shelf "' + shelf.code + '"?')) return
    setDeletingId(shelf.id)
    setLoadError('')
    try {
      await shelfApi.delete(shelf.id)
      setShelves((current) => current.filter((item) => item.id !== shelf.id))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not delete this shelf.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Warehouse className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold">Shelves</h1><p className="mt-0.5 text-sm text-[#596174]">Library shelf records</p></div></div>
          <button type="button" onClick={openCreate} disabled={!aisles.length} title={!aisles.length ? 'Create an aisle first' : undefined} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"><Plus className="h-4 w-4" />Add shelf</button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Shelf summary">
          <div className="border border-[#d9dce5] bg-white px-4 py-3"><p className="text-xs font-medium uppercase text-[#687386]">Total shelves</p><p className="mt-1 text-xl font-semibold">{shelves.length}</p></div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3"><p className="text-xs font-medium uppercase text-[#687386]">Aisles</p><p className="mt-1 text-xl font-semibold">{aisles.length}</p></div>
          <div className="border border-[#d9dce5] bg-white px-4 py-3"><p className="text-xs font-medium uppercase text-[#687386]">Showing</p><p className="mt-1 text-xl font-semibold">{filteredShelves.length}</p></div>
        </section>

        <section className="space-y-3" aria-label="Shelf records">
          <div className="flex flex-wrap gap-3"><label className="relative min-w-[240px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shelf code, name or aisle" aria-label="Search shelves" className={inputClassName + ' pl-9'} /></label><button type="button" onClick={() => void loadData()} disabled={loading} title="Refresh shelves" aria-label="Refresh shelves" className="inline-flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-3 text-sm font-medium hover:bg-[#f1eff5] disabled:opacity-50"><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />Refresh</button></div>
          {!aisles.length && !loading && !loadError && <p role="status" className="border border-[#ecd9a8] bg-[#fff8e8] px-3 py-2 text-sm text-[#765600]">Create an aisle before adding shelves.</p>}
          {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-[#efc7c4] bg-[#fff1f0] px-4 py-3 text-sm text-[#a12820]"><span>{loadError}</span><button type="button" onClick={() => void loadData()} className="font-semibold underline">Retry</button></div>}
          <div className="overflow-hidden border border-[#d9dce5] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-[11px] font-semibold uppercase text-[#3f4654]"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Aisle</th><th className="px-4 py-3">Navigation endpoint</th><th className="w-24 px-4 py-3 text-right">Actions</th></tr></thead><tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-14 text-center text-[#687386]">Loading shelves...</td></tr> : filteredShelves.length ? filteredShelves.map((shelf) => <tr key={shelf.id} className="border-b border-[#ececf1] last:border-0 hover:bg-[#fafafd]"><td className="px-4 py-3 font-mono text-xs font-semibold">{shelf.code}</td><td className="px-4 py-3 font-medium">{shelf.name}</td><td className="px-4 py-3 text-[#596174]">{aisleNames.get(shelf.aisleId) ?? 'Unknown aisle'}</td><td className="px-4 py-3 text-[#596174]">{shelf.endpointId ? endpointNames.get(shelf.endpointId) ?? 'Unknown endpoint' : 'Not set'}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => openEdit(shelf)} title={'Edit ' + shelf.code} aria-label={'Edit ' + shelf.code} className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void handleDelete(shelf)} disabled={deletingId === shelf.id} title={'Delete ' + shelf.code} aria-label={'Delete ' + shelf.code} className="flex h-8 w-8 items-center justify-center text-[#8d4a46] hover:bg-[#fff1f0] hover:text-[#b42318] disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>) : <tr><td colSpan={5} className="px-4 py-14 text-center text-[#687386]">{loadError ? 'Shelf records unavailable' : 'No shelves found.'}</td></tr>}
          </tbody></table></div><div className="border-t border-[#d9dce5] px-4 py-3 text-xs text-[#687386]">Showing {filteredShelves.length} of {shelves.length} shelves</div></div>
        </section>
      </div>

      {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151922]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setFormOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="shelf-form-title" className="my-auto w-full max-w-xl border border-[#d9dce5] bg-white shadow-xl"><header className="flex items-start justify-between gap-4 border-b border-[#e4e6eb] px-5 py-4"><div><h2 id="shelf-form-title" className="text-lg font-semibold">{activeShelf ? 'Edit shelf' : 'Add shelf'}</h2><p className="mt-1 text-sm text-[#687386]">Shelf record details</p></div><button type="button" onClick={() => setFormOpen(false)} disabled={saving} aria-label="Close form" title="Close" className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"><X className="h-4 w-4" /></button></header><form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 px-5 py-5"><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5 text-sm font-medium">Aisle <span className="text-[#b42318]">*</span><select required value={form.aisleId} onChange={(event) => setForm({ ...form, aisleId: event.target.value })} className={selectClassName}><option value="">Select aisle</option>{aisles.map((aisle) => <option key={aisle.id} value={aisle.id}>{aisle.code} · {aisle.name}</option>)}</select></label><label className="block space-y-1.5 text-sm font-medium">Shelf code <span className="text-[#b42318]">*</span><input required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={inputClassName} /></label><label className="block space-y-1.5 text-sm font-medium">Navigation endpoint<select value={form.endpointId} onChange={(event) => setForm({ ...form, endpointId: event.target.value })} className={selectClassName}><option value="">No endpoint</option>{endpoints.map((endpoint) => <option key={endpoint.id} value={endpoint.id}>{endpoint.name} · {endpoint.endpointType} · {endpoint.positionX.toFixed(2)}, {endpoint.positionY.toFixed(2)}{endpoint.isActive ? '' : ' · inactive'}</option>)}</select><span className="text-xs font-normal text-[#687386]">Books assigned to this shelf will navigate to this endpoint.</span></label><label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Name <span className="text-[#b42318]">*</span><input required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClassName} /></label></div>{formError && <p role="alert" className="border border-[#efc7c4] bg-[#fff1f0] px-3 py-2 text-sm text-[#a12820]">{formError}</p>}<footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4"><button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="h-10 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f5f5f7]">Cancel</button><button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{saving && <RefreshCw className="h-4 w-4 animate-spin" />}{saving ? 'Saving...' : activeShelf ? 'Save changes' : 'Create shelf'}</button></footer></form></section></div>}
    </div>
  )
}

export default ShelfList
