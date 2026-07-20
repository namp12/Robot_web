import api from './api';
import { BlackBoxLog } from '../types';

export const blackboxService = {
  getLogs: async (): Promise<BlackBoxLog[]> => {
    return api.get('/blackbox');
  },

  getMissionLogs: async (missionId: number): Promise<BlackBoxLog[]> => {
    return api.get(`/blackbox/${missionId}`);
  },
};

export default blackboxService;
