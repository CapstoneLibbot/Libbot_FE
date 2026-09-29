import { PropsWithChildren } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { AppSidebar } from '../components/layout/AppSidebar';

export function LibrarianLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <AppHeader />
      <div className="page-container">
        <div className="dashboard-grid">
          <AppSidebar />
          <div style={{ gridColumn: '2 / span 2' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
