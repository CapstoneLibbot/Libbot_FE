import { ClipboardList, Gauge, Map, ShieldCheck, Workflow } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { routePaths } from '../../app/router/routePaths';

const menuItems = [
  { label: 'Overview', to: routePaths.home, icon: Gauge },
  { label: 'Workflows', to: routePaths.workflows, icon: Workflow },
  { label: 'Mission Queue', to: routePaths.missions, icon: ClipboardList },
  { label: 'Dispatch', to: routePaths.dispatchPreview, icon: Map },
  { label: 'Map Demo', to: routePaths.mapDemo, icon: Map },
  { label: 'Robot mapping', to: routePaths.robotMapping, icon: Map },
  { label: 'Admin', to: routePaths.admin, icon: ShieldCheck }
];

export function AppSidebar() {
  return (
    <aside className="panel" style={{ minHeight: 780 }}>
      <div className="panel-header">
        <span className="panel-title">Navigation</span>
      </div>
      <div className="panel-body">
        <div style={{ display: 'grid', gap: 12 }}>
          {menuItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.7rem 0.8rem',
                borderRadius: 10,
                textDecoration: 'none',
                background: isActive ? '#dbeafe' : 'transparent',
                color: isActive ? '#1d4ed8' : '#374151',
                fontWeight: 600
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
