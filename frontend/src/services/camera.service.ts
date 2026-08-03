import api from './api';
import { CameraStatus } from '../types';

export const cameraService = {
  getStatus: async (): Promise<CameraStatus> => {
    return api.get('/camera/status');
  },

  getStreamUrl: (): string => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    // Dynamic stream URL from backend API (proxies ROS2 /camera/image_raw topic & HTTP MJPEG stream)
    return `${protocol}//${hostname}:8000/api/camera/stream`;
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
