import { sampleBooks } from '@/lib/bookData'
import { getWorkflowById } from '@/lib/workflowData'
import { JobPriority, JobStatus, type FeedbackRecord, type InventoryReportRecord, type JobEventRecord, type JobRecord, type JobStepParameters, type JobTaskRecord } from '@/types/job'
import type { WorkflowRecord } from '@/types/workflow'

const STORAGE_KEY = 'libot.jobs'
const EVENT_STORAGE_KEY = 'libot.jobEvents'
const FEEDBACK_STORAGE_KEY = 'libot.feedback'

export const completedBookRoute = [
  { x: 28.74, y: 6.35 },
  { x: 28.9, y: 6.15 },
  { x: 27.5, y: 6.15 },
  { x: 26.1, y: 6.15 },
  { x: 24.7, y: 6.15 },
  { x: 23.3, y: 6.15 },
  { x: 21.9, y: 6.15 },
  { x: 20.5, y: 6.35 },
  { x: 19.1, y: 7.75 },
  { x: 17.7, y: 8.55 },
  { x: 16.3, y: 8.55 },
  { x: 14.9, y: 8.55 },
  { x: 13.5, y: 8.55 },
  { x: 12.1, y: 8.55 },
  { x: 11.3, y: 8.95 },
  { x: 11.1, y: 9.04 },
]

const cleanCodeBook = sampleBooks.find((book) => book.id === 5002)!
const bookWorkflow = getWorkflowById(1)!
const jobStepIds = new Map<number, number>()
let nextSampleJobStepId = 11001
bookWorkflow.tasks
  .slice()
  .sort((first, second) => first.sequenceNo - second.sequenceNo)
  .forEach((task) => task.steps
    .slice()
    .sort((first, second) => first.sequenceNo - second.sequenceNo)
    .forEach((step) => jobStepIds.set(step.id, nextSampleJobStepId++)))

const feedbackParameters: Record<number, JobStepParameters> = {
  1: { action: 'GET_BOOK_DETAIL', payload: { book_id: cleanCodeBook.id } },
  2: { ui_screen: 'BOOK_INFO', data: { book_id: cleanCodeBook.id, title: cleanCodeBook.title, author: cleanCodeBook.author, description: cleanCodeBook.description, classification: cleanCodeBook.classification, actions: ['VIEW_LOCATION', 'RATE'] } },
  3: { wait_for: 'USER_TOUCH', event_type: 'BOOK_ACTION', action: 'VIEW_LOCATION', result_variable: 'book_action', timeout_sec: 10 },
  4: { condition_type: 'DATA_MATCH', operator: 'EQUAL', condition: 'book_action == RATE', on_true_step: jobStepIds.get(bookWorkflow.tasks[2].steps[0].id), on_false_step: jobStepIds.get(bookWorkflow.tasks[1].steps[2].id) },
  5: { ui_screen: 'MAP_LOCATION', data: { floor: 'Floor 1', aisle: 'Aisle A', shelf: cleanCodeBook.shelf, shelf_level: cleanCodeBook.shelfLevel, highlight_book: cleanCodeBook.id } },
  6: { wait_for: 'USER_TOUCH', event_type: 'MAP_ACTION', action: 'START_GUIDANCE', result_variable: 'map_action', timeout_sec: 10 },
  7: { condition_type: 'DATA_MATCH', operator: 'EQUAL', condition: 'map_action == RATE', on_true_step: jobStepIds.get(bookWorkflow.tasks[2].steps[0].id), on_false_step: jobStepIds.get(bookWorkflow.tasks[1].steps[5].id) },
  8: { ui_screen: 'NAV_GUIDE', data: { destination: cleanCodeBook.shelf, show_route: true } },
  9: { endpoint_id: 'EP-102', speed_mode: 'SLOW_GUIDE', obstacle_policy: 'WAIT_RESUME', start_endpoint_id: 'EP-103' },
  10: { ui_screen: 'ARRIVED', data: { shelf: cleanCodeBook.shelf, shelf_level: cleanCodeBook.shelfLevel, highlight_book: cleanCodeBook.id } },
  11: { channel: 'SPEAKER_TTS', message_type: 'INFO', content: `Đã đến vị trí sách ${cleanCodeBook.title}.` },
  12: { wait_for: 'TIMEOUT', timeout_sec: 15 },
  13: { ui_screen: 'RATING', data: { prompt: 'Đánh giá trải nghiệm của bạn' } },
  14: { wait_for: 'USER_TOUCH', event_type: 'RATING_SUBMIT', result_variable: 'rating', timeout_sec: 10, on_timeout_step: jobStepIds.get(bookWorkflow.tasks[2].steps[3].id) },
  15: { action: 'SAVE_RATING', payload: { rating: 5, task_id: 1001 } },
  16: { ui_screen: 'HOME' },
}

