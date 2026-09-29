import { AdminLayout } from '../../layouts/AdminLayout';

export function AdminHomePage() {
  return (
    <AdminLayout>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Admin Dashboard</span>
        </div>
        <div className="panel-body">Fleet status, health, and policy controls.</div>
      </div>
    </AdminLayout>
  );
}
