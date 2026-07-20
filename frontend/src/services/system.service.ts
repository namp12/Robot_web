import api from './api';
import { SystemResource } from '../types';

export const systemService = {
  getSystemInfo: async (): Promise<SystemResource> => {
    return api.get('/system');
  },

  getSystemLogs: async () => {
    return api.get('/system/logs');
  },
};

export default systemService;