function getSampleStepResult(sequenceNo: number): Record<string, unknown> {
  switch (sequenceNo) {
    case 1: return { book: cleanCodeBook, loaded: true }
    case 2: return { displayed: true }
    case 3: return { book_action: 'VIEW_LOCATION' }
    case 4: return { condition_result: false, next_step: 5 }
    case 5: return { location_displayed: true }
    case 6: return { map_action: 'START_GUIDANCE' }
    case 7: return { condition_result: false, next_step: 8 }
    case 8: return { route_displayed: true }
    case 9: return { route_points: completedBookRoute, distance_m: 20.4, obstacle_free: true }
    case 10: return { arrived_at: 'EP-102', arrived: true }
    case 11: return { notification_sent: true }
    case 12: return { timeout_elapsed: true }
    case 13: return { rating_screen_displayed: true }
    case 14: return { rating: 5, submitted: true }
    case 15: return { rating_saved: true }
    default: return { home_screen_displayed: true }
  }
}

function createCompletedBookTasks(workflow: WorkflowRecord): JobTaskRecord[] {
  let nextJobTaskId = 10001
  let sequenceNo = 0
  return workflow.tasks
    .slice()
    .sort((first, second) => first.sequenceNo - second.sequenceNo)
    .map((workflowTask) => {
      const jobTaskId = nextJobTaskId++
      return {
        id: jobTaskId,
        jobId: 1001,
        workflowTaskId: workflowTask.id,
        name: workflowTask.name,
        status: JobStatus.Completed,
        startedAt: '2026-10-02T08:00:00.000Z',
        completedAt: '2026-10-02T08:18:00.000Z',
        description: workflowTask.description,
        steps: workflowTask.steps
          .slice()
          .sort((first, second) => first.sequenceNo - second.sequenceNo)
          .map((workflowStep) => {
            sequenceNo += 1
            return {
              id: jobStepIds.get(workflowStep.id)!,
              jobTaskId,
              taskStepId: workflowStep.id,
              name: workflowStep.name,
              stepType: workflowStep.stepType,
              sequenceNo: workflowStep.sequenceNo,
              status: JobStatus.Completed,
              description: workflowStep.description,
              parameters: feedbackParameters[sequenceNo],
            }
          }),
      }
    })
}

const sampleJobEvents: JobEventRecord[] = []
let eventSequenceNo = 0
const sampleStartedAt = new Date('2026-10-02T08:00:00.000Z').getTime()
let sampleJobTaskSequence = 0
for (const workflowTask of bookWorkflow.tasks.slice().sort((first, second) => first.sequenceNo - second.sequenceNo)) {
  sampleJobTaskSequence += 1
  for (const workflowStep of workflowTask.steps.slice().sort((first, second) => first.sequenceNo - second.sequenceNo)) {
    eventSequenceNo += 1
    const jobStepId = jobStepIds.get(workflowStep.id)!
    sampleJobEvents.push({
      id: 12000 + eventSequenceNo,
      jobId: 1001,
      eventType: 'STEP_COMPLETED',
      eventTime: new Date(sampleStartedAt + eventSequenceNo * 60_000).toISOString(),
      data: {
        taskSequenceNo: sampleJobTaskSequence,
        taskName: workflowTask.name,
        stepSequenceNo: workflowStep.sequenceNo,
        workflowTaskId: workflowTask.id,
        taskStepId: workflowStep.id,
        jobTaskId: 10000 + sampleJobTaskSequence,
        jobStepId,
        stepName: workflowStep.name,
        stepType: workflowStep.stepType,
        parameters: feedbackParameters[eventSequenceNo],
        result: getSampleStepResult(eventSequenceNo),
      },
    })
  }
}

