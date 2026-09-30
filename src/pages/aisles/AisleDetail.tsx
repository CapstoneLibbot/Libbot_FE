import { Link, useParams } from 'react-router'
import { ArrowLeft, Route } from 'lucide-react'
import { initialAisles } from '../../lib/mapData'

function AisleDetail() {
	const { id } = useParams()
	const aisle = id
		? initialAisles.find((item) => item.id === Number(id))
		: null

	if (id && !aisle) {
		return (
			<div className="p-8 text-[#17181c]">
				<h1 className="text-xl font-semibold">Aisle not found</h1>
				<Link
					to="/maps"
					className="mt-4 inline-flex text-sm text-primary hover:underline"
				>
					Back to Maps
				</Link>
			</div>
		)
	}

	if (aisle) {
		return (
			<div className="min-h-screen bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
				<Link
					to="/maps"
					className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Maps
				</Link>

				<div className="mt-6 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
						<Route className="h-5 w-5" />
					</div>
					<div>
						<p className="text-xs font-medium uppercase text-[#687386]">
							Aisle #{aisle.id}
						</p>
						<h1 className="text-2xl font-semibold">{aisle.name}</h1>
					</div>
				</div>

				<dl className="mt-8 max-w-2xl divide-y divide-[#d9dce5] border-y border-[#d9dce5] bg-white px-4">
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Code</dt>
						<dd>{aisle.code}</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Endpoint A ID</dt>
						<dd>{aisle.endpointA_id}</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Endpoint B ID</dt>
						<dd>{aisle.endpointB_id}</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Floor ID</dt>
						<dd>{aisle.floor_id}</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Status</dt>
						<dd>{aisle.status}</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Description</dt>
						<dd>{aisle.description || '—'}</dd>
					</div>
				</dl>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
			<h1 className="text-2xl font-semibold">Aisles</h1>
			<p className="mt-1 text-sm text-[#687386]">
				Aisles are defined by their two endpoint positions on a map.
			</p>
			<div className="mt-7 overflow-x-auto border border-[#d9dce5] bg-white">
				<table className="w-full min-w-[600px] text-left text-sm">
					<thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-xs uppercase text-[#596174]">
						<tr>
							<th className="px-4 py-3 font-semibold">Code</th>
							<th className="px-4 py-3 font-semibold">Name</th>
							<th className="px-4 py-3 font-semibold">Endpoint A</th>
							<th className="px-4 py-3 font-semibold">Endpoint B</th>
							<th className="px-4 py-3 font-semibold">Status</th>
						</tr>
					</thead>
					<tbody>
						{initialAisles.map((item) => (
							<tr
								key={item.id}
								className="border-b border-[#ececf1] last:border-0 hover:bg-[#fafafd]"
							>
								<td className="px-4 py-3">
									<Link
										to={`/aisles/${item.id}`}
										className="font-medium text-primary hover:underline"
									>
										{item.code}
									</Link>
								</td>
								<td className="px-4 py-3">{item.name}</td>
								<td className="px-4 py-3">{item.endpointA_id}</td>
								<td className="px-4 py-3">{item.endpointB_id}</td>
								<td className="px-4 py-3">{item.status}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default AisleDetail
