import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, BookOpen, LibraryBig, MapPin, Pencil, Plus, Target, X } from 'lucide-react'

import { initialAisles, initialBookCategories, initialBookItems, initialBooks, initialShelfLevels, initialShelves } from '../../lib/mapData'
import type { MapShelf } from '../../types/map'

type ShelfFormData = Pick<MapShelf, 'endpoint_id' | 'code' | 'name' | 'description' | 'status'>

function ShelfDetail() {
  const { id } = useParams()
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [isShelfEditorOpen, setIsShelfEditorOpen] = useState(false)
  const [editingLevelId, setEditingLevelId] = useState<number | 'CREATE' | null>(null)
  const [, setVersion] = useState(0)
  const shelf = id ? initialShelves.find((item) => item.id === Number(id)) : undefined
  if (!shelf) return <NotFound />

  const aisle = initialAisles.find((item) => item.id === shelf.aisle_id)
  const levels = initialShelfLevels.filter((level) => level.shelf_id === shelf.id).sort((a, b) => a.level_number - b.level_number)
  const levelIds = new Set(levels.map((level) => level.id))
  const expectedItems = initialBookItems.filter((item) => levelIds.has(item.expected_shelf_level_id))
  const misplacedItems = initialBookItems.filter((item) =>
    item.current_shelf_level_id !== null &&
    item.current_shelf_level_id !== item.expected_shelf_level_id &&
    (levelIds.has(item.expected_shelf_level_id) || levelIds.has(item.current_shelf_level_id)),
  )
  const missingItems = expectedItems.filter((item) => item.current_shelf_level_id === null)
  const correctItems = expectedItems.filter((item) => item.current_shelf_level_id === item.expected_shelf_level_id)

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <Link to="/shelves" className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"><ArrowLeft className="h-4 w-4" />Shelves</Link>
      <header className="mt-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><LibraryBig className="h-5 w-5" /></div><div><p className="text-xs font-medium uppercase text-[#687386]">Shelf #{shelf.id}</p><h1 className="text-2xl font-bold tracking-tight">{shelf.name}</h1></div></div><button type="button" onClick={() => setIsShelfEditorOpen(true)} className="flex h-10 items-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium hover:bg-[#f1eff5]"><Pencil className="h-4 w-4" />Update Shelf</button></header>

      <section className="mt-8 max-w-3xl overflow-hidden border border-[#d9dce5] bg-white"><dl className="divide-y divide-[#d9dce5]">
        <DetailRow label="ID" value={shelf.id.toString()} /><DetailRow label="Endpoint ID" value={shelf.endpoint_id.toString()} />
        <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]"><dt className="text-[#687386]">Aisle</dt><dd>{aisle ? <Link to={`/aisles/${aisle.id}`} className="text-primary hover:underline">{aisle.name} ({aisle.code})</Link> : `Aisle #${shelf.aisle_id}`}</dd></div>
        <DetailRow label="Code" value={shelf.code} /><DetailRow label="Name" value={shelf.name} /><DetailRow label="Description" value={shelf.description || '—'} />
        <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]"><dt className="text-[#687386]">Status</dt><dd><StatusBadge status={shelf.status} /></dd></div>
      </dl></section>

      <section className="mt-9">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><div><h2 className="text-lg font-semibold">Shelf levels</h2><p className="mt-0.5 text-sm text-[#687386]">Inventory placement overview by shelf level.</p></div></div><button type="button" onClick={() => setEditingLevelId('CREATE')} className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"><Plus className="h-4 w-4" />Create Shelf Level</button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Shelf inventory summary">
          <SummaryCard label="Correctly placed" value={correctItems.length} tone="text-[#087443]" /><SummaryCard label="Misplaced" value={misplacedItems.length} tone="text-[#a65000]" /><SummaryCard label="Missing" value={missingItems.length} tone="text-[#b42318]" />
        </div>

        <div className="mt-4 overflow-hidden border border-[#d9dce5] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b border-[#d9dce5] bg-[#f5f4f8]"><Header>Level</Header><Header>Name</Header><Header>Book placement chart</Header><Header className="w-[130px]">Status</Header></tr></thead>
          <tbody>{levels.length > 0 ? levels.map((level) => <ShelfLevelRow key={level.id} level={level} onSelect={() => setSelectedLevelId(level.id)} onEdit={() => setEditingLevelId(level.id)} />) : <tr><td colSpan={4} className="px-6 py-14 text-center"><BookOpen className="mx-auto h-8 w-8 text-[#89909f]" /><p className="mt-3 font-medium text-[#3f4654]">No shelf levels found</p><p className="mt-1 text-sm text-[#7b8190]">This shelf does not have any levels yet.</p></td></tr>}</tbody>
        </table></div></div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#596174]"><Legend color="bg-[#22a06b]" label="Correct: expected level = current level" /><Legend color="bg-[#e8871e]" label="Misplaced: expected and current levels differ" /><Legend color="bg-[#d92d20]" label="Missing: current level is empty" /></div>
      </section>
      {selectedLevelId && <ShelfLevelBooksDialog levelId={selectedLevelId} onClose={() => setSelectedLevelId(null)} />}
      {isShelfEditorOpen && <ShelfFormDialog initial={shelf} onClose={() => setIsShelfEditorOpen(false)} onSubmit={(data) => { Object.assign(shelf, data); setVersion((value) => value + 1); setIsShelfEditorOpen(false) }} />}
      {editingLevelId !== null && <ShelfLevelFormDialog shelfId={shelf.id} level={editingLevelId === 'CREATE' ? undefined : initialShelfLevels.find((level) => level.id === editingLevelId)} onClose={() => setEditingLevelId(null)} onSubmit={(data) => { if (editingLevelId === 'CREATE') initialShelfLevels.push({ id: Math.max(0, ...initialShelfLevels.map((level) => level.id)) + 1, shelf_id: shelf.id, ...data }); else { const level = initialShelfLevels.find((item) => item.id === editingLevelId); if (level) Object.assign(level, data) }; setVersion((value) => value + 1); setEditingLevelId(null) }} />}
    </div>
  )
}

