import api from './api';
import { CameraStatus } from '../types';

export const cameraService = {
  getStatus: async (): Promise<CameraStatus> => {
    return api.get('/camera/status');
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
