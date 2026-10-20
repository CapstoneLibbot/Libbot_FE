import { useState, type FormEvent } from 'react'
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { saveWorkflow, type WorkflowStepDraft, type WorkflowTaskDraft } from '@/lib/workflowData'
import {
  WorkflowStatus,
  WorkflowStepType,
  type WorkflowStepType as WorkflowStepTypeValue,
} from '@/types/workflow'

const inputClassName = 'h-10 w-full border border-[#d7d9e2] bg-white px-3 text-sm text-[#17181c] outline-none transition placeholder:text-[#858b98] focus:border-primary'
const textAreaClassName = 'min-h-24 w-full resize-y border border-[#d7d9e2] bg-white px-3 py-2 text-sm text-[#17181c] outline-none transition placeholder:text-[#858b98] focus:border-primary'

function createStep(stepType: WorkflowStepTypeValue = WorkflowStepType.Move): WorkflowStepDraft {
  return {
    key: crypto.randomUUID(),
    name: '',
    description: '',
    stepType,
  }
}

function createTask(): WorkflowTaskDraft {
  return {
    key: crypto.randomUUID(),
    name: '',
    description: '',
    steps: [createStep()],
  }
}

function WorkflowCreate() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<WorkflowStatus>(WorkflowStatus.Draft)
  const [tasks, setTasks] = useState<WorkflowTaskDraft[]>([createTask()])
  const updateTask = (taskKey: string, updater: (task: WorkflowTaskDraft) => WorkflowTaskDraft) => {
    setTasks((currentTasks) => currentTasks.map((task) =>
      task.key === taskKey ? updater(task) : task,
    ))
  }

  const updateStep = (
    taskKey: string,
    stepKey: string,
    updater: (step: WorkflowStepDraft) => WorkflowStepDraft,
  ) => {
    updateTask(taskKey, (task) => ({
      ...task,
      steps: task.steps.map((step) => step.key === stepKey ? updater(step) : step),
    }))
  }

  const handleStepTypeChange = (
    taskKey: string,
    stepKey: string,
    stepType: WorkflowStepTypeValue,
  ) => {
    updateStep(taskKey, stepKey, (currentStep) => ({
      ...currentStep,
      stepType,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const workflow = saveWorkflow({ name, description, status, tasks })
    navigate('/workflows', { state: { createdWorkflowId: workflow.id } })
  }

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/workflows')}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#596174] transition hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Workflows
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#17181c]">Create Workflow</h1>
                <p className="mt-0.5 text-sm text-[#596174]">Define workflow details, tasks, and steps.</p>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border border-[#d9dce5] bg-white p-5 sm:p-6">
            <div className="mb-5 border-b border-[#e4e5ea] pb-4">
              <h2 className="text-base font-semibold text-[#252933]">Workflow details</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                Workflow name <span className="text-[#b42318]">*</span>
                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Book Retrieval"
                  className={inputClassName}
                />
                <span className="block text-right text-xs font-normal text-[#858b98]">{name.length}/100</span>
              </label>

              <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                Status
                <span className="relative block">
                  <select
                    value={status}
                    onChange={(event) => setStatus(Number(event.target.value) as WorkflowStatus)}
                    className={`${inputClassName} appearance-none pr-9`}
                  >
                    <option value={WorkflowStatus.Draft}>Draft</option>
                    <option value={WorkflowStatus.Active}>Active</option>
                    <option value={WorkflowStatus.Inactive}>Inactive</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
                </span>
              </label>

              <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                Description
                <textarea
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what this workflow does"
                  className={textAreaClassName}
                />
                <span className="block text-right text-xs font-normal text-[#858b98]">{description.length}/500</span>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#252933]">Tasks</h2>
                <p className="mt-1 text-sm text-[#687386]">Tasks and steps are saved in the order shown.</p>
              </div>
              <button
                type="button"
                onClick={() => setTasks((currentTasks) => [...currentTasks, createTask()])}
                className="inline-flex h-10 items-center gap-2 border border-[#c9d5e8] bg-white px-4 text-sm font-semibold text-primary transition hover:bg-[#f2f6fc]"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            </div>

            {tasks.map((task, taskIndex) => (
              <article key={task.key} className="border border-[#d9dce5] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e5ea] bg-[#f5f4f8] px-5 py-3">
                  <h3 className="text-sm font-semibold text-[#252933]">Task {taskIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => setTasks((currentTasks) => currentTasks.filter((item) => item.key !== task.key))}
                    disabled={tasks.length === 1}
                    aria-label={`Remove task ${taskIndex + 1}`}
                    title="Remove task"
                    className="inline-flex h-8 w-8 items-center justify-center text-[#687386] transition hover:bg-white hover:text-[#b42318] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-5 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                      Task name <span className="text-[#b42318]">*</span>
                      <input
                        required
                        maxLength={100}
                        value={task.name}
                        onChange={(event) => updateTask(task.key, (currentTask) => ({ ...currentTask, name: event.target.value }))}
                        placeholder="e.g. Navigate to shelf"
                        className={inputClassName}
                      />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                      Task description
                      <input
                        maxLength={500}
                        value={task.description}
                        onChange={(event) => updateTask(task.key, (currentTask) => ({ ...currentTask, description: event.target.value }))}
                        placeholder="Optional"
                        className={inputClassName}
                      />
                    </label>
                  </div>

                  <div className="border-t border-[#e4e5ea] pt-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-[#3f4654]">Steps</h4>
                      <button
                        type="button"
                        onClick={() => updateTask(task.key, (currentTask) => ({ ...currentTask, steps: [...currentTask.steps, createStep()] }))}
                        className="inline-flex h-9 items-center gap-2 border border-[#d7d9e2] bg-white px-3 text-sm font-medium text-[#3f4654] transition hover:bg-[#f5f4f8]"
                      >
                        <Plus className="h-4 w-4" />
                        Add step
                      </button>
                    </div>

                    <div className="divide-y divide-[#e4e5ea]">
                      {task.steps.map((step, stepIndex) => (
                        <div key={step.key} className="space-y-4 py-5 first:pt-2 last:pb-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h5 className="text-sm font-semibold text-[#252933]">Step {stepIndex + 1}</h5>
                            <button
                              type="button"
                              onClick={() => updateTask(task.key, (currentTask) => ({ ...currentTask, steps: currentTask.steps.filter((item) => item.key !== step.key) }))}
                              disabled={task.steps.length === 1}
                              aria-label={`Remove task ${taskIndex + 1}, step ${stepIndex + 1}`}
                              title="Remove step"
                              className="inline-flex h-8 w-8 items-center justify-center text-[#687386] transition hover:bg-[#f5f4f8] hover:text-[#b42318] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                              Step name <span className="text-[#b42318]">*</span>
                              <input
                                required
                                maxLength={100}
                                value={step.name}
                                onChange={(event) => updateStep(task.key, step.key, (currentStep) => ({ ...currentStep, name: event.target.value }))}
                                placeholder="e.g. Move to shelf"
                                className={inputClassName}
                              />
                            </label>
                            <label className="space-y-1.5 text-sm font-medium text-[#3f4654]">
                              Step type <span className="text-[#b42318]">*</span>
                              <span className="relative block">
                                <select
                                  value={step.stepType}
                                  onChange={(event) => handleStepTypeChange(task.key, step.key, event.target.value as WorkflowStepTypeValue)}
                                  className={`${inputClassName} appearance-none pr-9`}
                                >
                                  {Object.values(WorkflowStepType).map((stepType) => (
                                    <option key={stepType} value={stepType}>{stepType}</option>
                                  ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" />
                              </span>
                            </label>
                            <label className="space-y-1.5 text-sm font-medium text-[#3f4654] sm:col-span-2">
                              Step description
                              <input
                                maxLength={500}
                                value={step.description}
                                onChange={(event) => updateStep(task.key, step.key, (currentStep) => ({ ...currentStep, description: event.target.value }))}
                                placeholder="Optional"
                                className={inputClassName}
                              />
                            </label>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-[#d9dce5] pt-5">
            <button
              type="button"
              onClick={() => navigate('/workflows')}
              className="h-10 border border-[#d7d9e2] bg-white px-5 text-sm font-semibold text-[#3f4654] transition hover:bg-[#f1eff5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Create Workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorkflowCreate