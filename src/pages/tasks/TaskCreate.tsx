import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, ChevronDown, MapPinned, Search, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { sampleBooks } from '@/lib/bookData'
import { getJobs, saveJob } from '@/lib/jobData'
import { initialShelves } from '@/lib/mapData'
import { initialEndpoints, sampleMap } from '@/pages/maps/MapDetail'
import { getWorkflows } from '@/lib/workflowData'
import { JobPriority } from '@/types/job'
import type { JobPriority as JobPriorityValue, JobStepParameters } from '@/types/job'
import { WorkflowStatus, WorkflowStepType } from '@/types/workflow'
import type { WorkflowRecord } from '@/types/workflow'
import LibraryPatrolJobCreate from './LibraryPatrolJobCreate'
import BookshelfInventoryJobCreate from './BookshelfInventoryJobCreate'

const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#252933] outline-none placeholder:text-[#89909d] focus:border-primary'
const selectClassName = 'h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#252933] outline-none focus:border-primary'
const textareaClassName = 'min-h-24 w-full resize-y border border-[#d7d9e2] bg-white px-3 py-2 text-sm text-[#252933] outline-none placeholder:text-[#89909d] focus:border-primary'

function TaskCreateForm({ onCreatePatrol, onCreateInventory }: { onCreatePatrol: () => void; onCreateInventory: () => void }) {
  const navigate = useNavigate()
  const workflows = useMemo(() => getWorkflows().filter((workflow) => workflow.status === WorkflowStatus.Active), [])
  const robots = useMemo(() => [...new Set(getJobs().map((job) => job.robotId).filter((id): id is number => id !== null))], [])

  const [mapId, setMapId] = useState('')
  const [workflowId, setWorkflowId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [robotId, setRobotId] = useState('')
  const [priority, setPriority] = useState<JobPriorityValue>(JobPriority.Normal)
  const [bookQuery, setBookQuery] = useState('')
  const [bookId, setBookId] = useState('')
  const [shelfIds, setShelfIds] = useState<number[]>([])
  const [patrolEndpointIds, setPatrolEndpointIds] = useState<number[]>([])
  const [chargingEndpointId, setChargingEndpointId] = useState('')
  const [error, setError] = useState('')

  const selectedMap = mapId === String(sampleMap.id) ? sampleMap : null
  const selectedWorkflow = workflows.find((workflow) => workflow.id === Number(workflowId)) ?? null
  const selectedBook = sampleBooks.find((book) => book.id === Number(bookId))
  const matchingBooks = sampleBooks.filter((book) => {
    const query = bookQuery.trim().toLowerCase()
    return !query || [book.id.toString(), book.title, book.author, book.classification].some((value) => value.toLowerCase().includes(query))
  })

  const clearTarget = () => {
    setBookQuery('')
    setBookId('')
    setShelfIds([])
    setPatrolEndpointIds([])
    setChargingEndpointId('')
  }

  const handleMapChange = (value: string) => {
    setMapId(value)
    setWorkflowId('')
    setName('')
    setDescription('')
    clearTarget()
  }

  const handleWorkflowChange = (value: string) => {
    setWorkflowId(value)
    setError('')
    clearTarget()
    const workflow = workflows.find((item) => item.id === Number(value))
    setName(workflow?.name ?? '')
    setDescription(workflow?.description ?? '')
    setChargingEndpointId(Number(value) === 5 ? 'CHARGING_STATION' : '')
  }

  const toggleId = (id: number, selected: number[], setSelected: (value: number[]) => void) => {
    setSelected(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  }

  const getTargetParameter = (workflow: WorkflowRecord): { stepId: number; parameters: JobStepParameters } => {
    const firstTask = workflow.tasks.slice().sort((a, b) => a.sequenceNo - b.sequenceNo)[0]
    const firstStep = firstTask?.steps.slice().sort((a, b) => a.sequenceNo - b.sequenceNo)[0]
    if (!firstStep) throw new Error('Quy trình được chọn chưa có bước nào.')

    switch (workflow.id) {
      case 1:
        if (!selectedBook) throw new Error('Vui lòng chọn sách cho nhiệm vụ này.')
        if (firstStep.stepType !== WorkflowStepType.ProcessData) throw new Error('Quy trình tìm sách phải bắt đầu bằng PROCESS_DATA.')
        return {
          stepId: firstStep.id,
          parameters: { action: 'GET_BOOK_DETAIL', payload: { book_id: selectedBook.id } },
        }
      case 3:
        if (shelfIds.length === 0) throw new Error('Vui lòng chọn ít nhất một kệ để kiểm kê.')
        if (firstStep.stepType !== WorkflowStepType.ProcessData) throw new Error('Quy trình kiểm kê phải bắt đầu bằng PROCESS_DATA.')
        return {
          stepId: firstStep.id,
          parameters: {
            action: 'RESOLVE_INVENTORY_SCOPE',
            payload: { scope_type: 'SHELVES', floor_id: 1, target_shelves: shelfIds },
          },
        }
      case 4:
        if (patrolEndpointIds.length === 0) throw new Error('Vui lòng chọn ít nhất một điểm điều hướng để tuần tra.')
        if (firstStep.stepType !== WorkflowStepType.ProcessData) throw new Error('Quy trình tuần tra phải bắt đầu bằng PROCESS_DATA.')
        return {
          stepId: firstStep.id,
          parameters: {
            action: 'PATROL_SCOPE',
            payload: { scope_type: 'ENDPOINTS', floor_id: 1, target_endpoints: patrolEndpointIds },
          },
        }
      case 5:
        if (!chargingEndpointId.trim()) throw new Error('Vui lòng nhập điểm điều hướng của trạm sạc.')
        if (firstStep.stepType !== WorkflowStepType.Move) throw new Error('Quy trình sạc phải bắt đầu bằng MOVE.')
        return {
          stepId: firstStep.id,
          parameters: { endpoint_id: chargingEndpointId.trim(), speed_mode: 'NORMAL' },
        }
      default:
        throw new Error('Chưa có cấu hình mục tiêu cho quy trình này.')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!selectedMap || !selectedWorkflow) {
      setError('Vui lòng chọn bản đồ trước, sau đó chọn quy trình.')
      return
    }

    try {
      const target = getTargetParameter(selectedWorkflow)
      saveJob({
        workflow: selectedWorkflow,
        name,
        description,
        createdBy: 1,
        robotId: robotId ? Number(robotId) : null,
        priority,
        stepParameters: { [target.stepId]: target.parameters },
      })
      navigate('/tasks')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể tạo nhiệm vụ.')
    }
  }

  const renderTargetSelector = () => {
    if (!selectedWorkflow) return null

    if (selectedWorkflow.id === 1) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#252933]">Chọn sách</h3>
            <p className="mt-1 text-xs text-[#687386]">Mã sách đã chọn sẽ được chuyển vào quy trình để tải thông tin chi tiết.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input value={bookQuery} onChange={(event) => setBookQuery(event.target.value)} placeholder="Tìm theo tên sách, tác giả, mã hoặc ký hiệu phân loại..." aria-label="Tìm sách" className={`${inputClassName} pl-9`} />
          </div>
          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="max-h-[360px] divide-y divide-[#e9e9ee] overflow-y-auto">
              {matchingBooks.length > 0 ? matchingBooks.map((book) => (
                <button key={book.id} type="button" onClick={() => setBookId(String(book.id))} aria-pressed={bookId === String(book.id)} className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#f8f9fb] ${bookId === String(book.id) ? 'bg-[#eff5ff] ring-1 ring-inset ring-primary' : ''}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#252933]">{book.title}</span>
                    <span className="mt-1 block truncate text-xs text-[#687386]">{book.author}</span>
                    <span className="mt-2 block text-[11px] text-[#687386]">Mã {book.id} · {book.classification} · {book.shelf}, tầng {book.shelfLevel}</span>
                  </span>
                  {bookId === String(book.id) && <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />}
                </button>
              )) : (
                <p className="px-4 py-8 text-center text-sm text-[#687386]">Không tìm thấy sách phù hợp.</p>
              )}
            </div>
          </div>
          {selectedBook && (
            <div className="border-l-2 border-primary bg-[#f4f7fc] px-4 py-3 text-sm">
              <p className="font-semibold text-[#252933]">Đã chọn: {selectedBook.title}</p>
              <p className="mt-1 text-xs text-[#687386]">Mã sách {selectedBook.id} · Điểm đến EP-{selectedBook.endpointId}</p>
            </div>
          )}
        </div>
      )
    }

    if (selectedWorkflow.id === 3) {
      return (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-[#252933]">Chọn kệ cần kiểm kê</h3>
            <p className="mt-1 text-xs text-[#687386]">Chọn một hoặc nhiều kệ làm phạm vi kiểm kê.</p>
          </div>
          <div className="divide-y divide-[#e9e9ee] border border-[#d9dce5] bg-white">
            {initialShelves.map((shelf) => (
              <label key={shelf.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-[#f8f9fb]">
                <input type="checkbox" checked={shelfIds.includes(shelf.id)} onChange={() => toggleId(shelf.id, shelfIds, setShelfIds)} className="h-4 w-4 accent-primary" />
                <span className="font-medium text-[#252933]">{shelf.name}</span>
                <span className="text-xs text-[#687386]">{shelf.code}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[#687386]">Đã chọn {shelfIds.length} kệ</p>
        </div>
      )
    }

    if (selectedWorkflow.id === 4) {
      return (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-[#252933]">Chọn điểm tuần tra</h3>
            <p className="mt-1 text-xs text-[#687386]">Chọn một hoặc nhiều điểm điều hướng trên bản đồ làm mục tiêu tuần tra.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {initialEndpoints.map((endpoint) => (
              <label key={endpoint.id} className="flex cursor-pointer items-start gap-3 border border-[#d9dce5] bg-white px-3 py-2.5 text-sm hover:bg-[#f8f9fb]">
                <input type="checkbox" checked={patrolEndpointIds.includes(endpoint.id)} onChange={() => toggleId(endpoint.id, patrolEndpointIds, setPatrolEndpointIds)} className="mt-0.5 h-4 w-4 accent-primary" />
                <span className="min-w-0"><span className="block font-medium text-[#252933]">{endpoint.name}</span><span className="text-xs text-[#687386]">{endpoint.code}</span></span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[#687386]">Đã chọn {patrolEndpointIds.length} điểm điều hướng</p>
        </div>
      )
    }

    if (selectedWorkflow.id === 5) {
      return (
        <label className="block max-w-xl space-y-1.5 text-sm font-medium text-[#3f4654]">
          Điểm điều hướng trạm sạc <span className="text-[#b42318]">*</span>
          <input required value={chargingEndpointId} onChange={(event) => setChargingEndpointId(event.target.value)} placeholder="CHARGING_STATION" className={inputClassName} />
          <span className="block text-xs font-normal text-[#687386]">Sử dụng điểm điều hướng trạm sạc được cấu hình cho robot/bản đồ.</span>
        </label>
      )
    }

    return <p className="text-sm text-[#687386]">Quy trình này chưa có cấu hình chọn mục tiêu.</p>
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <Link to="/tasks" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#596174] transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách nhiệm vụ
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10"><MapPinned className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold text-[#17181c]">Tạo nhiệm vụ</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Tạo nhiệm vụ cho robot từ quy trình và mục tiêu tương ứng.</p>
            </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onCreatePatrol} className="inline-flex h-10 items-center gap-2 border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary hover:bg-primary/10">
                <ShieldCheck className="h-4 w-4" />Tạo nhiệm vụ tuần tra thư viện
              </button>
              <button type="button" onClick={onCreateInventory} className="inline-flex h-10 items-center gap-2 border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary hover:bg-primary/10">
                <Search className="h-4 w-4" />Tạo nhiệm vụ kiểm kê kệ
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 border border-[#d9dce5] bg-white p-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
            1. Chọn bản đồ <span className="text-[#b42318]">*</span>
            <span className="relative block">
              <select required value={mapId} onChange={(event) => handleMapChange(event.target.value)} className={selectClassName}>
                <option value="">Chọn bản đồ</option>
                <option value={sampleMap.id}>{sampleMap.name} · {sampleMap.floor_name}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            </span>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
            2. Chọn quy trình <span className="text-[#b42318]">*</span>
            <span className="relative block">
              <select required disabled={!selectedMap} value={workflowId} onChange={(event) => handleWorkflowChange(event.target.value)} className={`${selectClassName} disabled:cursor-not-allowed disabled:bg-[#f1f2f5] disabled:text-[#858b98]`}>
                <option value="">{selectedMap ? 'Chọn quy trình' : 'Vui lòng chọn bản đồ trước'}</option>
                {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            </span>
          </label>
        </section>

        {!selectedMap || !selectedWorkflow ? (
          <div className="flex min-h-56 items-center justify-center border border-dashed border-[#cfd3dd] bg-white px-6 text-center">
            <div>
              <MapPinned className="mx-auto h-8 w-8 text-[#8a91a0]" />
              <p className="mt-3 text-sm font-semibold text-[#3f4654]">Chọn bản đồ và quy trình để cấu hình mục tiêu nhiệm vụ</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="space-y-4 border border-[#d9dce5] bg-white p-5 sm:p-6">
              <div className="border-b border-[#e4e5ea] pb-4">
                <p className="text-xs font-medium text-[#687386]">{selectedMap.name} · {selectedMap.floor_name}</p>
                <h2 className="mt-1 text-base font-semibold text-[#252933]">{selectedWorkflow.name}</h2>
                <p className="mt-1 text-sm text-[#687386]">Mục tiêu đã chọn sẽ được chuyển đến bước đầu tiên của quy trình.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                  Tên nhiệm vụ <span className="text-[#b42318]">*</span>
                  <input required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                  Mức độ ưu tiên <span className="text-[#b42318]">*</span>
                  <span className="relative block">
                    <select required value={priority} onChange={(event) => setPriority(Number(event.target.value) as JobPriorityValue)} className={selectClassName}>
                      <option value={JobPriority.Low}>Thấp</option>
                      <option value={JobPriority.Normal}>Bình thường</option>
                      <option value={JobPriority.High}>Cao</option>
                      <option value={JobPriority.Critical}>Khẩn cấp</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
                  </span>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                  Robot
                  <span className="relative block">
                    <select value={robotId} onChange={(event) => setRobotId(event.target.value)} className={selectClassName}>
                      <option value="">Chưa phân công</option>
                      {robots.map((id) => <option key={id} value={id}>Robot {id}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
                  </span>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                  Mô tả
                  <textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className={textareaClassName} />
                </label>
                <div className="flex items-center justify-between border-b border-[#e9e9ee] pb-3 text-xs text-[#687386] sm:col-span-2">
                  <span>Người tạo</span>
                  <span className="font-medium text-[#414856]">Thủ thư · Mã 1</span>
                </div>
              </div>

              <div className="border-t border-[#e4e5ea] pt-5">
                {renderTargetSelector()}
              </div>
            </section>

            {error && <p role="alert" className="border border-[#f0c6c3] bg-[#fff2f0] px-4 py-3 text-sm text-[#b42318]">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-[#d9dce5] pt-5">
              <Link to="/tasks" className="inline-flex h-10 items-center border border-[#d7d9e2] bg-white px-5 text-sm font-semibold text-[#3f4654] transition hover:bg-[#f1eff5]">Hủy</Link>
              <button type="submit" className="h-10 bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Tạo nhiệm vụ</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function TaskCreate() {
  const [createPatrol, setCreatePatrol] = useState(false)
  const [createInventory, setCreateInventory] = useState(false)
  if (createPatrol) return <LibraryPatrolJobCreate onBack={() => setCreatePatrol(false)} />
  if (createInventory) return <BookshelfInventoryJobCreate onBack={() => setCreateInventory(false)} />
  return <TaskCreateForm
    onCreatePatrol={() => setCreatePatrol(true)}
    onCreateInventory={() => setCreateInventory(true)}
  />
}

export default TaskCreate
