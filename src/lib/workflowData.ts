import {
  WorkflowStatus,
  WorkflowStepType,
  type WorkflowRecord,
} from '@/types/workflow'

const STORAGE_KEY = 'libot.workflows'

type SampleStep = {
  name: string
  description: string
  stepType: WorkflowStepType
}

type SampleWorkflow = {
  id: number
  name: string
  description: string
  createdAt: string
  tasks: {
    name: string
    description: string
    stepCount: number
  }[]
  steps: SampleStep[]
}

function createSampleWorkflow(sample: SampleWorkflow): WorkflowRecord {
  let stepOffset = 0
  let nextStepId = sample.id * 1000 + 1

  return {
    id: sample.id,
    name: sample.name,
    description: sample.description,
    status: WorkflowStatus.Active,
    createdAt: sample.createdAt,
    tasks: sample.tasks.map((task, taskIndex) => {
      const taskId = sample.id * 100 + taskIndex + 1
      const taskSteps = sample.steps.slice(stepOffset, stepOffset + task.stepCount)
      stepOffset += task.stepCount

      return {
        id: taskId,
        workflowId: sample.id,
        name: task.name,
        description: task.description,
        sequenceNo: taskIndex + 1,
        createdAt: sample.createdAt,
        steps: taskSteps.map((step, stepIndex) => ({
          id: nextStepId++,
          workflowTaskId: taskId,
          name: step.name,
          description: step.description,
          sequenceNo: stepIndex + 1,
          stepType: step.stepType,
          createdAt: sample.createdAt,
        })),
      }
    }),
  }
}