const sampleFeedback: FeedbackRecord[] = [
  { id: 1, jobId: 1001, rating: 5, comment: 'Robot dẫn đường nhanh và tìm đúng vị trí sách.' },
]

export function createRunningAreaSample() {
  const workflow = getWorkflowById(2)!
  const route = [
    { x: 8.654, y: 23.246 },
    { x: 8.7, y: 23.15 },
    { x: 10.3, y: 22.55 },
    { x: 11.9, y: 22.55 },
    { x: 13.5, y: 22.55 },
    { x: 15.1, y: 22.15 },
    { x: 16.7, y: 20.55 },
    { x: 18.3, y: 18.95 },
    { x: 19.9, y: 17.55 },
    { x: 21.5, y: 15.95 },
    { x: 23.1, y: 14.75 },
    { x: 24.7, y: 13.95 },
    { x: 26.3, y: 13.15 },
    { x: 27.9, y: 11.55 },
    { x: 29.5, y: 10.55 },
    { x: 31.1, y: 10.55 },
    { x: 32.7, y: 10.35 },
    { x: 34.3, y: 9.55 },
    { x: 35.9, y: 8.95 },
    { x: 37.5, y: 8.15 },
    { x: 39.1, y: 7.35 },
    { x: 40.1, y: 6.95 },
  ]
  const targetArea = { id: 2, name: 'Reading desk area A' }
  const workflowSteps = workflow.tasks
    .slice()
    .sort((first, second) => first.sequenceNo - second.sequenceNo)
    .flatMap((task) => task.steps.slice().sort((first, second) => first.sequenceNo - second.sequenceNo))
  const jobStepIds = new Map(workflowSteps.map((step, index) => [step.id, 22001 + index]))
  const taskIds = new Map(workflow.tasks.map((task, index) => [task.id, 20001 + index]))
  const getStepId = (globalSequenceNo: number) => jobStepIds.get(workflowSteps[globalSequenceNo - 1].id)!
  const parametersBySequence: Record<number, JobStepParameters> = {
    1: { ui_screen: 'FACILITY_INFO', data: { facility_id: targetArea.id, name: targetArea.name, type: 'AREA', description: 'Reading desk area A.', location: 'EP-104', actions: ['VIEW_LOCATION', 'RATE'] } },
    2: { wait_for: 'USER_TOUCH', event_type: 'FACILITY_ACTION', action: 'VIEW_LOCATION', result_variable: 'facility_action', timeout_sec: 10 },
    3: { condition_type: 'DATA_MATCH', operator: 'EQUAL', condition: 'facility_action == RATE', on_true_step: getStepId(12), on_false_step: getStepId(4) },
    4: { ui_screen: 'MAP_LOCATION', data: { floor: 'Floor 1', facility: targetArea.name, highlight_facility: targetArea.id } },
    5: { wait_for: 'USER_TOUCH', event_type: 'MAP_ACTION', action: 'START_GUIDANCE', result_variable: 'map_action', timeout_sec: 10 },
    6: { condition_type: 'DATA_MATCH', operator: 'EQUAL', condition: 'map_action == RATE', on_true_step: getStepId(12), on_false_step: getStepId(7) },
    7: { ui_screen: 'NAV_GUIDE', data: { destination: targetArea.name, show_route: true } },
    8: { endpoint_id: 'EP-104', speed_mode: 'SLOW_GUIDE', obstacle_policy: 'WAIT_RESUME', start_position: route[0] },
  }
  const startedAt = new Date('2026-10-02T08:20:00.000Z')
  let globalSequenceNo = 0
  const tasks: JobTaskRecord[] = workflow.tasks
    .slice()
    .sort((first, second) => first.sequenceNo - second.sequenceNo)
    .map((workflowTask) => {
      const jobTaskId = taskIds.get(workflowTask.id)!
      const taskStatus = workflowTask.sequenceNo === 1
        ? JobStatus.Completed
        : workflowTask.sequenceNo === 2 ? JobStatus.Running : JobStatus.Pending

      return {
        id: jobTaskId,
        jobId: 1002,
        workflowTaskId: workflowTask.id,
        name: workflowTask.name,
        status: taskStatus,
        startedAt: workflowTask.sequenceNo === 3 ? null : startedAt.toISOString(),
        completedAt: workflowTask.sequenceNo === 1 ? new Date(startedAt.getTime() + 240_000).toISOString() : null,
        description: workflowTask.description,
        steps: workflowTask.steps
          .slice()
          .sort((first, second) => first.sequenceNo - second.sequenceNo)
          .map((workflowStep) => {
            globalSequenceNo += 1
            const stepStatus = globalSequenceNo < 8
              ? JobStatus.Completed
              : globalSequenceNo === 8 ? JobStatus.Running : JobStatus.Pending

            return {
              id: jobStepIds.get(workflowStep.id)!,
              jobTaskId,
              taskStepId: workflowStep.id,
              name: workflowStep.name,
              stepType: workflowStep.stepType,
              sequenceNo: workflowStep.sequenceNo,
              status: stepStatus,
              description: workflowStep.description,
              parameters: parametersBySequence[globalSequenceNo] ?? {},
            }
          }),
      }
    })

  const events: JobEventRecord[] = []
  let eventSequenceNo = 0
  let taskSequenceNo = 0
  for (const workflowTask of workflow.tasks.slice().sort((first, second) => first.sequenceNo - second.sequenceNo)) {
    taskSequenceNo += 1
    for (const workflowStep of workflowTask.steps.slice().sort((first, second) => first.sequenceNo - second.sequenceNo)) {
      eventSequenceNo += 1
      if (eventSequenceNo > 8) break
      const currentStep = eventSequenceNo === 8
      const result: Record<string, unknown> = currentStep
        ? {
            route_points: route,
            route_progress_ratio: 0.42,
            current_position: { x: 21.375, y: 16.075 },
            distance_m: 40.3,
            travelled_m: 16.9,
            obstacle_policy: 'WAIT_RESUME',
            robot_heading: 'WEST',
          }
        : eventSequenceNo === 3 || eventSequenceNo === 6
          ? { condition_result: false }
          : eventSequenceNo === 2
            ? { facility_action: 'VIEW_LOCATION' }
            : eventSequenceNo === 5
              ? { map_action: 'START_GUIDANCE' }
              : { step_completed: true }

      events.push({
        id: 13000 + eventSequenceNo,
        jobId: 1002,
        eventType: currentStep ? 'STEP_STARTED' : 'STEP_COMPLETED',
        eventTime: new Date(startedAt.getTime() + eventSequenceNo * 60_000).toISOString(),
        data: {
          taskSequenceNo: taskSequenceNo,
          taskName: workflowTask.name,
          stepSequenceNo: workflowStep.sequenceNo,
          workflowTaskId: workflowTask.id,
          taskStepId: workflowStep.id,
          jobTaskId: taskIds.get(workflowTask.id)!,
          jobStepId: jobStepIds.get(workflowStep.id)!,
          stepName: workflowStep.name,
          stepType: workflowStep.stepType,
          parameters: parametersBySequence[eventSequenceNo] ?? {},
          result,
        },
      })
    }
  }

  return {
    job: {
      id: 1002,
      workflowId: workflow.id,
      createdBy: 1,
      robotId: 12,
      name: 'Guide visitor to a facility',
      priority: JobPriority.Normal,
      status: JobStatus.Running,
      description: `Guide a visitor to ${targetArea.name}.`,
      startedAt: startedAt.toISOString(),
      completedAt: null,
      createdAt: startedAt.toISOString(),
      tasks,
    } satisfies JobRecord,
    events,
  }
}

