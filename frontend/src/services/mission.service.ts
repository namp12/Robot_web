import api from './api';
import { Mission } from '../types';

export const missionService = {
  getMissions: async (): Promise<Mission[]> => {
    return api.get('/missions');
  },

  createMission: async (missionData: Partial<Mission>): Promise<Mission> => {
    return api.post('/missions', missionData);
  },

  updateMission: async (id: number, missionData: Partial<Mission>): Promise<Mission> => {
    return api.put(`/missions/${id}`, missionData);
  },

  deleteMission: async (id: number): Promise<boolean> => {
    return api.delete(`/missions/${id}`);
  },
};

export default missionService;
