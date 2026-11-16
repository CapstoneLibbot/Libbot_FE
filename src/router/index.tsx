import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router'

import Sidebar from '../components/layout/Sidebar'
import OperationBanner from '../components/layout/OperationBanner'
import Overview from '../pages/overview/Overview'
import DispatchWorkflowPage from '../features/dispatch/DispatchWorkflowPage'
import AisleDetail from '../pages/aisles/AisleDetail'
import FloorList from '../pages/floors/FloorList'
import FloorDetail from '../pages/floors/FloorDetail'
import ListMap from '../pages/maps/ListMap'
import CreateMap from '../pages/maps/CreateMap'
import RobotMapDetail from '../pages/maps/RobotMapDetail'
import ShelfDetail from '../pages/shelves/ShelfDetail'
import ShelfList from '../pages/shelves/ShelfList'
import BookList from '../pages/books/BookList'
import BookDetail from '../pages/books/BookDetail'
import InventoryPage from '../pages/inventory/InventoryPage'
import InventoryResultsPage from '../pages/inventory/InventoryResultsPage'
import TaskCreate from '../pages/tasks/TaskCreate'
import TaskDetail from '../pages/tasks/TaskDetail'
import TaskList from '../pages/tasks/TaskList'
import WorkflowCreate from '../pages/workflows/WorkflowCreate'
import WorkflowDetail from '../pages/workflows/WorkflowDetail'
import WorkflowList from '../pages/workflows/WorkflowList'
import BookTransactionsHub from '../pages/book-transactions/BookTransactionsHub'
import ReceiptCreate from '../pages/book-transactions/ReceiptCreate'
import ReceiptDetail from '../pages/book-transactions/ReceiptDetail'
import IssueCreate from '../pages/book-transactions/IssueCreate'
import IssueDetail from '../pages/book-transactions/IssueDetail'

function PlaceholderPage({
  title,
}: {
  title: string
}) {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        This page will be implemented later.
      </p>
    </div>
  )
}

function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <OperationBanner />
        <div className="app-page-content min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<Overview />}
          />

          <Route
            path="/maps"
            element={<ListMap />}
          />

          <Route
            path="/maps/create"
            element={<CreateMap />}
          />

          <Route
            path="/maps/robot/:id"
            element={<RobotMapDetail />}
          />

          <Route
            path="/maps/:id"
            element={<RobotMapDetail />}
          />

          <Route path="/floors" element={<FloorList />} />

          <Route path="/floors/:id" element={<FloorDetail />} />

          <Route
            path="/aisles"
            element={<AisleDetail />}
          />

          <Route
            path="/aisles/:id"
            element={<AisleDetail />}
          />

          <Route
            path="/shelf"
            element={<ShelfList />}
          />

          <Route
            path="/shelves"
            element={<ShelfList />}
          />

          <Route
            path="/shelves/:id"
            element={<ShelfDetail />}
          />

          <Route
            path="/tasks"
            element={<TaskList />}
          />

          <Route
            path="/dispatch"
            element={<DispatchWorkflowPage />}
          />

          <Route
            path="/tasks/create"
            element={<TaskCreate />}
          />

          <Route
            path="/tasks/:id"
            element={<TaskDetail />}
          />

          <Route
            path="/workflows"
            element={<WorkflowList />}
          />

          <Route
            path="/workflows/create"
            element={<WorkflowCreate />}
          />

          <Route
            path="/workflows/:id"
            element={<WorkflowDetail />}
          />

          <Route
            path="/rows"
            element={<Navigate to="/aisles" replace />}
          />

          <Route path="/iii-row" element={<Navigate to="/aisles" replace />} />

          <Route
            path="/book"
            element={<BookList />}
          />

          <Route
            path="/book/:id"
            element={<BookDetail />}
          />

          {/* Book Transactions Routes */}
          <Route
            path="/book-transactions"
            element={<BookTransactionsHub />}
          />

          <Route
            path="/book-transactions/receipts/new"
            element={<ReceiptCreate />}
          />

          <Route
            path="/book-transactions/receipts/:id"
            element={<ReceiptDetail />}
          />

          <Route
            path="/book-transactions/issues/new"
            element={<IssueCreate />}
          />

          <Route
            path="/book-transactions/issues/:id"
            element={<IssueDetail />}
          />

          {/* Aliases & Redirects */}
          <Route
            path="/circulation"
            element={<Navigate to="/book-transactions" replace />}
          />

          <Route
            path="/circulation/receipts/new"
            element={<Navigate to="/book-transactions/receipts/new" replace />}
          />

          <Route
            path="/circulation/receipts/:id"
            element={<Navigate to="/book-transactions/receipts/:id" replace />}
          />

          <Route
            path="/circulation/issues/new"
            element={<Navigate to="/book-transactions/issues/new" replace />}
          />

          <Route
            path="/circulation/issues/:id"
            element={<Navigate to="/book-transactions/issues/:id" replace />}
          />

          <Route
            path="/transactions"
            element={<Navigate to="/book-transactions" replace />}
          />

          <Route
            path="/receipts"
            element={<Navigate to="/book-transactions" replace />}
          />

          <Route
            path="/issues"
            element={<Navigate to="/book-transactions?tab=issues" replace />}
          />

          <Route
            path="/inventory"
            element={<InventoryPage />}
          />

          <Route
            path="/inventory-results"
            element={<InventoryResultsPage />}
          />

          <Route
            path="/alerts"
            element={<PlaceholderPage title="Alerts" />}
          />

          <Route
            path="/history"
            element={<PlaceholderPage title="History" />}
          />

          <Route
            path="/reports"
            element={<PlaceholderPage title="Reports" />}
          />

          <Route
            path="/settings"
            element={<PlaceholderPage title="Settings" />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
