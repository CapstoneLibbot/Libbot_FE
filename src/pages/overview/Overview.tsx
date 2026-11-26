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
      title: runningJob ? `Robot #${runningJob.robotId} đang thực hiện nhiệm vụ` : 'Tất cả robot đang sẵn sàng',
      description: runningJob ? `${runningJob.name} · hiện đang hướng dẫn bạn đọc.` : 'Không có nhiệm vụ đang hoạt động cần xử lý.',
      time: 'Hiện tại',
    },
    {
      icon: TriangleAlert,
      tone: 'bg-[#fff0d8] text-[#a65000]',
      title: `${misplacedBooks} sách cần kiểm tra vị trí`,
      description: 'Lượt kiểm kê gần nhất phát hiện sách được đặt sai tầng kệ.',
      time: 'Hôm nay',
    },
    {
      icon: CircleAlert,
      tone: 'bg-[#ffe8e6] text-[#b42318]',
      title: `${missingBooks} sách được đánh dấu bị thiếu`,
      description: 'Kiểm tra dữ liệu kiểm kê theo tầng kệ để xác nhận vị trí gần nhất.',
      time: 'Hôm nay',
    },
  ]

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 text-[#17181c] sm:p-8">
      <div className="mx-auto max-w-[1360px] space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white shadow-sm"><Bot className="h-5 w-5" /></div>
            <div><p className="text-sm font-medium text-primary">Trung tâm điều hành LibBot</p><h1 className="text-2xl font-bold tracking-tight">Tổng quan hoạt động thư viện</h1><p className="mt-1 text-sm text-[#596174]">Theo dõi robot, vị trí tài liệu và hoạt động vận hành tại một nơi.</p></div>
          </div>
          <div className="inline-flex items-center gap-2 border border-[#cce6d7] bg-[#f2fbf5] px-3 py-2 text-sm font-medium text-[#087443]"><span className="h-2 w-2 rounded-full bg-[#1e9b57]" />Hệ thống trực tuyến</div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Thống kê thư viện">
          <MetricCard icon={Bot} label="Đội robot" value="1 đang trực tuyến" detail={runningJob ? `Robot #${runningJob.robotId} đang hoạt động` : 'Sẵn sàng cho nhiệm vụ tiếp theo'} tone="text-primary bg-[#e6f0ff]" />
          <MetricCard icon={Boxes} label="Bản sách được theo dõi" value={initialBookItems.length.toString()} detail={`${initialBooks.length} đầu sách trong danh mục`} tone="text-[#7d4fc7] bg-[#f1eaff]" />
          <MetricCard icon={Route} label="Bố trí thư viện" value={`${initialFloors.length} tầng`} detail={`${initialAisles.length} dãy sách · ${initialShelves.length} kệ`} tone="text-[#087443] bg-[#e6f7ed]" />
          <MetricCard icon={TriangleAlert} label="Cần chú ý" value={(missingBooks + misplacedBooks).toString()} detail={`${misplacedBooks} sai vị trí · ${missingBooks} bị thiếu`} tone="text-[#a65000] bg-[#fff0d8]" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <article className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e4e6eb] px-5 py-4">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f0ff] text-primary"><Activity className="h-5 w-5" /></div><div><h2 className="font-semibold">Hoạt động robot trực tiếp</h2><p className="mt-0.5 text-sm text-[#687386]">Nhiệm vụ hiện tại và vị trí được báo cáo gần nhất</p></div></div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d9f7e7] px-2.5 py-1 text-xs font-semibold text-[#087443]"><span className="h-1.5 w-1.5 rounded-full bg-current" />Đang chạy</span>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#687386]">Nhiệm vụ đang hoạt động</p><h3 className="mt-1 text-lg font-semibold">{runningJob?.name || 'Không có nhiệm vụ đang chạy'}</h3><p className="mt-1 text-sm text-[#596174]">{runningJob?.description || 'Robot đang chờ tại vị trí ban đầu.'}</p></div>
                <div className="grid gap-3 sm:grid-cols-2"><InfoItem icon={MapPin} label="Vị trí hiện tại" value={runningJob ? 'Tầng 1 · Điểm EP-101' : 'Trạm sạc'} /><InfoItem icon={Route} label="Điểm đến" value={runningJob ? 'Điểm EP-102' : '—'} /></div>
                <div><div className="flex items-center justify-between text-sm"><span className="font-medium">Tiến độ lộ trình</span><span className="font-semibold text-primary">{runningJob ? '42%' : '0%'}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e7e9ee]"><div className="h-full rounded-full bg-primary" style={{ width: runningJob ? '42%' : '0%' }} /></div><p className="mt-2 text-xs text-[#687386]">{runningJob ? 'Đã đi 16,9 m trên 40,3 m · phát hiện vật cản đang bật' : 'Chưa có lộ trình nào được giao.'}</p></div>
                <Link to={runningJob ? `/tasks/${runningJob.id}` : '/tasks'} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">Xem nhiệm vụ <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-[#f2f6fe] p-5"><div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(#d6e2f7 1px, transparent 1px), linear-gradient(90deg, #d6e2f7 1px, transparent 1px)', backgroundSize: '24px 24px' }} /><div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-primary/20 bg-white shadow-sm"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg"><Bot className="h-8 w-8" /></div></div><span className="absolute bottom-5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#3f4654] shadow-sm">EP-104 · Tầng 1</span></div>
            </div>
          </article>

          <article className="border border-[#d9dce5] bg-white"><div className="flex items-center justify-between border-b border-[#e4e6eb] px-5 py-4"><div><h2 className="font-semibold">Thông báo hôm nay</h2><p className="mt-0.5 text-sm text-[#687386]">Cập nhật vận hành cần xem xét</p></div><span className="rounded-full bg-[#f1f2f5] px-2 py-1 text-xs font-semibold text-[#596174]">{notifications.length}</span></div><div className="divide-y divide-[#e4e6eb]">{notifications.map((notification) => { const Icon = notification.icon; return <div key={notification.title} className="flex gap-3 px-5 py-4"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{notification.title}</p><span className="shrink-0 text-xs text-[#89909f]">{notification.time}</span></div><p className="mt-1 text-sm leading-5 text-[#687386]">{notification.description}</p></div></div> })}</div><Link to="/inventory-results" className="flex items-center justify-between border-t border-[#e4e6eb] px-5 py-3 text-sm font-semibold text-primary hover:bg-[#fafbfe]">Xem kết quả kiểm kê <ArrowRight className="h-4 w-4" /></Link></article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <article className="overflow-hidden border border-[#d9dce5] bg-white"><div className="flex items-center justify-between border-b border-[#e4e6eb] px-5 py-4"><div><h2 className="font-semibold">Hoạt động nhiệm vụ</h2><p className="mt-0.5 text-sm text-[#687386]">Công việc gần đây được giao cho robot thư viện</p></div><Link to="/tasks" className="text-sm font-semibold text-primary hover:underline">Tất cả nhiệm vụ</Link></div><div className="divide-y divide-[#e4e6eb]">{jobs.slice(0, 4).map((job) => <Link key={job.id} to={`/tasks/${job.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafbfe]"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${job.status === JobStatus.Running ? 'bg-[#e6f0ff] text-primary' : job.status === JobStatus.Completed ? 'bg-[#e6f7ed] text-[#087443]' : 'bg-[#f1f2f5] text-[#687386]'}`}>{job.status === JobStatus.Completed ? <CheckCircle2 className="h-4 w-4" /> : job.status === JobStatus.Running ? <Activity className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{job.name}</span><span className="mt-0.5 block text-xs text-[#687386]">Robot {job.robotId ? `#${job.robotId}` : 'chưa phân công'} · Nhiệm vụ #{job.id}</span></span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.status === JobStatus.Running ? 'bg-[#e6f0ff] text-primary' : job.status === JobStatus.Completed ? 'bg-[#e6f7ed] text-[#087443]' : 'bg-[#f1f2f5] text-[#596174]'}`}>{jobStatusLabels[job.status]}</span></Link>)}</div></article>

          <article className="border border-[#d9dce5] bg-white p-5"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#f1eaff] text-[#7d4fc7]"><ScanLine className="h-5 w-5" /></div><h2 className="mt-4 font-semibold">Tổng quan kiểm kê</h2><p className="mt-1 text-sm leading-5 text-[#687386]">Duy trì dữ liệu chính xác với lần kiểm kê gần nhất của robot.</p><div className="mt-5 grid grid-cols-2 gap-3"><Snapshot label="Nhiệm vụ hoàn thành" value={completedToday.toString()} /><Snapshot label="Nhiệm vụ đang chờ" value={pendingJobs.toString()} /><Snapshot label="Sách sai vị trí" value={misplacedBooks.toString()} /><Snapshot label="Không tìm thấy" value={missingBooks.toString()} /></div><Link to="/inventory" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Ghi nhận lượt kiểm kê <ArrowRight className="h-4 w-4" /></Link></article>
        </section>
      </div>
    </div>
  )
}

const jobStatusLabels: Record<JobStatus, string> = {
  [JobStatus.Pending]: 'Đang chờ',
  [JobStatus.Running]: 'Đang chạy',
  [JobStatus.Completed]: 'Hoàn thành',
  [JobStatus.Failed]: 'Thất bại',
  [JobStatus.Cancelled]: 'Đã hủy',
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
