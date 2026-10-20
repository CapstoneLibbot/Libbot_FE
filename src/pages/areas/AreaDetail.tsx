import { Link, useParams } from 'react-router'
import { ArrowLeft, MapPin } from 'lucide-react'
import { initialAreas } from '../../lib/mapData'

function AreaDetail() {
  const { id } = useParams()
  const area = id
    ? initialAreas.find((item) => item.id === Number(id))
    : null

  if (id && !area) {
    return (
      <div className="p-8 text-[#17181c]">
        <h1 className="text-xl font-semibold">Area not found</h1>
        <Link
          to="/areas"
          className="mt-4 inline-flex text-sm text-primary hover:underline"
        >
          Back to Areas
        </Link>
      </div>
    )
  }

  if (area) {
    return (
      <div className="min-h-screen bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
        <Link
          to="/areas"
          className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Areas
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-[#687386]">
              Area #{area.id}
            </p>
            <h1 className="text-2xl font-semibold">{area.name}</h1>
          </div>
        </div>

        <dl className="mt-8 max-w-2xl divide-y divide-[#d9dce5] border-y border-[#d9dce5] bg-white px-4">
          <div className="grid grid-cols-[140px_1fr] gap-4 py-4 text-sm">
            <dt className="text-[#687386]">Endpoint ID</dt>
            <dd>{area.endpoint_id}</dd>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 py-4 text-sm">
            <dt className="text-[#687386]">Code</dt>
            <dd>{area.code}</dd>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 py-4 text-sm">
            <dt className="text-[#687386]">Name</dt>
            <dd>{area.name}</dd>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 py-4 text-sm">
            <dt className="text-[#687386]">Description</dt>
            <dd>{area.description || '—'}</dd>
          </div>
        </dl>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Areas</h1>
          <p className="mt-1 text-sm text-[#687386]">
            Library areas linked to map endpoints
          </p>
        </div>
      </header>

      <div className="mt-7 overflow-x-auto border border-[#d9dce5] bg-white">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-xs uppercase text-[#596174]">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Endpoint ID</th>
              <th className="px-4 py-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {initialAreas.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#ececf1] last:border-0 hover:bg-[#fafafd]"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/areas/${item.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {item.code}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-[#596174]">
                  {item.endpoint_id}
                </td>
                <td className="px-4 py-3 text-[#596174]">
                  {item.description || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AreaDetail
