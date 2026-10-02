import { useMemo, useState } from 'react'
import { CheckSquare, ChevronDown, Plus, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { getJobs } from '@/lib/jobData'
import { getWorkflows } from '@/lib/workflowData'
import { JobPriority, JobStatus } from '@/types/job'
import type { JobPriority as JobPriorityValue, JobStatus as JobStatusValue } from '@/types/job'

const statusStyles: Record<JobStatusValue, string> = {
  [JobStatus.Pending]: 'bg-[#fff4df] text-[#946200]',
  [JobStatus.Running]: 'bg-[#eaf1fb] text-[#315f9e]',
  [JobStatus.Completed]: 'bg-[#e8f5ed] text-[#237a45]',
  [JobStatus.Failed]: 'bg-[#fff0ee] text-[#b42318]',
  [JobStatus.Cancelled]: 'bg-[#f0eff2] text-[#626776]',
}

const priorityStyles: Record<JobPriorityValue, string> = {
  [JobPriority.Low]: 'bg-[#f0eff2] text-[#626776]',
  [JobPriority.Normal]: 'bg-[#eaf1fb] text-[#315f9e]',
  [JobPriority.High]: 'bg-[#fff4df] text-[#946200]',
  [JobPriority.Critical]: 'bg-[#fff0ee] text-[#b42318]',
}

const priorityLabels: Record<JobPriorityValue, string> = {
  [JobPriority.Low]: 'Low',
  [JobPriority.Normal]: 'Normal',
  [JobPriority.High]: 'High',
  [JobPriority.Critical]: 'Critical',
}

const selectClassName = 'h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#17181c] outline-none transition focus:border-primary'

function TaskList() {
  const navigate = useNavigate()
  const workflows = useMemo(() => getWorkflows(), [])
  const [jobs] = useState(getJobs)
  const [search, setSearch] = useState('')
  const [workflowId, setWorkflowId] = useState('All')
  const [status, setStatus] = useState<'All' | JobStatusValue>('All')
  const [priority, setPriority] = useState('All')

  const filteredJobs = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesSearch =
        !searchValue ||
        job.id.toString().includes(searchValue) ||
        job.name.toLowerCase().includes(searchValue)
      const matchesWorkflow = workflowId === 'All' || job.workflowId === Number(workflowId)
      const matchesStatus = status === 'All' || job.status === status
      const matchesPriority = priority === 'All' || job.priority === Number(priority)

      return matchesSearch && matchesWorkflow && matchesStatus && matchesPriority
    })
  }, [jobs, priority, search, status, workflowId])

  const hasFilters =
    search !== '' || workflowId !== 'All' || status !== 'All' || priority !== 'All'

  const clearFilters = () => {
    setSearch('')
    setWorkflowId('All')
    setStatus('All')
    setPriority('All')
  }

  const workflowNames = new Map(workflows.map((workflow) => [workflow.id, workflow.name]))
  const statuses = Object.values(JobStatus)
  const priorities = Object.values(JobPriority).sort((first, second) => second - first)

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#17181c]">Tasks</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Manage robot tasks and their workflow assignments.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tasks/create')}
              className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_190px_170px_150px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks by ID or name..."
              aria-label="Search tasks by ID or name"
              className="h-10 w-full border border-[#d7d9e2] bg-white pl-9 pr-3 text-sm text-[#17181c] outline-none transition placeholder:text-[#7b8190] focus:border-primary"
            />
          </div>

          <div className="relative">
            <select
              value={workflowId}
              onChange={(event) => setWorkflowId(event.target.value)}
              aria-label="Filter tasks by workflow"
              className={selectClassName}
            >
              <option value="All">All Workflows</option>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'All' | JobStatusValue)}
              aria-label="Filter tasks by status"
              className={selectClassName}
            >
              <option value="All">All Statuses</option>
              {statuses.map((jobStatus) => (
                <option key={jobStatus} value={jobStatus}>{jobStatus}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          </div>

          <div className="relative">
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              aria-label="Filter tasks by priority"
              className={selectClassName}
            >
              <option value="All">All Priorities</option>
              {priorities.map((value) => (
                <option key={value} value={value}>{priorityLabels[value as JobPriorityValue]}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="flex h-10 items-center justify-center gap-2 border border-[#d7d9e2] bg-white px-4 text-sm font-medium text-[#3f4654] transition hover:bg-[#f1eff5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        <div className="text-xs text-[#687386]" aria-live="polite">
          Showing {filteredJobs.length} of {jobs.length} tasks
        </div>

        <div className="overflow-hidden border border-[#d9dce5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-[#d9dce5] bg-[#f5f4f8]">
                  <th scope="col" className="w-[100px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">ID</th>
                  <th scope="col" className="w-[115px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Workflow ID</th>
                  <th scope="col" className="w-[110px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Created By</th>
                  <th scope="col" className="w-[110px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Robot ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Name</th>
                  <th scope="col" className="w-[100px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Priority</th>
                  <th scope="col" className="w-[150px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#3f4654]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/tasks/${job.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') navigate(`/tasks/${job.id}`)
                    }}
                    role="link"
                    tabIndex={0}
                    aria-label={`View task ${job.name}`}
                    className="cursor-pointer border-b border-[#d9dce5] last:border-b-0 transition hover:bg-[#faf9fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-primary">{job.id}</td>
                    <td className="px-4 py-4 font-mono text-xs text-[#414856]">
                      <span title={workflowNames.get(job.workflowId) ?? 'Workflow not found'}>{job.workflowId}</span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-[#414856]">{job.createdBy}</td>
                    <td className="px-4 py-4 font-mono text-xs text-[#414856]">{job.robotId ?? '—'}</td>
                    <td className="px-4 py-4 font-medium text-[#17181c]">{job.name}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex min-w-[88px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[job.priority]}`}>
                        {priorityLabels[job.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex min-w-[104px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#687386]">
                      No tasks match your search or filters.
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

export default TaskList