const sampleWorkflows: WorkflowRecord[] = [
  createSampleWorkflow({
    id: 1,
    name: 'Tìm và hướng dẫn đến sách',
    description: 'Tìm sách, dẫn độc giả đến vị trí sách và thu thập đánh giá.',
    createdAt: '2026-10-02T09:00:00.000Z',
    tasks: [
      { name: 'Hiển thị thông tin sách đã chọn', description: 'Lấy và hiển thị thông tin của cuốn sách đã được chọn.', stepCount: 2 },
      { name: 'Hướng dẫn bạn đọc đến sách', description: 'Xử lý lựa chọn vị trí, dẫn đường và thông báo khi đến nơi.', stepCount: 10 },
      { name: 'Thu thập đánh giá của bạn đọc', description: 'Hiển thị màn hình đánh giá, nhận và lưu đánh giá.', stepCount: 4 },
    ],
    steps: [
      { name: 'Tải thông tin sách đã chọn', description: 'Lấy thông tin sách theo book_id được truyền vào Job.', stepType: WorkflowStepType.ProcessData },
      { name: 'Hiển thị thông tin sách', description: 'Hiển thị thông tin và các lựa chọn tiếp theo.', stepType: WorkflowStepType.Display },
      { name: 'Chờ thao tác với sách', description: 'Chờ bạn đọc chọn xem vị trí hoặc đánh giá.', stepType: WorkflowStepType.Wait },
      { name: 'Xử lý thao tác với sách', description: 'Nếu chọn đánh giá thì chuyển tới phần đánh giá; nếu không thì hiển thị vị trí sách.', stepType: WorkflowStepType.Evaluate },
      { name: 'Hiển thị vị trí sách', description: 'Hiển thị vị trí sách trên bản đồ.', stepType: WorkflowStepType.Display },
      { name: 'Chờ thao tác trên bản đồ', description: 'Chờ bắt đầu dẫn đường hoặc gửi đánh giá.', stepType: WorkflowStepType.Wait },
      { name: 'Xử lý thao tác trên bản đồ', description: 'Nếu chọn đánh giá thì chuyển tới phần đánh giá; nếu không thì bắt đầu dẫn đường.', stepType: WorkflowStepType.Evaluate },
      { name: 'Hiển thị lộ trình', description: 'Hiển thị lộ trình đến kệ sách.', stepType: WorkflowStepType.Display },
      { name: 'Di chuyển đến kệ sách', description: 'Điều hướng robot đến vị trí sách.', stepType: WorkflowStepType.Move },
      { name: 'Hiển thị thông báo đến nơi', description: 'Thông báo robot đã đến vị trí sách.', stepType: WorkflowStepType.Display },
      { name: 'Thông báo đã đến nơi', description: 'Phát thông báo robot đã đến nơi.', stepType: WorkflowStepType.Notify },
      { name: 'Chờ trước khi đánh giá', description: 'Chờ 15 giây trước khi tiếp tục.', stepType: WorkflowStepType.Wait },
      { name: 'Hiển thị màn hình đánh giá', description: 'Hiển thị màn hình đánh giá trải nghiệm.', stepType: WorkflowStepType.Display },
      { name: 'Chờ gửi đánh giá', description: 'Chờ bạn đọc gửi đánh giá; hết thời gian thì về màn hình chính.', stepType: WorkflowStepType.Wait },
      { name: 'Lưu đánh giá', description: 'Lưu đánh giá vào nghiệp vụ.', stepType: WorkflowStepType.ProcessData },
      { name: 'Quay về màn hình chính', description: 'Đưa giao diện robot về màn hình chính.', stepType: WorkflowStepType.Display },
    ],
  }),
  createSampleWorkflow({
    id: 3,
    name: 'Kiểm kê kệ sách',
    description: 'Di chuyển qua các kệ, quét sách, đối soát và lập báo cáo kiểm kê.',
    createdAt: '2026-10-02T09:10:00.000Z',
    tasks: [
      { name: 'Chuẩn bị phạm vi kiểm kê', description: 'Xác định phạm vi và điều hướng đến kệ cần kiểm kê.', stepCount: 2 },
      { name: 'Quét và đối soát sách trên kệ', description: 'Quét tầng kệ và sách, đối soát rồi cập nhật kết quả.', stepCount: 5 },
      { name: 'Báo cáo kết quả kiểm kê', description: 'Tổng hợp kết quả và thông báo hoàn tất kiểm kê.', stepCount: 2 },
    ],
    steps: [
      { name: 'Xác định phạm vi kiểm kê', description: 'Xác định phạm vi kệ cần kiểm kê.', stepType: WorkflowStepType.ProcessData },
      { name: 'Di chuyển đến kệ tiếp theo', description: 'Di chuyển đến kệ tiếp theo trong phạm vi.', stepType: WorkflowStepType.Move },
      { name: 'Quét tầng kệ', description: 'Quét mã nhận diện tầng kệ.', stepType: WorkflowStepType.Scan },
      { name: 'Quét sách', description: 'Thu thập mã nhận diện sách trên kệ.', stepType: WorkflowStepType.Scan },
      { name: 'Xác minh sách đã quét', description: 'Đối soát sách quét được với dữ liệu kiểm kê.', stepType: WorkflowStepType.ProcessData },
      { name: 'Đánh giá vấn đề kiểm kê', description: 'Kiểm tra kết quả đối soát để chọn bước tiếp theo.', stepType: WorkflowStepType.Evaluate },
      { name: 'Cập nhật trạng thái kiểm kê', description: 'Cập nhật trạng thái và vị trí sách sau đối soát.', stepType: WorkflowStepType.ProcessData },
      { name: 'Tạo báo cáo kiểm kê', description: 'Tổng hợp kết quả kiểm kê thành báo cáo.', stepType: WorkflowStepType.ProcessData },
      { name: 'Thông báo hoàn tất kiểm kê', description: 'Thông báo hoàn tất kiểm kê.', stepType: WorkflowStepType.Notify },
    ],
  }),
  createSampleWorkflow({
    id: 4,
    name: 'Tuần tra thư viện',
    description: 'Tuần tra thư viện, ghi nhận tình trạng bất thường và lập báo cáo.',
    createdAt: '2026-10-02T09:15:00.000Z',
    tasks: [
      { name: 'Chuẩn bị kế hoạch tuần tra', description: 'Xác định phạm vi và lập kế hoạch tuyến tuần tra.', stepCount: 2 },
      { name: 'Tuần tra và theo dõi lộ trình', description: 'Di chuyển, ghi nhận quan sát, cập nhật và đánh giá độ phủ tuyến.', stepCount: 4 },
      { name: 'Báo cáo kết quả tuần tra', description: 'Tổng hợp sự kiện tuần tra và thông báo hoàn tất.', stepCount: 2 },
    ],
    steps: [
      { name: 'Xác định phạm vi tuần tra', description: 'Xác định phạm vi và các điểm cần tuần tra.', stepType: WorkflowStepType.ProcessData },
      { name: 'Lập kế hoạch tuyến tuần tra', description: 'Tạo kế hoạch các tuyến tuần tra cần thực hiện.', stepType: WorkflowStepType.ProcessData },
      { name: 'Tuần tra và quan sát', description: 'Di chuyển theo tuyến và ghi nhận quan sát.', stepType: WorkflowStepType.Move },
      { name: 'Phân loại ghi nhận tuần tra', description: 'Phân loại các quan sát thành sự kiện.', stepType: WorkflowStepType.ProcessData },
      { name: 'Ghi nhận độ phủ tuyến', description: 'Cập nhật trạng thái độ phủ của tuyến.', stepType: WorkflowStepType.ProcessData },
      { name: 'Kiểm tra tuyến còn lại', description: 'Kiểm tra còn tuyến nào cần tuần tra không.', stepType: WorkflowStepType.Evaluate },
      { name: 'Tạo báo cáo tuần tra', description: 'Tổng hợp sự kiện và độ phủ tuần tra.', stepType: WorkflowStepType.ProcessData },
      { name: 'Thông báo hoàn tất tuần tra', description: 'Thông báo hoàn tất tuần tra.', stepType: WorkflowStepType.Notify },
    ],
  }),
  createSampleWorkflow({
    id: 5,
    name: 'Đưa robot về trạm sạc',
    description: 'Đưa robot về trạm sạc, thông báo trạng thái và chờ cắm sạc.',
    createdAt: '2026-10-02T09:20:00.000Z',
    tasks: [
      { name: 'Quay về trạm sạc', description: 'Điều hướng robot quay về trạm sạc.', stepCount: 1 },
      { name: 'Chờ kết nối sạc', description: 'Hiển thị trạng thái, thông báo và theo dõi kết nối sạc.', stepCount: 4 },
    ],
    steps: [
      { name: 'Di chuyển đến trạm sạc', description: 'Di chuyển robot về khu vực trạm sạc.', stepType: WorkflowStepType.Move },
      { name: 'Hiển thị trạng thái sạc', description: 'Cập nhật giao diện chờ sạc.', stepType: WorkflowStepType.Display },
      { name: 'Thông báo chờ sạc', description: 'Thông báo robot đang chờ được cắm sạc.', stepType: WorkflowStepType.Notify },
      { name: 'Kiểm tra kết nối sạc', description: 'Kiểm tra trạng thái kết nối sạc.', stepType: WorkflowStepType.Evaluate },
      { name: 'Thông báo bắt đầu sạc', description: 'Thông báo robot đã bắt đầu sạc.', stepType: WorkflowStepType.Notify },
    ],
  }),
]

