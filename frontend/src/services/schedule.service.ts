import api from './api';

export interface PatrolSchedule {
  id?: number;
  name: string;
  start_time: string;
  end_time: string;
  days: string; // e.g. "Mon,Wed,Fri"
  waypoints: string; // JSON string of waypoints list
  active?: number;
  created_at?: string;
}

export const scheduleService = {
  getSchedules: async (): Promise<PatrolSchedule[]> => {
    return api.get('/schedules');
  },

  createSchedule: async (data: Partial<PatrolSchedule>): Promise<PatrolSchedule> => {
    return api.post('/schedules', data);
  },

  updateSchedule: async (id: number, data: Partial<PatrolSchedule>): Promise<PatrolSchedule> => {
    return api.put(`/schedules/${id}`, data);
  },

  deleteSchedule: async (id: number): Promise<boolean> => {
    return api.delete(`/schedules/${id}`);
  },
};

export default scheduleService;
