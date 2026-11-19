import { Activity, ArrowLeft, CalendarDays, ListChecks } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { getWorkflowById } from '@/lib/workflowData'
import { WorkflowStatus, WorkflowStepType } from '@/types/workflow'

const statusStyles: Record<WorkflowStatus, string> = {
  [WorkflowStatus.Draft]: 'bg-[#fff4df] text-[#946200]',
  [WorkflowStatus.Active]: 'bg-[#e8f5ed] text-[#237a45]',
  [WorkflowStatus.Inactive]: 'bg-[#f0eff2] text-[#626776]',
}

const statusLabels: Record<WorkflowStatus, string> = {
  [WorkflowStatus.Draft]: 'Bản nháp',
  [WorkflowStatus.Active]: 'Đang hoạt động',
  [WorkflowStatus.Inactive]: 'Ngừng hoạt động',
}

const stepTypeLabels: Record<string, string> = {
  [WorkflowStepType.Move]: 'Di chuyển',
  [WorkflowStepType.Scan]: 'Quét',
  [WorkflowStepType.ProcessData]: 'Xử lý dữ liệu',
  [WorkflowStepType.Evaluate]: 'Đánh giá',
  [WorkflowStepType.Display]: 'Hiển thị',
  [WorkflowStepType.Wait]: 'Chờ',
  [WorkflowStepType.Notify]: 'Thông báo',
}

function WorkflowDetail() {
  const { id } = useParams()
  const workflow = getWorkflowById(Number(id))

  if (!workflow) {
    return (
      <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/workflows"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#596174] transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Workflows
          </Link>
          <div className="mt-8 border border-[#d9dce5] bg-white px-6 py-12 text-center">
            <h1 className="text-lg font-semibold text-[#252933]">Không tìm thấy quy trình</h1>
            <p className="mt-2 text-sm text-[#687386]">Quy trình có thể đã bị xóa hoặc mã không hợp lệ.</p>
          </div>
        </div>
      </div>
    )
  }

  const stepCount = workflow.tasks.reduce((total, task) => total + task.steps.length, 0)

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/workflows"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#596174] transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Workflows
        </Link>

        <section className="border border-[#d9dce5] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-primary">
                  WF-{workflow.id.toString().padStart(4, '0')}
                </p>
                <h1 className="mt-1 break-words text-2xl font-bold text-[#17181c]">
                  {workflow.name}
                </h1>
                {workflow.description && (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596174]">
                    {workflow.description}
                  </p>
                )}
              </div>
            </div>
            <span className={`inline-flex min-w-[82px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[workflow.status]}`}>
              {statusLabels[workflow.status]}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#e4e5ea] pt-4 text-sm text-[#596174]">
            <div className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#7b8190]" />
              Ngày tạo {new Date(workflow.createdAt).toLocaleDateString('vi-VN')}
            </div>
            <div className="inline-flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[#7b8190]" />
              {workflow.tasks.length} nhiệm vụ
              <span className="text-[#a2a6b0]">·</span>
              {stepCount} bước
            </div>
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#252933]">Trình tự quy trình</h2>
            <p className="mt-1 text-sm text-[#687386]">Nhiệm vụ và bước được hiển thị theo thứ tự thực hiện.</p>
          </div>
        </div>

        {workflow.tasks.length > 0 ? (
          <div className="space-y-4">
            {workflow.tasks
              .slice()
              .sort((first, second) => first.sequenceNo - second.sequenceNo)
              .map((task) => (
                <section key={task.id} className="border border-[#d9dce5] bg-white">
                  <header className="border-b border-[#e4e5ea] bg-[#f5f4f8] px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#687386]">
                      Nhiệm vụ {task.sequenceNo}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#252933]">{task.name}</h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-[#596174]">{task.description}</p>
                    )}
                  </header>

                  {task.steps.length > 0 ? (
                    <ol className="divide-y divide-[#e9e9ee]">
                      {task.steps
                        .slice()
                        .sort((first, second) => first.sequenceNo - second.sequenceNo)
                        .map((step) => (
                          <li key={step.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[44px_minmax(0,1fr)_150px] sm:items-start">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf3fb] text-xs font-semibold text-primary">
                              {step.sequenceNo}
                            </span>
                            <div className="min-w-0">
                              <h4 className="break-words text-sm font-semibold text-[#252933]">{step.name}</h4>
                              {step.description && (
                                <p className="mt-1 text-sm leading-5 text-[#687386]">{step.description}</p>
                              )}
                            </div>
                            <span className="w-fit rounded-sm border border-[#d9dce5] bg-[#fafbfc] px-2 py-1 font-mono text-[11px] font-medium text-[#4f5868]">
                              {stepTypeLabels[step.stepType] || step.stepType}
                            </span>
                          </li>
                        ))}
                    </ol>
                  ) : (
                    <p className="px-5 py-6 text-sm text-[#687386]">Nhiệm vụ này chưa có bước nào.</p>
                  )}
                </section>
              ))}
          </div>
        ) : (
          <div className="border border-[#d9dce5] bg-white px-5 py-10 text-center text-sm text-[#687386]">
            Quy trình này chưa có nhiệm vụ nào.
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkflowDetail