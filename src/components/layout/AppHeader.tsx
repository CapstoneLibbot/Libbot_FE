import { Menu, Plus } from 'lucide-react';
import { useAuthStore } from '../../app/store/authStore';
import { Button } from '../common/Button/Button';
import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="button ghost" aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
        <div className="header-title">LibBot</div>
      </div>

      <div className="header-actions">
        <div style={{ color: '#374151', fontWeight: 600 }}>{user?.name ?? 'Librarian'}</div>
        <Button variant="primary" onClick={() => navigate('/dispatch')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} />
            Create Mission
          </span>
        </Button>
      </div>
    </header>
  );
}
