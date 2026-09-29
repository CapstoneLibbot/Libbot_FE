import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  selectedMapId: string;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedMapId: (mapId: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  selectedMapId: 'map-floor-1',
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setSelectedMapId: (selectedMapId) => set({ selectedMapId })
}));
