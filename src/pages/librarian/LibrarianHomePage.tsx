import { LibrarianLayout } from '../../layouts/LibrarianLayout';

export function LibrarianHomePage() {
  return (
    <LibrarianLayout>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Librarian Dashboard</span>
        </div>
        <div className="panel-body">Operations dashboard for workflows and dispatch.</div>
      </div>
    </LibrarianLayout>
  );
}
