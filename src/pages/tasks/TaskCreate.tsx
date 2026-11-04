import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, ChevronDown, MapPinned, Search, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { sampleBooks } from '@/lib/bookData'
import { getJobs, saveJob } from '@/lib/jobData'
import { initialAreas, initialShelves } from '@/lib/mapData'
import { initialEndpoints, sampleMap } from '@/pages/maps/MapDetail'
import { getWorkflows } from '@/lib/workflowData'
import { JobPriority } from '@/types/job'
import type { JobPriority as JobPriorityValue, JobStepParameters } from '@/types/job'
import { WorkflowStatus, WorkflowStepType } from '@/types/workflow'
import type { WorkflowRecord } from '@/types/workflow'
import LibraryPatrolMissionCreate from './LibraryPatrolMissionCreate'

const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#252933] outline-none placeholder:text-[#89909d] focus:border-primary'
const selectClassName = 'h-10 w-full appearance-none border border-[#d7d9e2] bg-white px-3 pr-9 text-sm text-[#252933] outline-none focus:border-primary'
const textareaClassName = 'min-h-24 w-full resize-y border border-[#d7d9e2] bg-white px-3 py-2 text-sm text-[#252933] outline-none placeholder:text-[#89909d] focus:border-primary'

function TaskCreateForm({ onCreatePatrol }: { onCreatePatrol: () => void }) {
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
  const [areaQuery, setAreaQuery] = useState('')
  const [areaId, setAreaId] = useState('')
  const [shelfIds, setShelfIds] = useState<number[]>([])
  const [patrolEndpointIds, setPatrolEndpointIds] = useState<number[]>([])
  const [chargingEndpointId, setChargingEndpointId] = useState('')
  const [error, setError] = useState('')

  const selectedMap = mapId === String(sampleMap.id) ? sampleMap : null
  const selectedWorkflow = workflows.find((workflow) => workflow.id === Number(workflowId)) ?? null
  const selectedBook = sampleBooks.find((book) => book.id === Number(bookId))
  const selectedArea = initialAreas.find((area) => area.id === Number(areaId))

  const matchingBooks = sampleBooks.filter((book) => {
    const query = bookQuery.trim().toLowerCase()
    return !query || [book.id.toString(), book.title, book.author, book.classification].some((value) => value.toLowerCase().includes(query))
  })

  const matchingAreas = initialAreas.filter((area) => {
    const query = areaQuery.trim().toLowerCase()
    return !query || [area.id.toString(), area.name, area.code, area.description ?? ''].some((value) => value.toLowerCase().includes(query))
  })

  const clearTarget = () => {
    setBookQuery('')
    setBookId('')
    setAreaQuery('')
    setAreaId('')
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
    if (!firstStep) throw new Error('The selected workflow has no steps.')

    switch (workflow.id) {
      case 1:
        if (!selectedBook) throw new Error('Select a book for this task.')
        if (firstStep.stepType !== WorkflowStepType.ProcessData) throw new Error('The book workflow must start with PROCESS_DATA.')
        return {
          stepId: firstStep.id,
          parameters: { action: 'GET_BOOK_DETAIL', payload: { book_id: selectedBook.id } },
        }
      case 2:
        if (!selectedArea) throw new Error('Select an area for this task.')
        if (firstStep.stepType !== WorkflowStepType.Display) throw new Error('The area workflow must start with DISPLAY.')
        return {
          stepId: firstStep.id,
          parameters: {
            ui_screen: 'FACILITY_INFO',
            data: {
              facility_id: selectedArea.id,
              name: selectedArea.name,
              type: 'AREA',
              description: selectedArea.description,
              location: selectedArea.endpoint_id,
            },
          },
        }
      case 3:
        if (shelfIds.length === 0) throw new Error('Select at least one shelf to inventory.')
        if (firstStep.stepType !== WorkflowStepType.ProcessData) throw new Error('The inventory workflow must start with PROCESS_DATA.')
        return {
          stepId: firstStep.id,
          parameters: {
            action: 'RESOLVE_INVENTORY_SCOPE',
            payload: { scope_type: 'SHELVES', floor_id: 1, target_shelves: shelfIds },
          },
        }
      case 4:
        if (patrolEndpointIds.length === 0) throw new Error('Select at least one endpoint to patrol.')
        if (firstStep.stepType !== WorkflowStepType.ProcessData) throw new Error('The patrol workflow must start with PROCESS_DATA.')
        return {
          stepId: firstStep.id,
          parameters: {
            action: 'PATROL_SCOPE',
            payload: { scope_type: 'ENDPOINTS', floor_id: 1, target_endpoints: patrolEndpointIds },
          },
        }
      case 5:
        if (!chargingEndpointId.trim()) throw new Error('Enter the charging station endpoint.')
        if (firstStep.stepType !== WorkflowStepType.Move) throw new Error('The charging workflow must start with MOVE.')
        return {
          stepId: firstStep.id,
          parameters: { endpoint_id: chargingEndpointId.trim(), speed_mode: 'NORMAL' },
        }
      default:
        throw new Error('No target configuration is available for this workflow.')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!selectedMap || !selectedWorkflow) {
      setError('Select a map first, then choose a workflow.')
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
      setError(submitError instanceof Error ? submitError.message : 'Unable to create task.')
    }
  }

  const renderTargetSelector = () => {
    if (!selectedWorkflow) return null

    if (selectedWorkflow.id === 1) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#252933]">Select a book</h3>
            <p className="mt-1 text-xs text-[#687386]">The selected book ID is passed to the workflow to load its details.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input value={bookQuery} onChange={(event) => setBookQuery(event.target.value)} placeholder="Search by title, author, ID or classification..." aria-label="Search books" className={`${inputClassName} pl-9`} />
          </div>
          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="max-h-[360px] divide-y divide-[#e9e9ee] overflow-y-auto">
              {matchingBooks.length > 0 ? matchingBooks.map((book) => (
                <button key={book.id} type="button" onClick={() => setBookId(String(book.id))} aria-pressed={bookId === String(book.id)} className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#f8f9fb] ${bookId === String(book.id) ? 'bg-[#eff5ff] ring-1 ring-inset ring-primary' : ''}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#252933]">{book.title}</span>
                    <span className="mt-1 block truncate text-xs text-[#687386]">{book.author}</span>
                    <span className="mt-2 block text-[11px] text-[#687386]">ID {book.id} · {book.classification} · {book.shelf}, Level {book.shelfLevel}</span>
                  </span>
                  {bookId === String(book.id) && <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />}
                </button>
              )) : (
                <p className="px-4 py-8 text-center text-sm text-[#687386]">No books match your search.</p>
              )}
            </div>
          </div>
          {selectedBook && (
            <div className="border-l-2 border-primary bg-[#f4f7fc] px-4 py-3 text-sm">
              <p className="font-semibold text-[#252933]">Selected: {selectedBook.title}</p>
              <p className="mt-1 text-xs text-[#687386]">book_id {selectedBook.id} · Destination endpoint EP-{selectedBook.endpointId}</p>
            </div>
          )}
        </div>
      )
    }

    if (selectedWorkflow.id === 2) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#252933]">Select an area</h3>
            <p className="mt-1 text-xs text-[#687386]">The selected area ID and information are passed to the facility workflow.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            <input value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="Search by area name, code or ID..." aria-label="Search areas" className={`${inputClassName} pl-9`} />
          </div>
          <div className="overflow-hidden border border-[#d9dce5] bg-white">
            <div className="divide-y divide-[#e9e9ee]">
              {matchingAreas.length > 0 ? matchingAreas.map((area) => (
                <button key={area.id} type="button" onClick={() => setAreaId(String(area.id))} aria-pressed={areaId === String(area.id)} className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#f8f9fb] ${areaId === String(area.id) ? 'bg-[#eff5ff] ring-1 ring-inset ring-primary' : ''}`}>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#252933]">{area.name}</span>
                    <span className="mt-1 block text-xs text-[#687386]">{area.code} · Endpoint EP-{area.endpoint_id}</span>
                    {area.description && <span className="mt-1 block text-xs text-[#687386]">{area.description}</span>}
                  </span>
                  {areaId === String(area.id) && <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />}
                </button>
              )) : (
                <p className="px-4 py-8 text-center text-sm text-[#687386]">No areas match your search.</p>
              )}
            </div>
          </div>
          {selectedArea && <p className="border-l-2 border-primary bg-[#f4f7fc] px-4 py-3 text-sm font-semibold text-[#252933]">Selected: {selectedArea.name} · facility_id {selectedArea.id}</p>}
        </div>
      )
    }

    if (selectedWorkflow.id === 3) {
      return (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-[#252933]">Select shelves to inventory</h3>
            <p className="mt-1 text-xs text-[#687386]">Choose one or more target shelves for the inventory scope.</p>
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
          <p className="text-xs text-[#687386]">{shelfIds.length} shelf{ shelfIds.length === 1 ? '' : 'ves'} selected</p>
        </div>
      )
    }

    if (selectedWorkflow.id === 4) {
      return (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-[#252933]">Select patrol endpoints</h3>
            <p className="mt-1 text-xs text-[#687386]">Choose one or more map endpoints as patrol targets.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {initialEndpoints.map((endpoint) => (
              <label key={endpoint.id} className="flex cursor-pointer items-start gap-3 border border-[#d9dce5] bg-white px-3 py-2.5 text-sm hover:bg-[#f8f9fb]">
                <input type="checkbox" checked={patrolEndpointIds.includes(endpoint.id)} onChange={() => toggleId(endpoint.id, patrolEndpointIds, setPatrolEndpointIds)} className="mt-0.5 h-4 w-4 accent-primary" />
                <span className="min-w-0"><span className="block font-medium text-[#252933]">{endpoint.name}</span><span className="text-xs text-[#687386]">{endpoint.code}</span></span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[#687386]">{patrolEndpointIds.length} endpoint{patrolEndpointIds.length === 1 ? '' : 's'} selected</p>
        </div>
      )
    }

    if (selectedWorkflow.id === 5) {
      return (
        <label className="block max-w-xl space-y-1.5 text-sm font-medium text-[#3f4654]">
          Charging station endpoint <span className="text-[#b42318">*</span>
          <input required value={chargingEndpointId} onChange={(event) => setChargingEndpointId(event.target.value)} placeholder="CHARGING_STATION" className={inputClassName} />
          <span className="block text-xs font-normal text-[#687386]">Uses the charging station endpoint defined by the robot/map configuration.</span>
        </label>
      )
    }

    return <p className="text-sm text-[#687386]">No target selector is configured for this workflow.</p>
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <Link to="/tasks" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#596174] transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10"><MapPinned className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold text-[#17181c]">Create Task</h1>
              <p className="mt-0.5 text-sm text-[#596174]">Create a robot task from a workflow and its target.</p>
            </div>
            </div>
            <button type="button" onClick={onCreatePatrol} className="inline-flex h-10 items-center gap-2 border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary hover:bg-primary/10">
              <ShieldCheck className="h-4 w-4" />Create Library Patrol mission
            </button>
          </div>
        </header>

        <section className="grid gap-4 border border-[#d9dce5] bg-white p-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
            1. Select map <span className="text-[#b42318]">*</span>
            <span className="relative block">
              <select required value={mapId} onChange={(event) => handleMapChange(event.target.value)} className={selectClassName}>
                <option value="">Choose a map</option>
                <option value={sampleMap.id}>{sampleMap.name} · {sampleMap.floor_name}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
            </span>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
            2. Select workflow <span className="text-[#b42318]">*</span>
            <span className="relative block">
              <select required disabled={!selectedMap} value={workflowId} onChange={(event) => handleWorkflowChange(event.target.value)} className={`${selectClassName} disabled:cursor-not-allowed disabled:bg-[#f1f2f5] disabled:text-[#858b98]`}>
                <option value="">{selectedMap ? 'Choose a workflow' : 'Select a map first'}</option>
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
              <p className="mt-3 text-sm font-semibold text-[#3f4654]">Select a map and workflow to choose this task's target</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="space-y-4 border border-[#d9dce5] bg-white p-5 sm:p-6">
              <div className="border-b border-[#e4e5ea] pb-4">
                <p className="text-xs font-medium text-[#687386]">{selectedMap.name} · {selectedMap.floor_name}</p>
                <h2 className="mt-1 text-base font-semibold text-[#252933]">{selectedWorkflow.name}</h2>
                <p className="mt-1 text-sm text-[#687386]">The selected target will be passed to this workflow's first step.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                  Task name <span className="text-[#b42318]">*</span>
                  <input required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                  Priority <span className="text-[#b42318]">*</span>
                  <span className="relative block">
                    <select required value={priority} onChange={(event) => setPriority(Number(event.target.value) as JobPriorityValue)} className={selectClassName}>
                      <option value={JobPriority.Low}>Low</option>
                      <option value={JobPriority.Normal}>Normal</option>
                      <option value={JobPriority.High}>High</option>
                      <option value={JobPriority.Critical}>Critical</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
                  </span>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                  Robot
                  <span className="relative block">
                    <select value={robotId} onChange={(event) => setRobotId(event.target.value)} className={selectClassName}>
                      <option value="">Unassigned</option>
                      {robots.map((id) => <option key={id} value={id}>Robot {id}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
                  </span>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                  Description
                  <textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className={textareaClassName} />
                </label>
                <div className="flex items-center justify-between border-b border-[#e9e9ee] pb-3 text-xs text-[#687386] sm:col-span-2">
                  <span>Created by</span>
                  <span className="font-medium text-[#414856]">Librarian · ID 1</span>
                </div>
              </div>

              <div className="border-t border-[#e4e5ea] pt-5">
                {renderTargetSelector()}
              </div>
            </section>

            {error && <p role="alert" className="border border-[#f0c6c3] bg-[#fff2f0] px-4 py-3 text-sm text-[#b42318]">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-[#d9dce5] pt-5">
              <Link to="/tasks" className="inline-flex h-10 items-center border border-[#d7d9e2] bg-white px-5 text-sm font-semibold text-[#3f4654] transition hover:bg-[#f1eff5]">Cancel</Link>
              <button type="submit" className="h-10 bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Create Task</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function TaskCreate() {
  const [createPatrol, setCreatePatrol] = useState(false)
  return createPatrol
    ? <LibraryPatrolMissionCreate onBack={() => setCreatePatrol(false)} />
    : <TaskCreateForm onCreatePatrol={() => setCreatePatrol(true)} />
}

export default TaskCreate
