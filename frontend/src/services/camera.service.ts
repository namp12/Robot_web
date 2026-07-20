import api from './api';
import { CameraStatus } from '../types';

export const cameraService = {
  getStatus: async (): Promise<CameraStatus> => {
    return api.get('/camera/status');
  },

  getStreamUrl: (): string => {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || 'localhost';
    // Direct stream link to port 8000 bypassing Vite proxy buffering
    return `${protocol}//${hostname}:8000/api/v1/camera/stream`;
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
