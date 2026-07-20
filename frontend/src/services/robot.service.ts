import api from './api';
import { RobotStatus, SystemResource } from '../types';

export const robotService = {
  getStatus: async (): Promise<RobotStatus> => {
    return api.get('/robot/status');
  },

  getSystemResource: async (): Promise<SystemResource> => {
    return api.get('/robot/system');
  },

  getBattery: async () => {
    return api.get('/robot/battery');
  },

  emergencyStop: async () => {
    return api.post('/robot/emergency-stop');
  },

  setControlCommand: async (cmd: { linear: number; angular: number }) => {
    return api.post('/robot/control', cmd);
  },

  setMode: async (mode: 'MANUAL' | 'AUTO') => {
    return api.post('/robot/mode', { mode });
  }
};

export default robotService;