export type WorkflowStepDraft = {
  key: string
  name: string
  description: string
  stepType: WorkflowStepType
}

export type WorkflowTaskDraft = {
  key: string
  name: string
  description: string
  steps: WorkflowStepDraft[]
}

export type CreateWorkflowDraft = {
  name: string
  description: string
  status: WorkflowStatus
  tasks: WorkflowTaskDraft[]
}

export function getWorkflows(): WorkflowRecord[] {
  try {
    const storedWorkflows = localStorage.getItem(STORAGE_KEY)
    if (!storedWorkflows) return sampleWorkflows

    const stored = JSON.parse(storedWorkflows) as WorkflowRecord[]
    const sampleIds = new Set(sampleWorkflows.map((workflow) => workflow.id))
    const workflows = [
      ...sampleWorkflows,
      ...stored.filter((workflow) => workflow.id !== 2 && !sampleIds.has(workflow.id)),
    ]
    return workflows.map((workflow) => ({
      ...workflow,
      tasks: workflow.tasks.map((task) => ({
        ...task,
        steps: task.steps.map((step) => ({
          id: step.id,
          workflowTaskId: step.workflowTaskId,
          name: step.name,
          description: step.description,
          sequenceNo: step.sequenceNo,
          stepType: step.stepType,
          createdAt: step.createdAt,
        })),
      })),
    }))
  } catch {
    return sampleWorkflows
  }
}

export function getWorkflowById(id: number): WorkflowRecord | undefined {
  return getWorkflows().find((workflow) => workflow.id === id)
}

export function saveWorkflow(draft: CreateWorkflowDraft): WorkflowRecord {
  const workflows = getWorkflows()
  const workflowId = Math.max(0, ...workflows.map((workflow) => workflow.id)) + 1
  const nextTaskId = Math.max(
    0,
    ...workflows.flatMap((workflow) => workflow.tasks.map((task) => task.id)),
  ) + 1
  let taskId = nextTaskId
  let stepId = Math.max(
    0,
    ...workflows.flatMap((workflow) =>
      workflow.tasks.flatMap((task) => task.steps.map((step) => step.id)),
    ),
  ) + 1

  const createdAt = new Date().toISOString()

  const workflow: WorkflowRecord = {
    id: workflowId,
    name: draft.name.trim(),
    description: draft.description.trim(),
    status: draft.status,
    createdAt,
    tasks: draft.tasks.map((task, taskIndex) => {
      const currentTaskId = taskId
      taskId += 1

      return {
        id: currentTaskId,
        workflowId,
        name: task.name.trim(),
        description: task.description.trim(),
        sequenceNo: taskIndex + 1,
        createdAt,
        steps: task.steps.map((step, stepIndex) => {
          const record: WorkflowRecord['tasks'][number]['steps'][number] = {
            id: stepId,
            workflowTaskId: currentTaskId,
            name: step.name.trim(),
            description: step.description.trim(),
            sequenceNo: stepIndex + 1,
            stepType: step.stepType,
            createdAt,
          }
          stepId += 1
          return record
        }),
      }
    }),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...workflows, workflow]))
  return workflow
}