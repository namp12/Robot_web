import api from './api';
import { RobotMap } from '../types';

export const mapService = {
  getMaps: async (): Promise<RobotMap[]> => {
    return api.get('/maps');
  },

  createMap: async (mapData: Partial<RobotMap>) => {
    return api.post('/maps', mapData);
  },

  updateMap: async (id: number, mapData: Partial<RobotMap>) => {
    return api.put(`/maps/${id}`, mapData);
  },

  deleteMap: async (id: number) => {
    return api.delete(`/maps/${id}`);
  },

  startSLAM: async () => {
    return api.post('/slam/start');
  },

  stopSLAM: async () => {
    return api.post('/slam/stop');
  },

  saveSLAMMap: async (mapName: string, savePath?: string) => {
    return api.post('/slam/save', { map_name: mapName, save_path: savePath });
  },
};

export default mapService;
