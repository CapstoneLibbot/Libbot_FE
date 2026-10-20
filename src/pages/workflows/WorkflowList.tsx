import { useMemo, useState } from 'react'
import { Activity, ChevronDown, Plus, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { getWorkflows } from '@/lib/workflowData'
import { WorkflowStatus } from '@/types/workflow'

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
  const navigate = useNavigate()
  const [workflows] = useState(getWorkflows)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | WorkflowStatus>('All')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredWorkflows = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return workflows.filter((workflow) => {
      const matchesSearch =
        !searchValue ||
        workflow.id.toString().includes(searchValue) ||
        workflow.name.toLowerCase().includes(searchValue)

      return matchesSearch && (status === 'All' || workflow.status === status)
    })
  }, [search, status, workflows])

  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(filteredWorkflows.length / pageSize))
  const visiblePage = Math.min(currentPage, pageCount)
  const paginatedWorkflows = filteredWorkflows.slice((visiblePage - 1) * pageSize, visiblePage * pageSize)

  const hasFilters = search !== '' || status !== 'All'

  const clearFilters = () => {
    setSearch('')
    setStatus('All')
    setCurrentPage(1)
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-8">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
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

          <button
            type="button"
            onClick={() => navigate('/workflows/create')}
            className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[350px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
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
                setCurrentPage(1)
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
                  paginatedWorkflows.map((workflow) => (
                    <tr
                      key={workflow.id}
                      onClick={() => navigate(`/workflows/${workflow.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') navigate(`/workflows/${workflow.id}`)
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`View ${workflow.name}`}
                      className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 transition hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d9dce5] px-4 py-3">
            <p className="text-xs text-[#687386]" aria-live="polite">
              Showing {filteredWorkflows.length} of {workflows.length} workflows
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(visiblePage - 1)}
                disabled={visiblePage === 1}
                aria-label="Previous page"
                className="flex h-7 w-7 items-center justify-center text-[#a3a8b2] disabled:cursor-not-allowed enabled:hover:bg-[#f1eff5]"
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={page === visiblePage ? 'page' : undefined}
                  className={page === visiblePage
                    ? 'flex h-7 min-w-7 items-center justify-center bg-primary px-2 text-xs font-medium text-white'
                    : 'flex h-7 min-w-7 items-center justify-center px-2 text-xs font-medium text-[#596174] hover:bg-[#f1eff5]'}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage(visiblePage + 1)}
                disabled={visiblePage === pageCount}
                aria-label="Next page"
                className="flex h-7 w-7 items-center justify-center text-[#a3a8b2] disabled:cursor-not-allowed enabled:hover:bg-[#f1eff5]"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowList