import { NavLink } from 'react-router'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Boxes,
  ClipboardList,
  FileBarChart,
  History,
  LayoutDashboard,
  Map,
  MapPin,
  Layers3,
  Rows3,
  Settings,
  Warehouse,
} from 'lucide-react'

const menuItems = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    label: 'Tasks',
    icon: ClipboardList,
    path: '/tasks',
  },
  {
    label: 'Workflows',
    icon: Activity,
    path: '/workflows',
  },
  {
    label: 'Map',
    icon: Map,
    path: '/maps',
  },
  {
    label: 'Area',
    icon: MapPin,
    path: '/areas',
  },
  {
    label: 'Floor',
    icon: Layers3,
    path: '/floors',
  },
  {
    label: 'III Row',
    icon: Rows3,
    path: '/rows',
  },
  {
    label: 'Shelf',
    icon: Warehouse,
    path: '/shelf',
  },
  {
    label: 'Book',
    icon: BookOpen,
    path: '/book',
  },
  {
    label: 'Inventory',
    icon: Boxes,
    path: '/inventory',
  },
  {
    label: 'Inventory Results',
    icon: FileBarChart,
    path: '/inventory-results',
  },
  {
    label: 'Alerts',
    icon: AlertTriangle,
    path: '/alerts',
  },
  {
    label: 'History',
    icon: History,
    path: '/history',
  },
  {
    label: 'Reports',
    icon: FileBarChart,
    path: '/reports',
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
]

function Sidebar() {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-[#d9dce5] bg-[#f7f7fc]">
      {/* Brand */}
      <div className="flex h-[70px] items-center border-b border-[#d9dce5] px-6">
        <div>
          <h1 className="text-[21px] font-bold tracking-tight text-primary">
            LiBot
          </h1>

          <p className="mt-0.5 text-[12px] text-[#687386]">
            Library Robot Management
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'group flex h-[43px] w-full items-center gap-3 rounded-lg px-3.5',
                    'text-[14px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-[#596174] hover:bg-[#ececf4] hover:text-[#17181c]',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={[
                        'h-[17px] w-[17px] shrink-0',
                        isActive
                          ? 'text-white'
                          : 'text-[#737b8c] group-hover:text-[#3f4654]',
                      ].join(' ')}
                      strokeWidth={1.8}
                    />

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-[#d9dce5] p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            L
          </div>

          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[#252933]">
              Librarian
            </p>

            <p className="mt-0.5 truncate text-[12px] text-[#747b8b]">
              Library Staff
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