const runningAreaSample = createRunningAreaSample()

export function createCompletedInventorySample() {
  const workflow = getWorkflowById(3)!
  const shelfIds = [3, 4, 5, 6, 9, 10]
  const targetEndpointIds = [106, 107, 108, 109, 112, 113]
  const route = [
    { x: 22.86, y: 5.039 },
    { x: 22.9, y: 7.35 },
    { x: 22.9, y: 9.75 },
    { x: 22.9, y: 12.15 },
    { x: 23.1, y: 14.55 },
    { x: 24.7, y: 16.95 },
    { x: 24.7, y: 19.35 },
    { x: 24.7, y: 21.75 },
    { x: 24.5, y: 23 },
    { x: 27.1, y: 23.35 },
    { x: 28.5, y: 23 },
    { x: 28.1, y: 25.95 },
    { x: 28.3, y: 28.35 },
    { x: 30.5, y: 28.55 },
    { x: 31.7, y: 27.15 },
    { x: 31.7, y: 24.75 },
    { x: 31.5, y: 23 },
    { x: 34.1, y: 22.95 },
    { x: 35, y: 23 },
    { x: 35.1, y: 25.35 },
    { x: 35.1, y: 27.75 },
    { x: 36.9, y: 28.55 },
    { x: 39.3, y: 28.55 },
    { x: 41.7, y: 28.55 },
    { x: 44.1, y: 28.55 },
    { x: 45.5, y: 27.35 },
    { x: 45.5, y: 24.95 },
    { x: 45.5, y: 23 },
    { x: 48.1, y: 22.95 },
    { x: 49, y: 23 },
  ]
  const workflowSteps = workflow.tasks
    .slice()
    .sort((first, second) => first.sequenceNo - second.sequenceNo)
    .flatMap((task) => task.steps.slice().sort((first, second) => first.sequenceNo - second.sequenceNo))
  const jobStepIds = new Map(workflowSteps.map((step, index) => [step.id, 33001 + index]))
  const taskIds = new Map(workflow.tasks.map((task, index) => [task.id, 30001 + index]))
  const createdAt = '2026-10-02T07:00:00.000Z'
  const completedAt = '2026-10-02T07:48:00.000Z'
  const parametersBySequence: Record<number, JobStepParameters> = {
    1: { action: 'RESOLVE_INVENTORY_SCOPE', payload: { scope_type: 'SHELVES', floor_id: 1, target_shelves: shelfIds }, output: { target_shelves: shelfIds } },
    2: { target_endpoint_ids: targetEndpointIds, start_position: route[0], speed_mode: 'NORMAL', obstacle_policy: 'DETECT_AND_WAIT', scan_while_moving: true },
    3: { scan_type: 'BARCODE', target_type: 'SHELF_LEVEL', timeout_sec: 30 },
    4: { scan_type: 'BARCODE', target_type: 'BOOK', timeout_sec: 30 },
    5: { action: 'VERIFY_BOOK', payload: { task_id: 1003, shelf_ids: shelfIds }, output: { verified_book_items: 132, issue_detected: true } },
    6: { condition_type: 'DATA_MATCH', operator: 'EQUAL', condition: 'issue_detected == true', on_true_step: jobStepIds.get(workflowSteps[6].id), on_false_step: 'LOOP_NEXT_SHELF_LEVEL' },
    7: { action: 'UPDATE_BOOK_ITEM_INVENTORY_STATUS', payload: { task_id: 1003, shelf_ids: shelfIds, update_status: true, update_location: true, aggregation: 'TASK' } },
    8: { action: 'GENERATE_REPORT', payload: { task_id: 1003, scope_type: 'SHELVES', floor_id: 1, target_shelves: shelfIds, source: 'TASK_INVENTORY_RESULTS' } },
    9: { channel: 'LIBRARIAN_WS', message_type: 'INFO', content: 'Kiểm kê hoàn tất' },
  }
  let globalSequenceNo = 0
  const tasks: JobTaskRecord[] = workflow.tasks
    .slice()
    .sort((first, second) => first.sequenceNo - second.sequenceNo)
    .map((workflowTask) => {
      const jobTaskId = taskIds.get(workflowTask.id)!
      return {
        id: jobTaskId,
        jobId: 1003,
        workflowTaskId: workflowTask.id,
        name: workflowTask.name,
        status: JobStatus.Completed,
        startedAt: createdAt,
        completedAt,
        description: workflowTask.description,
        steps: workflowTask.steps
          .slice()
          .sort((first, second) => first.sequenceNo - second.sequenceNo)
          .map((workflowStep) => {
            globalSequenceNo += 1
            return {
              id: jobStepIds.get(workflowStep.id)!,
              jobTaskId,
              taskStepId: workflowStep.id,
              name: workflowStep.name,
              stepType: workflowStep.stepType,
              sequenceNo: workflowStep.sequenceNo,
              status: JobStatus.Completed,
              description: workflowStep.description,
              parameters: parametersBySequence[globalSequenceNo] ?? {},
            }
          }),
      }
    })

  const eventResults: Record<number, Record<string, unknown>> = {
    1: { scope_resolved: true, shelves: shelfIds },
    2: { route_points: route, route_distance_m: 64.5, shelves_visited: shelfIds, obstacle_free: true },
    3: { scanned_shelf_levels: 24 },
    4: { scanned_books: 132 },
    5: { available: 126, misplaced: 4, missing: 2, issue_detected: true },
    6: { condition_result: true, inventory_updated: true },
    7: { updated_book_items: 132 },
    8: { report_id: 1003, report_generated: true },
    9: { notification_sent: true },
  }
  const events: JobEventRecord[] = []
  let globalEventNo = 0
  workflow.tasks.slice().sort((first, second) => first.sequenceNo - second.sequenceNo).forEach((workflowTask) => {
    workflowTask.steps.slice().sort((first, second) => first.sequenceNo - second.sequenceNo).forEach((workflowStep) => {
      globalEventNo += 1
      events.push({
        id: 14000 + globalEventNo,
        jobId: 1003,
        eventType: 'STEP_COMPLETED',
        eventTime: new Date(new Date(createdAt).getTime() + globalEventNo * 5 * 60_000).toISOString(),
        data: {
          taskSequenceNo: workflowTask.sequenceNo,
          taskName: workflowTask.name,
          stepSequenceNo: workflowStep.sequenceNo,
          workflowTaskId: workflowTask.id,
          taskStepId: workflowStep.id,
          jobTaskId: taskIds.get(workflowTask.id)!,
          jobStepId: jobStepIds.get(workflowStep.id)!,
          stepName: workflowStep.name,
          stepType: workflowStep.stepType,
          parameters: parametersBySequence[globalEventNo] ?? {},
          result: eventResults[globalEventNo] ?? {},
        },
      })
    })
  })

  const report: InventoryReportRecord = {
    id: 1003,
    jobId: 1003,
    scopeType: 'SHELVES',
    totalShelfs: 6,
    totalBookScanned: 132,
    totalAvailable: 126,
    totalMisplaced: 4,
    totalMissing: 2,
    createdAt: completedAt,
    data: {
      items: [
        {
          bookId: 5002,
          title: 'Clean Code',
          author: 'Robert C. Martin',
          classification: 'QA76.76.D47 M37',
          issueType: 'MISPLACED',
          expectedLocation: { floor: 'Floor 1', aisle: 'Aisle A', shelf: 'A-03', shelfLevel: 2 },
          actualLocation: { floor: 'Floor 1', aisle: 'Aisle B', shelf: 'A-05', shelfLevel: 1 },
        },
        {
          bookId: 5003,
          title: 'Design Patterns',
          author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
          classification: 'QA76.64 D47',
          issueType: 'MISPLACED',
          expectedLocation: { floor: 'Floor 1', aisle: 'Aisle A', shelf: 'A-05', shelfLevel: 2 },
          actualLocation: { floor: 'Floor 1', aisle: 'Aisle A', shelf: 'A-04', shelfLevel: 1 },
        },
        {
          bookId: 5006,
          title: 'Refactoring',
          author: 'Martin Fowler',
          classification: 'QA76.76.M42 F69',
          issueType: 'MISPLACED',
          expectedLocation: { floor: 'Floor 1', aisle: 'Aisle B', shelf: 'A-06', shelfLevel: 2 },
          actualLocation: { floor: 'Floor 1', aisle: 'Aisle C', shelf: 'A-09', shelfLevel: 3 },
        },
        {
          bookId: 5007,
          title: 'The Design of Everyday Things',
          author: 'Don Norman',
          classification: 'TS171.4 N67',
          issueType: 'MISPLACED',
          expectedLocation: { floor: 'Floor 1', aisle: 'Aisle C', shelf: 'A-09', shelfLevel: 1 },
          actualLocation: { floor: 'Floor 1', aisle: 'Aisle D', shelf: 'A-10', shelfLevel: 2 },
        },
        {
          bookId: 5005,
          title: 'Introduction to Algorithms',
          author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
          classification: 'QA76.6 I585',
          issueType: 'MISSING',
          expectedLocation: { floor: 'Floor 1', aisle: 'Aisle A', shelf: 'A-04', shelfLevel: 4 },
          actualLocation: null,
        },
        {
          bookId: 5008,
          title: 'Thinking, Fast and Slow',
          author: 'Daniel Kahneman',
          classification: 'BF441 K ah',
          issueType: 'MISSING',
          expectedLocation: { floor: 'Floor 1', aisle: 'Aisle D', shelf: 'A-10', shelfLevel: 3 },
          actualLocation: null,
        },
      ],
    },
  }

  return {
    job: {
      id: 1003,
      workflowId: workflow.id,
      createdBy: 2,
      robotId: 8,
      name: 'Inventory shelves',
      priority: JobPriority.Normal,
      status: JobStatus.Completed,
      description: 'Completed inventory on Floor 1 for shelves A-03, A-04, A-05, A-06, A-09 and A-10. Scanned 132 books: 126 available, 4 misplaced and 2 missing.',
      startedAt: createdAt,
      completedAt,
      createdAt,
      tasks,
    } satisfies JobRecord,
    events,
    report,
  }
}

