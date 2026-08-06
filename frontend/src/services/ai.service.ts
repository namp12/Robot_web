import api from './api';

export const aiService = {
  chat: async (prompt: string) => {
    try {
      return await api.post('/ai/chat', { question: prompt });
    } catch (err) {
      // Fallback direct POST to Raspberry Pi backend
      const candidateIps = ['192.168.60.127', '192.168.61.135'];
      for (const ip of candidateIps) {
        try {
          const res = await fetch(`http://${ip}:8000/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: prompt })
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {}
      }
      return { answer: `Dạ, Kim Qui đã nhận câu hỏi: "${prompt}". Kim Qui đang sẵn sàng hỗ trợ bạn!` };
    }
  },
  getConversations: async (missionId?: number) => {
    try {
      return await api.get('/nosql/conversations', { params: { mission_id: missionId } });
    } catch (e) {
      return [];
    }
  },
  saveConversation: async (prompt: string, reply: string, missionId: number = 1) => {
    try {
      return await api.post('/ai/conversation', { prompt, reply, mission_id: missionId });
    } catch (e) {}
  }
};

export default aiService;
