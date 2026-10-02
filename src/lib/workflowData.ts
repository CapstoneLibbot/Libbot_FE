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
    name: 'Search & Guide to Book',
    description: 'Tìm sách, dẫn độc giả đến vị trí sách và thu thập đánh giá.',
    createdAt: '2026-10-02T09:00:00.000Z',
    tasks: [
      { name: 'Show selected book information', description: 'Lấy và hiển thị thông tin của cuốn sách đã được chọn.', stepCount: 2 },
      { name: 'Guide the reader to the book', description: 'Xử lý lựa chọn vị trí, dẫn đường và thông báo khi đến nơi.', stepCount: 10 },
      { name: 'Collect reader feedback', description: 'Hiển thị màn hình đánh giá, nhận và lưu đánh giá.', stepCount: 4 },
    ],
    steps: [
      { name: 'Load selected book details', description: 'Lấy thông tin sách theo book_id được truyền vào Job.', stepType: WorkflowStepType.ProcessData },
      { name: 'Show book information', description: 'Hiển thị thông tin và các lựa chọn tiếp theo.', stepType: WorkflowStepType.Display },
      { name: 'Wait for book action', description: 'Chờ độc giả chọn xem vị trí hoặc đánh giá.', stepType: WorkflowStepType.Wait },
      { name: 'Evaluate book action', description: 'Nếu chọn đánh giá thì chuyển tới phần rating; nếu không thì hiển thị vị trí sách.', stepType: WorkflowStepType.Evaluate },
      { name: 'Show book location', description: 'Hiển thị vị trí sách trên bản đồ.', stepType: WorkflowStepType.Display },
      { name: 'Wait for map action', description: 'Chờ bắt đầu dẫn đường hoặc gửi đánh giá.', stepType: WorkflowStepType.Wait },
      { name: 'Evaluate map action', description: 'Nếu chọn đánh giá thì chuyển tới phần rating; nếu không thì bắt đầu dẫn đường.', stepType: WorkflowStepType.Evaluate },
      { name: 'Show navigation route', description: 'Hiển thị lộ trình đến kệ sách.', stepType: WorkflowStepType.Display },
      { name: 'Navigate to book shelf', description: 'Điều hướng robot đến vị trí sách.', stepType: WorkflowStepType.Move },
      { name: 'Show arrival screen', description: 'Thông báo robot đã đến vị trí sách.', stepType: WorkflowStepType.Display },
      { name: 'Announce arrival', description: 'Phát thông báo robot đã đến nơi.', stepType: WorkflowStepType.Notify },
      { name: 'Wait before rating', description: 'Chờ 15 giây trước khi tiếp tục.', stepType: WorkflowStepType.Wait },
      { name: 'Show rating screen', description: 'Hiển thị màn hình đánh giá trải nghiệm.', stepType: WorkflowStepType.Display },
      { name: 'Wait for rating submission', description: 'Chờ độc giả gửi đánh giá; hết thời gian thì về Home.', stepType: WorkflowStepType.Wait },
      { name: 'Save rating', description: 'Lưu đánh giá vào nghiệp vụ.', stepType: WorkflowStepType.ProcessData },
      { name: 'Return to home screen', description: 'Đưa giao diện robot về màn hình chính.', stepType: WorkflowStepType.Display },
    ],
  }),
  createSampleWorkflow({
    id: 2,
    name: 'Search & Guide to Facility/Area',
    description: 'Tìm và dẫn độc giả đến quầy thủ thư, phòng đọc hoặc khu vực tiện ích.',
    createdAt: '2026-10-02T09:05:00.000Z',
    tasks: [
      { name: 'Show selected area information', description: 'Hiển thị thông tin của khu vực đã được chọn.', stepCount: 3 },
      { name: 'Guide the visitor to the area', description: 'Xử lý lựa chọn vị trí, dẫn đường và thông báo khi đến nơi.', stepCount: 8 },
      { name: 'Collect visitor feedback', description: 'Hiển thị màn hình đánh giá, nhận và lưu đánh giá.', stepCount: 4 },
    ],
    steps: [
      { name: 'Show facility information', description: 'Hiển thị thông tin khu vực theo facility_id được truyền vào Job.', stepType: WorkflowStepType.Display },
      { name: 'Wait for facility action', description: 'Chờ khách chọn xem vị trí hoặc đánh giá.', stepType: WorkflowStepType.Wait },
      { name: 'Evaluate facility action', description: 'Nếu chọn đánh giá thì chuyển tới phần rating; nếu không thì hiển thị vị trí.', stepType: WorkflowStepType.Evaluate },
      { name: 'Show facility location', description: 'Hiển thị vị trí tiện ích trên bản đồ.', stepType: WorkflowStepType.Display },
      { name: 'Wait for map action', description: 'Chờ bắt đầu dẫn đường hoặc gửi đánh giá.', stepType: WorkflowStepType.Wait },
      { name: 'Evaluate map action', description: 'Nếu chọn đánh giá thì chuyển tới phần rating; nếu không thì bắt đầu dẫn đường.', stepType: WorkflowStepType.Evaluate },
      { name: 'Show navigation route', description: 'Hiển thị lộ trình đến tiện ích.', stepType: WorkflowStepType.Display },
      { name: 'Navigate to facility', description: 'Điều hướng robot đến khu vực đã chọn.', stepType: WorkflowStepType.Move },
      { name: 'Show arrival screen', description: 'Thông báo robot đã đến khu vực.', stepType: WorkflowStepType.Display },
      { name: 'Announce arrival', description: 'Phát thông báo robot đã đến nơi.', stepType: WorkflowStepType.Notify },
      { name: 'Wait before rating', description: 'Chờ 15 giây trước khi tiếp tục.', stepType: WorkflowStepType.Wait },
      { name: 'Show rating screen', description: 'Hiển thị màn hình đánh giá trải nghiệm.', stepType: WorkflowStepType.Display },
      { name: 'Wait for rating submission', description: 'Chờ khách gửi đánh giá; hết thời gian thì về Home.', stepType: WorkflowStepType.Wait },
      { name: 'Save rating', description: 'Lưu đánh giá vào nghiệp vụ.', stepType: WorkflowStepType.ProcessData },
      { name: 'Return to home screen', description: 'Đưa giao diện robot về màn hình chính.', stepType: WorkflowStepType.Display },
    ],
  }),
  createSampleWorkflow({
    id: 3,
    name: 'Bookshelf Inventory',
    description: 'Di chuyển qua các kệ, quét sách, đối soát và lập báo cáo kiểm kê.',
    createdAt: '2026-10-02T09:10:00.000Z',
    tasks: [
      { name: 'Prepare inventory scope', description: 'Xác định phạm vi và điều hướng đến kệ cần kiểm kê.', stepCount: 2 },
      { name: 'Scan and reconcile shelf contents', description: 'Quét tầng kệ và sách, đối soát rồi cập nhật kết quả.', stepCount: 5 },
      { name: 'Report inventory results', description: 'Tổng hợp kết quả và thông báo hoàn tất kiểm kê.', stepCount: 2 },
    ],
    steps: [
      { name: 'Resolve inventory scope', description: 'Xác định phạm vi kệ cần kiểm kê.', stepType: WorkflowStepType.ProcessData },
      { name: 'Navigate to next shelf', description: 'Di chuyển đến kệ tiếp theo trong phạm vi.', stepType: WorkflowStepType.Move },
      { name: 'Scan shelf level', description: 'Quét mã nhận diện tầng kệ.', stepType: WorkflowStepType.Scan },
      { name: 'Scan books', description: 'Thu thập mã nhận diện sách trên kệ.', stepType: WorkflowStepType.Scan },
      { name: 'Verify scanned books', description: 'Đối soát sách quét được với dữ liệu kiểm kê.', stepType: WorkflowStepType.ProcessData },
      { name: 'Evaluate inventory issues', description: 'Kiểm tra kết quả đối soát để chọn bước tiếp theo.', stepType: WorkflowStepType.Evaluate },
      { name: 'Update inventory status', description: 'Cập nhật trạng thái và vị trí sách sau đối soát.', stepType: WorkflowStepType.ProcessData },
      { name: 'Generate inventory report', description: 'Tổng hợp kết quả kiểm kê thành báo cáo.', stepType: WorkflowStepType.ProcessData },
      { name: 'Notify inventory completion', description: 'Thông báo hoàn tất kiểm kê.', stepType: WorkflowStepType.Notify },
    ],
  }),
  createSampleWorkflow({
    id: 4,
    name: 'Library Patrol',
    description: 'Tuần tra thư viện, ghi nhận tình trạng bất thường và lập báo cáo.',
    createdAt: '2026-10-02T09:15:00.000Z',
    tasks: [
      { name: 'Prepare patrol plan', description: 'Xác định phạm vi và lập kế hoạch tuyến tuần tra.', stepCount: 2 },
      { name: 'Patrol and track route coverage', description: 'Di chuyển, ghi nhận quan sát, cập nhật và đánh giá độ phủ tuyến.', stepCount: 4 },
      { name: 'Report patrol results', description: 'Tổng hợp sự kiện tuần tra và thông báo hoàn tất.', stepCount: 2 },
    ],
    steps: [
      { name: 'Resolve patrol scope', description: 'Xác định phạm vi và các điểm cần tuần tra.', stepType: WorkflowStepType.ProcessData },
      { name: 'Build patrol coverage plan', description: 'Tạo kế hoạch các tuyến tuần tra cần thực hiện.', stepType: WorkflowStepType.ProcessData },
      { name: 'Patrol and observe', description: 'Di chuyển theo tuyến và ghi nhận quan sát.', stepType: WorkflowStepType.Move },
      { name: 'Classify patrol observations', description: 'Phân loại các quan sát thành sự kiện.', stepType: WorkflowStepType.ProcessData },
      { name: 'Record path coverage', description: 'Cập nhật trạng thái độ phủ của tuyến.', stepType: WorkflowStepType.ProcessData },
      { name: 'Evaluate remaining routes', description: 'Kiểm tra còn tuyến nào cần tuần tra không.', stepType: WorkflowStepType.Evaluate },
      { name: 'Generate patrol report', description: 'Tổng hợp sự kiện và độ phủ tuần tra.', stepType: WorkflowStepType.ProcessData },
      { name: 'Notify patrol completion', description: 'Thông báo hoàn tất tuần tra.', stepType: WorkflowStepType.Notify },
    ],
  }),
  createSampleWorkflow({
    id: 5,
    name: 'Robot Return & Charging',
    description: 'Đưa robot về trạm sạc, thông báo trạng thái và chờ cắm sạc.',
    createdAt: '2026-10-02T09:20:00.000Z',
    tasks: [
      { name: 'Return to charging station', description: 'Điều hướng robot quay về dock sạc.', stepCount: 1 },
      { name: 'Wait for charging connection', description: 'Hiển thị trạng thái, thông báo và theo dõi kết nối sạc.', stepCount: 4 },
    ],
    steps: [
      { name: 'Navigate to charging station', description: 'Di chuyển robot về khu vực trạm sạc.', stepType: WorkflowStepType.Move },
      { name: 'Show charging status', description: 'Cập nhật giao diện chờ sạc.', stepType: WorkflowStepType.Display },
      { name: 'Notify charging standby', description: 'Thông báo robot đang chờ được cắm sạc.', stepType: WorkflowStepType.Notify },
      { name: 'Evaluate charging connection', description: 'Kiểm tra trạng thái kết nối sạc.', stepType: WorkflowStepType.Evaluate },
      { name: 'Announce charging started', description: 'Thông báo robot đã bắt đầu sạc.', stepType: WorkflowStepType.Notify },
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
    const workflows = [...sampleWorkflows, ...stored.filter((workflow) => !sampleIds.has(workflow.id))]
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