const completedInventorySample = createCompletedInventorySample()

export const sampleJobs: JobRecord[] = [
  {
    id: 1001,
    workflowId: 1,
    createdBy: 1,
    robotId: 12,
    name: 'Find and guide to a book',
    priority: JobPriority.High,
    status: JobStatus.Completed,
    description: 'Find a requested book and guide the reader to its shelf.',
    startedAt: '2026-10-02T08:15:00.000Z',
    completedAt: '2026-10-02T08:18:00.000Z',
    createdAt: '2026-10-02T08:00:00.000Z',
    tasks: createCompletedBookTasks(bookWorkflow),
  },
  {
    ...runningAreaSample.job,
  },
  {
    ...completedInventorySample.job,
  },
  {
    id: 1004,
    workflowId: 4,
    createdBy: 2,
    robotId: 15,
    name: 'Complete library patrol',
    priority: JobPriority.Low,
    status: JobStatus.Completed,
    description: 'Patrol assigned areas and report observations.',
    startedAt: '2026-10-01T21:00:00.000Z',
    completedAt: '2026-10-01T21:30:00.000Z',
    createdAt: '2026-10-01T20:55:00.000Z',
    tasks: [],
  },
  {
    id: 1005,
    workflowId: 5,
    createdBy: 1,
    robotId: null,
    name: 'Return robot to charging station',
    priority: JobPriority.Normal,
    status: JobStatus.Cancelled,
    description: 'Return the robot to its charging station.',
    startedAt: null,
    completedAt: null,
    createdAt: '2026-10-01T18:00:00.000Z',
    tasks: [],
  },
]

