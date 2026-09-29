import { ReaderLayout } from '../../layouts/ReaderLayout';

export function ReaderHomePage() {
  return (
    <ReaderLayout>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Reader Dashboard</span>
        </div>
        <div className="panel-body">Welcome to the LibBot reader experience.</div>
      </div>
    </ReaderLayout>
  );
}
