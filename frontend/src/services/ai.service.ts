import api from './api';

export const aiService = {
  chat: async (prompt: string) => {
    return api.post('/ai/chat', { question: prompt });
  },
};

export default aiService;
