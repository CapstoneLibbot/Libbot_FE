import { Link, useParams } from 'react-router'
import { ArrowLeft, LibraryBig } from 'lucide-react'
import { initialShelves } from '../../lib/mapData'

function ShelfDetail() {
	const { id } = useParams()
	const shelf = id
		? initialShelves.find((item) => item.id === Number(id))
		: null

	if (id && !shelf) {
		return (
			<div className="p-8 text-[#17181c]">
				<h1 className="text-xl font-semibold">Shelf not found</h1>
				<Link
					to="/maps"
					className="mt-4 inline-flex text-sm text-primary hover:underline"
				>
					Back to Maps
				</Link>
			</div>
		)
	}

	if (shelf) {
		return (
			<div className="min-h-screen bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
				<Link
					to={`/aisles/${shelf.aisle_id}`}
					className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					{shelf.aisle_id ? 'Aisle detail' : 'Aisles'}
				</Link>

				<div className="mt-6 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
						<LibraryBig className="h-5 w-5" />
					</div>
					<div>
						<p className="text-xs font-medium uppercase text-[#687386]">
							Shelf #{shelf.id}
						</p>
						<h1 className="text-2xl font-semibold">{shelf.name}</h1>
					</div>
				</div>

				<dl className="mt-8 max-w-2xl divide-y divide-[#d9dce5] border-y border-[#d9dce5] bg-white px-4">
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Code</dt>
						<dd>{shelf.code}</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Endpoint ID</dt>
						<dd>{shelf.endpoint_id}</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Aisle ID</dt>
						<dd>
							<Link
								to={`/aisles/${shelf.aisle_id}`}
								className="text-primary hover:underline"
							>
								{shelf.aisle_id}
							</Link>
						</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Status</dt>
						<dd>{shelf.status}</dd>
					</div>
					<div className="grid grid-cols-[150px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Description</dt>
						<dd>{shelf.description || '—'}</dd>
					</div>
				</dl>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
			<h1 className="text-2xl font-semibold">Shelves</h1>
			<p className="mt-1 text-sm text-[#687386]">
				Shelves are linked to both a map endpoint and an aisle.
			</p>
			<div className="mt-7 overflow-x-auto border border-[#d9dce5] bg-white">
				<table className="w-full min-w-[600px] text-left text-sm">
					<thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-xs uppercase text-[#596174]">
						<tr>
							<th className="px-4 py-3 font-semibold">Code</th>
							<th className="px-4 py-3 font-semibold">Name</th>
							<th className="px-4 py-3 font-semibold">Endpoint ID</th>
							<th className="px-4 py-3 font-semibold">Aisle</th>
							<th className="px-4 py-3 font-semibold">Status</th>
						</tr>
					</thead>
					<tbody>
						{initialShelves.map((item) => (
							<tr
								key={item.id}
								className="border-b border-[#ececf1] last:border-0 hover:bg-[#fafafd]"
							>
								<td className="px-4 py-3">
									<Link
										to={`/shelves/${item.id}`}
										className="font-medium text-primary hover:underline"
									>
										{item.code}
									</Link>
								</td>
								<td className="px-4 py-3">{item.name}</td>
								<td className="px-4 py-3">{item.endpoint_id}</td>
								<td className="px-4 py-3">
									<Link
										to={`/aisles/${item.aisle_id}`}
										className="text-primary hover:underline"
									>
										{item.aisle_id}
									</Link>
								</td>
								<td className="px-4 py-3">{item.status}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default ShelfDetail