export type CreateJobInput = {
  workflow: WorkflowRecord
  name: string
  description: string
  createdBy: number
  robotId: number | null
  priority: JobRecord['priority']
  stepParameters: Record<number, Record<string, unknown>>
}

export function getJobs(): JobRecord[] {
  try {
    const storedJobs = localStorage.getItem(STORAGE_KEY)
    if (!storedJobs) return sampleJobs

    const jobs = JSON.parse(storedJobs) as JobRecord[]
    const sampleIds = new Set(sampleJobs.map((job) => job.id))
    return [...sampleJobs, ...jobs.filter((job) => !sampleIds.has(job.id))]
  } catch {
    return sampleJobs
  }
}

export function saveJob(input: CreateJobInput): JobRecord {
  const jobs = getJobs()
  const jobId = Math.max(0, ...jobs.map((job) => job.id)) + 1
  let jobTaskId = Math.max(0, ...jobs.flatMap((job) => job.tasks.map((task) => task.id))) + 1
  let jobStepId = Math.max(
    0,
    ...jobs.flatMap((job) => job.tasks.flatMap((task) => task.steps.map((step) => step.id))),
  ) + 1

  const jobStepIds = new Map<number, number>()
  input.workflow.tasks.forEach((task) => {
    task.steps.forEach((step) => {
      jobStepIds.set(step.id, jobStepId++)
    })
  })

  jobStepId -= jobStepIds.size
  const createdAt = new Date().toISOString()
  const job: JobRecord = {
    id: jobId,
    workflowId: input.workflow.id,
    createdBy: input.createdBy,
    robotId: input.robotId,
    name: input.name.trim(),
    priority: input.priority,
    status: JobStatus.Pending,
    description: input.description.trim(),
    startedAt: null,
    completedAt: null,
    createdAt,
    tasks: input.workflow.tasks
      .slice()
      .sort((first, second) => first.sequenceNo - second.sequenceNo)
      .map((workflowTask) => {
        const currentJobTaskId = jobTaskId++

        return {
          id: currentJobTaskId,
          jobId,
          workflowTaskId: workflowTask.id,
          name: workflowTask.name,
          status: JobStatus.Pending,
          startedAt: null,
          completedAt: null,
          description: workflowTask.description,
          steps: workflowTask.steps
            .slice()
            .sort((first, second) => first.sequenceNo - second.sequenceNo)
            .map((workflowStep) => {
              const parameters = { ...(input.stepParameters[workflowStep.id] ?? {}) }
              ;['on_true_step', 'on_false_step', 'on_timeout_step'].forEach((key) => {
                const targetStepId = parameters[key]
                if (targetStepId !== undefined && targetStepId !== '') {
                  parameters[key] = jobStepIds.get(Number(targetStepId)) ?? null
                }
              })

              return {
                id: jobStepId++,
                jobTaskId: currentJobTaskId,
                taskStepId: workflowStep.id,
                name: workflowStep.name,
                stepType: workflowStep.stepType,
                sequenceNo: workflowStep.sequenceNo,
                status: JobStatus.Pending,
                description: workflowStep.description,
                parameters,
              }
            }),
        }
      }),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...jobs, job]))
  return job
}

