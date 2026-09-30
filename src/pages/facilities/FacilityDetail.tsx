import { Link, useParams } from 'react-router'
import { ArrowLeft, Building2, MapPin } from 'lucide-react'

type Facility = {
	id: number
	name: string
	category: string
	floor: string
	description: string
}

const facilities: Facility[] = [
	{
		id: 1,
		name: 'Main Entrance',
		category: 'Entrance',
		floor: 'Floor 1',
		description: 'Main entrance navigation point.',
	},
	{
		id: 2,
		name: 'Circulation Desk',
		category: 'Service Area',
		floor: 'Floor 1',
		description: 'Library circulation and visitor service desk.',
	},
	{
		id: 5,
		name: 'Children Reading Area',
		category: 'Reading Area',
		floor: 'Floor 1',
		description: 'Reading and activity area for children.',
	},
	{
		id: 6,
		name: 'Return Station',
		category: 'Robot Station',
		floor: 'Floor 1',
		description: 'Book return robot station.',
	},
]

function FacilityDetail() {
	const { id } = useParams()
	const facility = id
		? facilities.find((item) => item.id === Number(id))
		: null

	if (id && !facility) {
		return (
			<div className="p-8">
				<h1 className="text-xl font-semibold text-[#17181c]">
					Facility not found
				</h1>
				<Link
					to="/facilities"
					className="mt-4 inline-flex text-sm text-primary hover:underline"
				>
					Back to Facilities
				</Link>
			</div>
		)
	}

	if (facility) {
		return (
			<div className="min-h-screen bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
				<Link
					to="/facilities"
					className="inline-flex items-center gap-2 text-sm text-[#596174] hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Facilities
				</Link>

				<div className="mt-6 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
						<Building2 className="h-5 w-5" />
					</div>
					<div>
						<p className="text-xs font-medium uppercase text-[#687386]">
							Facility #{facility.id}
						</p>
						<h1 className="text-2xl font-semibold">{facility.name}</h1>
					</div>
				</div>

				<dl className="mt-8 max-w-2xl divide-y divide-[#d9dce5] border-y border-[#d9dce5] bg-white px-4">
					<div className="grid grid-cols-[140px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Category</dt>
						<dd>{facility.category}</dd>
					</div>
					<div className="grid grid-cols-[140px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Floor</dt>
						<dd>{facility.floor}</dd>
					</div>
					<div className="grid grid-cols-[140px_1fr] gap-4 py-4 text-sm">
						<dt className="text-[#687386]">Description</dt>
						<dd>{facility.description}</dd>
					</div>
				</dl>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#f9f7fd] p-6 text-[#17181c] md:p-8">
			<header className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
					<Building2 className="h-5 w-5" />
				</div>
				<div>
					<h1 className="text-2xl font-semibold">Facility</h1>
					<p className="mt-1 text-sm text-[#687386]">
						Library areas and service locations
					</p>
				</div>
			</header>

			<div className="mt-7 overflow-x-auto border border-[#d9dce5] bg-white">
				<table className="w-full min-w-[600px] text-left text-sm">
					<thead className="border-b border-[#d9dce5] bg-[#f5f4f8] text-xs uppercase text-[#596174]">
						<tr>
							<th className="px-4 py-3 font-semibold">Facility</th>
							<th className="px-4 py-3 font-semibold">Category</th>
							<th className="px-4 py-3 font-semibold">Floor</th>
							<th className="px-4 py-3 font-semibold">Description</th>
						</tr>
					</thead>
					<tbody>
						{facilities.map((item) => (
							<tr
								key={item.id}
								className="border-b border-[#ececf1] last:border-0 hover:bg-[#fafafd]"
							>
								<td className="px-4 py-3">
									<Link
										to={`/facilities/${item.id}`}
										className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
									>
										<MapPin className="h-4 w-4" />
										{item.name}
									</Link>
								</td>
								<td className="px-4 py-3 text-[#596174]">{item.category}</td>
								<td className="px-4 py-3 text-[#596174]">{item.floor}</td>
								<td className="px-4 py-3 text-[#596174]">{item.description}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default FacilityDetail
