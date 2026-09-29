import { create } from 'zustand';

interface RobotState {
  selectedRobotId: string;
  setSelectedRobotId: (robotId: string) => void;
}

export const useRobotStore = create<RobotState>((set) => ({
  selectedRobotId: 'robot-001',
  setSelectedRobotId: (selectedRobotId) => set({ selectedRobotId })
}));
