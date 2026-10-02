import { useMemo, useState } from 'react'
import { Activity, ChevronDown, Search, X } from 'lucide-react'
import { WorkflowStatus } from '@/types/workflow'

type Workflow = {
  id: number
  name: string
  status: WorkflowStatus
}

const sampleWorkflows: Workflow[] = [
  { id: 1, name: 'Book Retrieval', status: WorkflowStatus.Active },
  { id: 2, name: 'Book Return', status: WorkflowStatus.Active },
  { id: 3, name: 'Shelf Inventory', status: WorkflowStatus.Inactive },
  { id: 4, name: 'New Arrival Processing', status: WorkflowStatus.Draft },
  { id: 5, name: 'Reading Room Delivery', status: WorkflowStatus.Inactive },
  { id: 6, name: 'Inter-floor Transfer', status: WorkflowStatus.Active },
]

const statusStyles: Record<WorkflowStatus, string> = {
  [WorkflowStatus.Draft]: 'bg-[#fff4df] text-[#946200]',
  [WorkflowStatus.Active]: 'bg-[#e8f5ed] text-[#237a45]',
  [WorkflowStatus.Inactive]: 'bg-[#f0eff2] text-[#626776]',
}

const statusLabels: Record<WorkflowStatus, string> = {
  [WorkflowStatus.Draft]: 'Draft',
  [WorkflowStatus.Active]: 'Active',
  [WorkflowStatus.Inactive]: 'Inactive',
}

function WorkflowList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | WorkflowStatus>('All')

  const filteredWorkflows = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return sampleWorkflows.filter((workflow) => {
      const matchesSearch =
        !searchValue ||
        workflow.id.toString().includes(searchValue) ||
        workflow.name.toLowerCase().includes(searchValue)

      return matchesSearch && (status === 'All' || workflow.status === status)
    })
  }, [search, status])

  const hasFilters = search !== '' || status !== 'All'

  const clearFilters = () => {
    setSearch('')
    setStatus('All')
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-8">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#17181c]">
              Workflows
            </h1>
            <p className="mt-0.5 text-sm text-[#596174]">
              Manage and monitor library workflows.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workflows by ID or name..."
              aria-label="Search workflows by ID or name"
              className="h-10 w-full rounded-none border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm text-[#17181c] outline-none transition placeholder:text-[#7b8190] focus:border-primary"
            />
          </div>

          <div className="relative w-full sm:w-40">
            <select
              value={status}
              onChange={(event) => {
                const value = event.target.value
                setStatus(value === 'All' ? 'All' : Number(value) as WorkflowStatus)
              }}
              aria-label="Filter workflows by status"
              className="h-10 w-full appearance-none rounded-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#17181c] outline-none transition focus:border-primary"
            >
              <option value="All">All Statuses</option>
              <option value={WorkflowStatus.Draft}>Draft</option>
              <option value={WorkflowStatus.Active}>Active</option>
              <option value={WorkflowStatus.Inactive}>Inactive</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="flex h-10 items-center gap-2 rounded-none border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] transition hover:bg-[#f1eff5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        <div className="text-xs text-[#687386]" aria-live="polite">
          Showing {filteredWorkflows.length} of {sampleWorkflows.length} workflows
        </div>

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th scope="col" className="w-[120px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Name
                  </th>
                  <th scope="col" className="w-[160px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkflows.length > 0 ? (
                  filteredWorkflows.map((workflow) => (
                    <tr
                      key={workflow.id}
                      className="border-b border-[#d9dce5] last:border-b-0 hover:bg-[#faf9fc]"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-primary">
                        {workflow.id}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#17181c]">
                        {workflow.name}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex min-w-[82px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[workflow.status]}`}>
                          {statusLabels[workflow.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-sm text-[#687386]">
                      No workflows match your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowList