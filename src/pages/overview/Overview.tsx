import { Link } from 'react-router'
import { Activity, ArrowRight, Bot, Boxes, CheckCircle2, CircleAlert, Clock3, MapPin, Route, ScanLine, TriangleAlert } from 'lucide-react'

import { getJobs } from '../../lib/jobData'
import { initialAisles, initialBookItems, initialBooks, initialFloors, initialShelves } from '../../lib/mapData'
import { JobStatus } from '../../types/job'

function Overview() {
  const jobs = getJobs()
  const runningJob = jobs.find((job) => job.status === JobStatus.Running)
  const pendingJobs = jobs.filter((job) => job.status === JobStatus.Pending).length
  const completedToday = jobs.filter((job) => job.status === JobStatus.Completed).length
  const missingBooks = initialBookItems.filter((item) => item.current_shelf_level_id === null).length
  const misplacedBooks = initialBookItems.filter((item) => item.current_shelf_level_id !== null && item.current_shelf_level_id !== item.expected_shelf_level_id).length

  const notifications = [
    {
      icon: Activity,
      tone: 'bg-[#e6f0ff] text-primary',
      title: runningJob ? `Robot #${runningJob.robotId} is on a mission` : 'All robots are available',
      description: runningJob ? `${runningJob.name} · currently guiding a visitor.` : 'No active task needs attention.',
      time: 'Now',
    },
    {
      icon: TriangleAlert,
      tone: 'bg-[#fff0d8] text-[#a65000]',
      title: `${misplacedBooks} books need location review`,
      description: 'The latest inventory found books placed on a different shelf level.',
      time: 'Today',
    },
    {
      icon: CircleAlert,
      tone: 'bg-[#ffe8e6] text-[#b42318]',
      title: `${missingBooks} books are marked missing`,
      description: 'Review the shelf-level inventory to confirm their last known location.',
      time: 'Today',
    },
  ]

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1360px] space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white shadow-sm"><Bot className="h-5 w-5" /></div>
            <div><p className="text-sm font-medium text-primary">LiBot Command Center</p><h1 className="text-2xl font-bold tracking-tight">Library operations overview</h1><p className="mt-1 text-sm text-[#596174]">Monitor the robot, collection locations, and operational activity in one place.</p></div>
          </div>
          <div className="inline-flex items-center gap-2 border border-[#cce6d7] bg-[#f2fbf5] px-3 py-2 text-sm font-medium text-[#087443]"><span className="h-2 w-2 rounded-full bg-[#1e9b57]" />System online</div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Library statistics">
          <MetricCard icon={Bot} label="Robot fleet" value="1 online" detail={runningJob ? `Robot #${runningJob.robotId} is active` : 'Ready for the next task'} tone="text-primary bg-[#e6f0ff]" />
          <MetricCard icon={Boxes} label="Book items tracked" value={initialBookItems.length.toString()} detail={`${initialBooks.length} book titles in catalog`} tone="text-[#7d4fc7] bg-[#f1eaff]" />
          <MetricCard icon={Route} label="Library layout" value={`${initialFloors.length} floors`} detail={`${initialAisles.length} aisles · ${initialShelves.length} shelves`} tone="text-[#087443] bg-[#e6f7ed]" />
          <MetricCard icon={TriangleAlert} label="Needs attention" value={(missingBooks + misplacedBooks).toString()} detail={`${misplacedBooks} misplaced · ${missingBooks} missing`} tone="text-[#a65000] bg-[#fff0d8]" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <article className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e4e6eb] px-5 py-4">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f0ff] text-primary"><Activity className="h-5 w-5" /></div><div><h2 className="font-semibold">Live robot operation</h2><p className="mt-0.5 text-sm text-[#687386]">Current mission and last reported position</p></div></div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d9f7e7] px-2.5 py-1 text-xs font-semibold text-[#087443]"><span className="h-1.5 w-1.5 rounded-full bg-current" />Running</span>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#687386]">Active task</p><h3 className="mt-1 text-lg font-semibold">{runningJob?.name || 'No active mission'}</h3><p className="mt-1 text-sm text-[#596174]">{runningJob?.description || 'The robot is waiting at its home location.'}</p></div>
                <div className="grid gap-3 sm:grid-cols-2"><InfoItem icon={MapPin} label="Current location" value={runningJob ? 'Floor 1 · Reading desk area A' : 'Charging station'} /><InfoItem icon={Route} label="Destination" value={runningJob ? 'Endpoint EP-104' : '—'} /></div>
                <div><div className="flex items-center justify-between text-sm"><span className="font-medium">Route progress</span><span className="font-semibold text-primary">{runningJob ? '42%' : '0%'}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e7e9ee]"><div className="h-full rounded-full bg-primary" style={{ width: runningJob ? '42%' : '0%' }} /></div><p className="mt-2 text-xs text-[#687386]">{runningJob ? '16.9 m travelled of 40.3 m · obstacle detection enabled' : 'No route is currently assigned.'}</p></div>
                <Link to={runningJob ? `/tasks/${runningJob.id}` : '/tasks'} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">View mission <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-[#f2f6fe] p-5"><div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(#d6e2f7 1px, transparent 1px), linear-gradient(90deg, #d6e2f7 1px, transparent 1px)', backgroundSize: '24px 24px' }} /><div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-primary/20 bg-white shadow-sm"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg"><Bot className="h-8 w-8" /></div></div><span className="absolute bottom-5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#3f4654] shadow-sm">EP-104 · Floor 1</span></div>
            </div>
          </article>

          <article className="border border-[#d9dce5] bg-white"><div className="flex items-center justify-between border-b border-[#e4e6eb] px-5 py-4"><div><h2 className="font-semibold">Today&apos;s notifications</h2><p className="mt-0.5 text-sm text-[#687386]">Operational updates that need review</p></div><span className="rounded-full bg-[#f1f2f5] px-2 py-1 text-xs font-semibold text-[#596174]">{notifications.length}</span></div><div className="divide-y divide-[#e4e6eb]">{notifications.map((notification) => { const Icon = notification.icon; return <div key={notification.title} className="flex gap-3 px-5 py-4"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{notification.title}</p><span className="shrink-0 text-xs text-[#89909f]">{notification.time}</span></div><p className="mt-1 text-sm leading-5 text-[#687386]">{notification.description}</p></div></div> })}</div><Link to="/inventory-results" className="flex items-center justify-between border-t border-[#e4e6eb] px-5 py-3 text-sm font-semibold text-primary hover:bg-[#fafbfe]">Review inventory results <ArrowRight className="h-4 w-4" /></Link></article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <article className="overflow-hidden border border-[#d9dce5] bg-white"><div className="flex items-center justify-between border-b border-[#e4e6eb] px-5 py-4"><div><h2 className="font-semibold">Task activity</h2><p className="mt-0.5 text-sm text-[#687386]">Recent work assigned to the library robot</p></div><Link to="/tasks" className="text-sm font-semibold text-primary hover:underline">All tasks</Link></div><div className="divide-y divide-[#e4e6eb]">{jobs.slice(0, 4).map((job) => <Link key={job.id} to={`/tasks/${job.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafbfe]"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${job.status === JobStatus.Running ? 'bg-[#e6f0ff] text-primary' : job.status === JobStatus.Completed ? 'bg-[#e6f7ed] text-[#087443]' : 'bg-[#f1f2f5] text-[#687386]'}`}>{job.status === JobStatus.Completed ? <CheckCircle2 className="h-4 w-4" /> : job.status === JobStatus.Running ? <Activity className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{job.name}</span><span className="mt-0.5 block text-xs text-[#687386]">Robot {job.robotId ? `#${job.robotId}` : 'not assigned'} · Task #{job.id}</span></span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.status === JobStatus.Running ? 'bg-[#e6f0ff] text-primary' : job.status === JobStatus.Completed ? 'bg-[#e6f7ed] text-[#087443]' : 'bg-[#f1f2f5] text-[#596174]'}`}>{job.status}</span></Link>)}</div></article>

          <article className="border border-[#d9dce5] bg-white p-5"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#f1eaff] text-[#7d4fc7]"><ScanLine className="h-5 w-5" /></div><h2 className="mt-4 font-semibold">Inventory snapshot</h2><p className="mt-1 text-sm leading-5 text-[#687386]">Keep the collection accurate with the most recent robot inventory check.</p><div className="mt-5 grid grid-cols-2 gap-3"><Snapshot label="Completed tasks" value={completedToday.toString()} /><Snapshot label="Pending tasks" value={pendingJobs.toString()} /><Snapshot label="Misplaced books" value={misplacedBooks.toString()} /><Snapshot label="Missing books" value={missingBooks.toString()} /></div><Link to="/inventory" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Record an inventory scan <ArrowRight className="h-4 w-4" /></Link></article>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: typeof Bot; label: string; value: string; detail: string; tone: string }) {
  return <article className="border border-[#d9dce5] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-[#596174]">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p></div><div className={`flex h-9 w-9 items-center justify-center rounded-md ${tone}`}><Icon className="h-5 w-5" /></div></div><p className="mt-2 text-xs text-[#687386]">{detail}</p></article>
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="flex items-start gap-2.5 border border-[#e4e6eb] bg-[#fafbfe] p-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-[#687386]">{label}</p><p className="mt-0.5 text-sm font-semibold">{value}</p></div></div>
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return <div className="border border-[#e4e6eb] bg-[#fafbfe] p-3"><p className="text-xl font-bold">{value}</p><p className="mt-1 text-xs text-[#687386]">{label}</p></div>
}

export default Overview
