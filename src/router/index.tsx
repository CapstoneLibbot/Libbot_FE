import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router'

import Sidebar from '../components/layout/Sidebar'
import AreaDetail from '../pages/areas/AreaDetail'
import AisleDetail from '../pages/aisles/AisleDetail'
import FloorList from '../pages/floors/FloorList'
import FloorDetail from '../pages/floors/FloorDetail'
import ListMap from '../pages/maps/ListMap'
import MapDetail from '../pages/maps/MapDetail'
import ShelfDetail from '../pages/shelves/ShelfDetail'
import ShelfList from '../pages/shelves/ShelfList'
import BookList from '../pages/books/BookList'
import InventoryPage from '../pages/inventory/InventoryPage'
import InventoryResultsPage from '../pages/inventory/InventoryResultsPage'
import TaskCreate from '../pages/tasks/TaskCreate'
import TaskDetail from '../pages/tasks/TaskDetail'
import TaskList from '../pages/tasks/TaskList'
import WorkflowCreate from '../pages/workflows/WorkflowCreate'
import WorkflowDetail from '../pages/workflows/WorkflowDetail'
import WorkflowList from '../pages/workflows/WorkflowList'

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

      <main className="h-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet />
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
            element={<PlaceholderPage title="Overview" />}
          />

          <Route
            path="/maps"
            element={<ListMap />}
          />

          <Route
            path="/maps/:id"
            element={<MapDetail />}
          />

          <Route
            path="/areas"
            element={<AreaDetail />}
          />

          <Route
            path="/areas/:id"
            element={<AreaDetail />}
          />

          <Route path="/floors" element={<FloorList />} />

          <Route path="/floors/:id" element={<FloorDetail />} />

          <Route
            path="/aisles/:id"
            element={<AisleDetail />}
          />

          <Route
            path="/shelf"
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
            element={<PlaceholderPage title="Row" />}
          />

          <Route path="/iii-row" element={<Navigate to="/rows" replace />} />

          <Route
            path="/book"
            element={<BookList />}
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
