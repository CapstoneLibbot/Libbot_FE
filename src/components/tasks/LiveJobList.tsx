import { useEffect, useState } from 'react'
import { ArrowUpRight, Radio } from 'lucide-react'
import { Link } from 'react-router'
import { apiGet, type BackendJob } from '@/lib/jobApi'

function LiveJobList() {
  const [jobs, setJobs] = useState<BackendJob[]>([])
  const [reachable, setReachable] = useState(true)

  useEffect(() => {
    let active = true
    let nextPoll: number | undefined
    const refresh = async () => {
      try {
        const result = await apiGet<BackendJob[]>('/api/jobs')
        if (active) {
          setJobs(result.slice(0, 6))
          setReachable(true)
        }
      } catch {
        if (active) setReachable(false)
      }
      if (active) nextPoll = window.setTimeout(refresh, 5000)
    }
    void refresh()
    return () => {
      active = false
      if (nextPoll !== undefined) window.clearTimeout(nextPoll)
    }
  }, [])

  return (
    <section className="border border-[#d9dce5] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9ebef] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center bg-emerald-50 text-emerald-700"><Radio className="h-4 w-4" /></span>
          <div>
            <h2 className="text-sm font-semibold text-[#252933]">Robot jobs</h2>
            <p className="mt-0.5 text-[11px] text-[#77808e]">Open a job to run it when ready and follow live progress.</p>
          </div>
        </div>
        <span className={`text-[11px] font-medium ${reachable ? 'text-emerald-700' : 'text-amber-700'}`}>
          {reachable ? 'Live · refreshes automatically' : 'Backend is not reachable'}
        </span>
      </div>

      {jobs.length ? (
        <div className="divide-y divide-[#edf0f3]">
          {jobs.map((job) => (
            <Link key={job.id} to={`/tasks/${job.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#f8f9fb] sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#252933]">{job.workflowName}</p>
                <p className="mt-1 truncate font-mono text-[10px] text-[#89909d]">{job.id} · {job.runtimeId ?? 'robot runtime'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#eef1f5] px-2.5 py-1 text-[10px] font-semibold text-[#596174]">{job.status}</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">Monitor <ArrowUpRight className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="px-5 py-4 text-xs text-[#77808e]">{reachable ? 'No jobs have been recorded yet.' : 'Set VITE_API_BASE_URL to the LiBot backend to browse live jobs.'}</p>
      )}
    </section>
  )
}

export default LiveJobList