function StatusBadge({ status }: { status: MapShelf['status'] }) {
  const normalized = ({ 1: 'ACTIVE', 2: 'INACTIVE', 3: 'MAINTENANCE' } as const)[status]
  const styles = {
    ACTIVE: 'bg-[#d9f7e7] text-[#087443]',
    INACTIVE: 'bg-[#eef0f3] text-[#596174]',
    MAINTENANCE: 'bg-[#fff0d8] text-[#a65000]',
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[normalized]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{normalized.charAt(0) + normalized.slice(1).toLowerCase()}</span>
}

function ShelfFormDialog({ initial, onClose, onSubmit }: { initial: MapShelf; onClose: () => void; onSubmit: (data: ShelfFormData) => void }) {
  const [form, setForm] = useState<ShelfFormData>({
    endpoint_id: initial.endpoint_id,
    code: initial.code,
    name: initial.name,
    description: initial.description,
    status: initial.status,
  })
  const input = 'mt-1.5 h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(form)
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-labelledby="shelf-form-title" className="w-full max-w-lg border border-[#d9dce5] bg-white shadow-xl"><header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4"><h2 id="shelf-form-title" className="text-lg font-semibold">Update Shelf</h2><button type="button" onClick={onClose} aria-label="Close shelf form" className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"><X className="h-4 w-4" /></button></header><form onSubmit={handleSubmit} className="space-y-4 p-5"><label className="block text-sm font-medium">Endpoint ID<input required min={1} type="number" value={form.endpoint_id} onChange={(event) => setForm({ ...form, endpoint_id: Number(event.target.value) })} className={input} /></label><label className="block text-sm font-medium">Code<input required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={input} /></label><label className="block text-sm font-medium">Name<input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={input} /></label><label className="block text-sm font-medium">Description<textarea maxLength={500} value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value || null })} className={`${input} h-20 py-2`} /></label><label className="block text-sm font-medium">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: Number(event.target.value) as MapShelf['status'] })} className={input}><option value={1}>Active</option><option value={2}>Inactive</option><option value={3}>Maintenance</option></select></label><footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4"><button type="button" onClick={onClose} className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]">Cancel</button><button type="submit" className="h-10 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">Save</button></footer></form></section></div>
}