export function getJobById(id: number): JobRecord | undefined {
  return getJobs().find((job) => job.id === id)
}

export function getJobEvents(jobId: number): JobEventRecord[] {
  if (jobId === 1001) return sampleJobEvents
  if (jobId === 1002) return runningAreaSample.events
  if (jobId === 1003) return completedInventorySample.events

  try {
    const stored = localStorage.getItem(EVENT_STORAGE_KEY)
    const events = stored ? JSON.parse(stored) as JobEventRecord[] : []
    const savedEvents = events.filter((event) => event.jobId === jobId)
    if (savedEvents.length > 0) return savedEvents.sort((first, second) => first.eventTime.localeCompare(second.eventTime))
  } catch {
    // Fall through to sample events.
  }
  return []
}

export function getFeedback(jobId: number): FeedbackRecord | undefined {
  if (jobId === 1002 || jobId === 1003) return undefined

  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY)
    const records = stored ? JSON.parse(stored) as FeedbackRecord[] : []
    const savedFeedback = records.find((feedback) => feedback.jobId === jobId)
    if (savedFeedback) return savedFeedback
  } catch {
    // Fall through to sample feedback.
  }
  return sampleFeedback.find((feedback) => feedback.jobId === jobId)
}

export function getInventoryReport(jobId: number): InventoryReportRecord | undefined {
  if (jobId === 1003) return completedInventorySample.report
  return undefined
}