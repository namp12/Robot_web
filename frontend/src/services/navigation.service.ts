import api from './api';
import { NavigationPose } from '../types';

export const navigationService = {
  getStatus: async (): Promise<NavigationPose> => {
    return api.get('/navigation/status');
  },

  sendGoal: async (goal: { x: number; y: number; yaw?: number }) => {
    return api.post('/navigation/goal', goal);
  },

  cancelGoal: async () => {
    return api.post('/navigation/cancel');
  },

  pause: async () => {
    return api.post('/navigation/pause');
  },

  resume: async () => {
    return api.post('/navigation/resume');
  },
};

export default navigationService;