function ShelfLevelRow({ level, onSelect, onEdit }: { level: (typeof initialShelfLevels)[number]; onSelect: () => void; onEdit: () => void }) {
  const expected = initialBookItems.filter((item) => item.expected_shelf_level_id === level.id)
  const correct = expected.filter((item) => item.current_shelf_level_id === level.id).length
  const misplacedOut = expected.filter((item) => item.current_shelf_level_id !== null && item.current_shelf_level_id !== level.id).length
  const missing = expected.filter((item) => item.current_shelf_level_id === null).length
  const misplacedIn = initialBookItems.filter((item) => item.current_shelf_level_id === level.id && item.expected_shelf_level_id !== level.id).length
  const total = Math.max(expected.length, 1)

  return <tr onClick={onSelect} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect() } }} role="button" tabIndex={0} aria-label={`View books in level ${level.level_number}`} className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><td className="px-4 py-4 font-semibold text-primary">Level {level.level_number}</td><td className="px-4 py-4 font-medium">{level.name}</td><td className="px-4 py-4"><div className="min-w-[280px]"><div className="flex h-3 overflow-hidden rounded-full bg-[#eef0f3]" aria-label={`${correct} correct, ${misplacedOut} misplaced, ${missing} missing books`}><ChartSegment value={correct} total={total} className="bg-[#22a06b]" /><ChartSegment value={misplacedOut} total={total} className="bg-[#e8871e]" /><ChartSegment value={missing} total={total} className="bg-[#d92d20]" /></div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"><span className="text-[#087443]">{correct} correct</span><span className="text-[#a65000]">{misplacedOut} misplaced</span><span className="text-[#b42318]">{missing} missing</span>{misplacedIn > 0 && <span className="text-[#a65000]">+{misplacedIn} misplaced here</span>}</div></div></td><td className="px-4 py-4"><div className="flex items-center justify-between gap-2"><StatusBadge status={level.status} /><button type="button" onClick={(event) => { event.stopPropagation(); onEdit() }} aria-label={`Edit level ${level.level_number}`} className="flex h-8 w-8 items-center justify-center text-[#596174] hover:bg-[#eff5ff] hover:text-primary"><Pencil className="h-4 w-4" /></button></div></td></tr>
}

