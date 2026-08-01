import api from './api';

export const aiService = {
  chat: async (prompt: string) => {
    return api.post('/ai/chat', { question: prompt });
  },
  getConversations: async (missionId?: number) => {
    return api.get('/nosql/conversations', { params: { mission_id: missionId } });
  },
  saveConversation: async (prompt: string, reply: string, missionId: number = 1) => {
    return api.post('/ai/conversation', { prompt, reply, mission_id: missionId });
  }
};

export default aiService;
