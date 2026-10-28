import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Layers3, Route } from 'lucide-react'

import { initialAisles, initialFloors } from '../../lib/mapData'

function FloorDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const floor = id
    ? initialFloors.find((item) => item.id === Number(id))
    : undefined

  if (!floor) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
        <h1 className="text-xl font-semibold">Floor not found</h1>
        <Link
          to="/floors"
          className="mt-4 inline-flex text-sm text-primary hover:underline"
        >
          Back to Floors
        </Link>
      </div>
    )
  }

  const aisles = initialAisles.filter((aisle) => aisle.floor_id === floor.id)

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <Link
        to="/floors"
        className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Floors
      </Link>

      <header className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Layers3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-[#687386]">
            Floor #{floor.id}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{floor.name}</h1>
        </div>
      </header>

      <section className="mt-8 max-w-3xl overflow-hidden border border-[#d9dce5] bg-white">
        <dl className="divide-y divide-[#d9dce5]">
          <DetailRow label="ID" value={floor.id.toString()} />
          <DetailRow label="Code" value={floor.code} />
          <DetailRow label="Name" value={floor.name} />
          <DetailRow label="Description" value={floor.description || '—'} />
          <div className="grid grid-cols-[140px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-[#687386]">Status</dt>
            <dd><StatusBadge status={floor.status} /></dd>
          </div>
        </dl>
      </section>

      <section className="mt-9">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Aisles</h2>
            <p className="mt-0.5 text-sm text-[#687386]">
              {aisles.length} aisle{aisles.length === 1 ? '' : 's'} belonging to this floor.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Code</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Name</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Description</th>
                  <th className="w-[150px] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Status</th>
                </tr>
              </thead>
              <tbody>
                {aisles.length > 0 ? aisles.map((aisle) => (
                  <tr
                    key={aisle.id}
                    onClick={() => navigate(`/aisles/${aisle.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/aisles/${aisle.id}`)
                      }
                    }}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${aisle.name}`}
                    className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-primary">
                      {aisle.code}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {aisle.name}
                    </td>
                    <td className="px-4 py-4 text-[#596174]">{aisle.description || '—'}</td>
                    <td className="px-4 py-4"><StatusBadge status={aisle.status} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <Route className="mx-auto h-8 w-8 text-[#89909f]" />
                      <p className="mt-3 font-medium text-[#3f4654]">No aisles found</p>
                      <p className="mt-1 text-sm text-[#7b8190]">This floor does not have any aisles yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
      <dt className="text-[#687386]">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-[#d9f7e7] text-[#087443]',
    INACTIVE: 'bg-[#eef0f3] text-[#596174]',
    MAINTENANCE: 'bg-[#fff0d8] text-[#a65000]',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[status] || styles.INACTIVE}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

export default FloorDetail