function ShelfLevelBooksDialog({ levelId, onClose }: { levelId: number; onClose: () => void }) {
  const level = initialShelfLevels.find((item) => item.id === levelId)
  const bookById = new Map(initialBooks.map((book) => [book.id, book]))
  const categoryById = new Map(initialBookCategories.map((category) => [category.id, category.name]))
  const levelById = new Map(initialShelfLevels.map((shelfLevel) => [shelfLevel.id, shelfLevel]))
  const shelfById = new Map(initialShelves.map((shelf) => [shelf.id, shelf]))
  const items = initialBookItems.filter((item) => item.expected_shelf_level_id === levelId || item.current_shelf_level_id === levelId)

  if (!level) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="shelf-level-books-title" className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden border border-[#d9dce5] bg-white shadow-xl">
      <header className="flex items-start justify-between gap-4 border-b border-[#e4e6eb] px-5 py-4"><div><h2 id="shelf-level-books-title" className="text-lg font-semibold">Level {level.level_number}: {level.name}</h2><p className="mt-1 text-sm text-[#687386]">{items.length} book item{items.length === 1 ? '' : 's'} expected at or currently found on this shelf level.</p></div><button type="button" onClick={onClose} aria-label="Close book list" className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"><X className="h-4 w-4" /></button></header>
      <div className="overflow-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="sticky top-0 bg-[#f5f4f8]"><tr className="border-b border-[#d9dce5]"><Header>ISBN</Header><Header>Title</Header><Header>Category</Header><Header>Barcode</Header><Header><span className="inline-flex items-center gap-1.5" title="Expected location"><Target className="h-3.5 w-3.5" aria-hidden="true" />Expected</span></Header><Header><span className="inline-flex items-center gap-1.5" title="Current location"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />Current</span></Header><Header>Placement</Header></tr></thead><tbody>{items.map((item) => { const book = bookById.get(item.book_id); const placement = getPlacement(item, levelId); return <tr key={item.id} className="border-b border-[#d9dce5] last:border-b-0"><td className="px-4 py-3 text-[#596174]">{book?.isbn || '—'}</td><td className="px-4 py-3 font-medium">{book?.title || `Book #${item.book_id}`}</td><td className="px-4 py-3 text-[#596174]">{book?.category_id ? categoryById.get(book.category_id) || 'Uncategorized' : 'Uncategorized'}</td><td className="px-4 py-3 font-mono text-xs text-[#596174]">{item.barcode}</td><td className="px-4 py-3 text-xs text-[#596174]"><LevelLocation levelId={item.expected_shelf_level_id} levelById={levelById} shelfById={shelfById} /></td><td className="px-4 py-3 text-xs text-[#596174]">{item.current_shelf_level_id === null ? <span className="font-medium text-[#b42318]">Not found</span> : <LevelLocation levelId={item.current_shelf_level_id} levelById={levelById} shelfById={shelfById} />}</td><td className="px-4 py-3"><PlacementBadge type={placement} /></td></tr> })}</tbody></table></div>
    </section>
  </div>
}

type Placement = 'CORRECT' | 'MISPLACED_AWAY' | 'MISPLACED_HERE' | 'MISSING'
function getPlacement(item: (typeof initialBookItems)[number], levelId: number): Placement {
  if (item.expected_shelf_level_id === levelId && item.current_shelf_level_id === levelId) return 'CORRECT'
  if (item.expected_shelf_level_id === levelId && item.current_shelf_level_id === null) return 'MISSING'
  if (item.expected_shelf_level_id === levelId) return 'MISPLACED_AWAY'
  return 'MISPLACED_HERE'
}
function PlacementBadge({ type }: { type: Placement }) {
  const config = { CORRECT: ['Correct location', 'bg-[#d9f7e7] text-[#087443]'], MISPLACED_AWAY: ['Misplaced — expected here', 'bg-[#fff0d8] text-[#a65000]'], MISPLACED_HERE: ['Misplaced — found here', 'bg-[#fff0d8] text-[#a65000]'], MISSING: ['Missing', 'bg-[#fff0f0] text-[#b42318]'] } as const
  const [label, className] = config[type]
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${className}`}>{label}</span>
}
function LevelLocation({ levelId, levelById, shelfById }: { levelId: number; levelById: Map<number, (typeof initialShelfLevels)[number]>; shelfById: Map<number, (typeof initialShelves)[number]> }) {
  const shelfLevel = levelById.get(levelId)
  const shelf = shelfLevel ? shelfById.get(shelfLevel.shelf_id) : undefined
  if (!shelfLevel) return <>Level #{levelId}</>
  return <span><span className="font-medium text-[#343a45]">Level {shelfLevel.level_number}</span><span className="block">{shelfLevel.name}</span><span className="block text-[#7b8190]">{shelf ? `${shelf.code} · ${shelf.name}` : `Shelf #${shelfLevel.shelf_id}`}</span></span>
}
function ShelfLevelFormDialog({ shelfId, level, onClose, onSubmit }: { shelfId: number; level?: (typeof initialShelfLevels)[number]; onClose: () => void; onSubmit: (data: { name: string; level_number: number; status: 1 | 2 | 3 }) => void }) {
  const [name, setName] = useState(level?.name || '')
  const [levelNumber, setLevelNumber] = useState(level?.level_number || 1)
  const [status, setStatus] = useState<1 | 2 | 3>(level?.status || 1)
  const input = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm outline-none focus:border-primary'
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151922]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-labelledby="shelf-level-form-title" className="w-full max-w-md border border-[#d9dce5] bg-white shadow-xl"><header className="flex items-start justify-between border-b border-[#e4e6eb] px-5 py-4"><div><h2 id="shelf-level-form-title" className="text-lg font-semibold">{level ? 'Update Shelf Level' : 'Create Shelf Level'}</h2><p className="mt-1 text-sm text-[#687386]">Shelf #{shelfId}</p></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center text-[#687386] hover:bg-[#f1f2f5]"><X className="h-4 w-4" /></button></header><form onSubmit={(event) => { event.preventDefault(); onSubmit({ name, level_number: levelNumber, status }) }} className="space-y-4 px-5 py-5"><label className="block text-sm font-medium">Name<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={`${input} mt-1.5`} /></label><label className="block text-sm font-medium">Level number<input required min={1} type="number" value={levelNumber} onChange={(event) => setLevelNumber(Number(event.target.value))} className={`${input} mt-1.5`} /></label><label className="block text-sm font-medium">Status<select value={status} onChange={(event) => setStatus(Number(event.target.value) as 1 | 2 | 3)} className={`${input} mt-1.5`}><option value={1}>Active</option><option value={2}>Inactive</option><option value={3}>Maintenance</option></select></label><footer className="flex justify-end gap-2 border-t border-[#e4e6eb] pt-4"><button type="button" onClick={onClose} className="h-10 border border-[#d7d9e2] px-4 text-sm font-medium hover:bg-[#f5f5f7]">Cancel</button><button type="submit" className="h-10 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">Save</button></footer></form></section></div>
}

function ChartSegment({ value, total, className }: { value: number; total: number; className: string }) { return value > 0 ? <span className={className} style={{ width: `${(value / total) * 100}%` }} /> : null }
function Header({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654] ${className}`}>{children}</th> }
function DetailRow({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]"><dt className="text-[#687386]">{label}</dt><dd>{value}</dd></div> }
function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className="border border-[#d9dce5] bg-white px-4 py-3"><p className="text-xs font-medium uppercase text-[#687386]">{label}</p><p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p></div> }
function Legend({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span> }
function NotFound() { return <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8"><h1 className="text-xl font-semibold">Shelf not found</h1><Link to="/shelves" className="mt-4 inline-flex text-sm text-primary hover:underline">Back to Shelves</Link></div> }

export default ShelfDetail
