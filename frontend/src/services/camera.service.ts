import api from './api';
import { CameraStatus } from '../types';

export const cameraService = {
  getStatus: async (): Promise<CameraStatus> => {
    return api.get('/camera/status');
  },

  getStreamUrl: (): string => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    // Direct link to Windows YOLO AI Stream (Port 5050) for 0ms delay and instant sync
    return `${protocol}//${hostname}:5050/video_feed`;
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
