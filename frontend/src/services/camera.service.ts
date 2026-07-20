import api from './api';
import { CameraStatus } from '../types';

export const cameraService = {
  getStatus: async (): Promise<CameraStatus> => {
    return api.get('/camera/status');
  },

  getStreamUrl: (): string => {
    const baseURL = api.defaults.baseURL || '/api/v1';
    return `${baseURL}/camera/stream`;
  },

  startStream: async () => {
    return api.post('/camera/start');
  },

  stopStream: async () => {
    return api.post('/camera/stop');
  },

  captureImage: async () => {
    return api.post('/camera/capture');
  },
};

export default cameraService;
