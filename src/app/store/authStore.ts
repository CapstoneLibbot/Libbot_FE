import { create } from 'zustand';

interface AuthState {
  user: { id: string; name: string; role: 'ADMIN' | 'LIBRARIAN' | 'READER' } | null;
  isAuthenticated: boolean;
  login: (user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'user-001',
    name: 'Maya Lee',
    role: 'LIBRARIAN'
  },
  isAuthenticated: true,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false })
}));
