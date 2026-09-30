import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router'

import Sidebar from '../components/layout/Sidebar'
import AreaDetail from '../pages/AreaDetail'
import AisleDetail from '../pages/aisles/AisleDetail'
import ListMap from '../pages/maps/ListMap'
import MapDetail from '../pages/maps/MapDetail'
import ShelfDetail from '../pages/shelves/ShelfDetail'

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
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1">
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

          <Route
            path="/floors/:id"
            element={<PlaceholderPage title="Floor Detail" />}
          />

          <Route
            path="/aisles/:id"
            element={<AisleDetail />}
          />

          <Route
            path="/shelves/:id"
            element={<ShelfDetail />}
          />

          <Route
            path="/tasks"
            element={<PlaceholderPage title="Tasks" />}
          />

          <Route
            path="/workflows"
            element={<PlaceholderPage title="Workflows" />}
          />

          <Route
            path="/iii-row"
            element={<PlaceholderPage title="III Row" />}
          />

          <Route
            path="/book"
            element={<PlaceholderPage title="Book" />}
          />

          <Route
            path="/inventory"
            element={<PlaceholderPage title="Inventory" />}
          />

          <Route
            path="/inventory-results"
            element={
              <PlaceholderPage title="Inventory Results" />
            }
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