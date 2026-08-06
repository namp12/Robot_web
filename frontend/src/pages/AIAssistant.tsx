import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { BotMessageSquare, Send, User, Bot, Loader2, RefreshCw } from 'lucide-react';
import aiService from '../services/ai.service';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', sender: 'assistant', text: 'Xin chào Phương Nam! Tôi là Trợ lý AI của Robot Kim Qui. Tôi sẵn sàng hỗ trợ điều khiển và chẩn đoán.', timestamp: new Date().toLocaleTimeString() }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load and sync conversation logs from TinyDB NoSQL database
  const syncConversations = async () => {
    try {
      const dbLogs = await aiService.getConversations();
      if (Array.isArray(dbLogs)) {
        const parsedMsgs: Message[] = [
          { id: 'welcome', sender: 'assistant', text: 'Xin chào Phương Nam! Tôi là Trợ lý AI của Robot Kim Qui. Tôi sẵn sàng hỗ trợ điều khiển và chẩn đoán.', timestamp: 'Hệ thống' }
        ];

        dbLogs.forEach((log: any, index: number) => {
          const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';
          
          if (log.prompt) {
            parsedMsgs.push({
              id: `prompt-${index}`,
              sender: 'user',
              text: log.prompt,
              timestamp: timeStr
            });
          }
          if (log.reply) {
            parsedMsgs.push({
              id: `reply-${index}`,
              sender: 'assistant',
              text: log.reply,
              timestamp: timeStr
            });
          }
        });

        // Update state only if DB returns valid logs, without wiping local chat history
        setMessages((prev) => {
          if (parsedMsgs.length <= 1 && prev.length > 1) {
            return prev;
          }
          if (prev.length > parsedMsgs.length) {
            return prev;
          }
          return parsedMsgs;
        });
      }
    } catch (err) {
      console.error('Failed to sync conversations', err);
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial sync & start 2-second polling loop
  useEffect(() => {
    syncConversations();
    const interval = setInterval(syncConversations, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userPrompt = input;
    setInput('');
    setLoading(true);

    const nowStr = new Date().toLocaleTimeString();

    // 1. Instantly render user message bubble on UI
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: nowStr
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // 2. Query AI Chat Endpoint (ShopAIKey / Ollama / Pi Fallback)
      const res = await aiService.chat(userPrompt);
      const replyText = (res as any)?.answer || (res as any)?.reply || `Dạ, Kim Qui đã nhận được câu hỏi của bạn!`;

      // 3. Instantly render assistant response bubble on UI
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // 4. Save to NoSQL DB
      await aiService.saveConversation(userPrompt, replyText, 1);
    } catch (err) {
      console.error('AI chat error', err);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `Dạ, Kim Qui đã tiếp nhận câu hỏi: "${userPrompt}". Kim Qui luôn sẵn sàng hỗ trợ bạn ạ!`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const [aiState, setAiState] = useState<'LISTENING' | 'STT' | 'THINKING' | 'SPEAKING'>('LISTENING');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BotMessageSquare className="w-6 h-6 text-accent-cyan" />
            <span>AI Assistant Copilot - Robot Kim Qui</span>
          </h1>
          <p className="text-xs text-slate-400">Trò chuyện trực tiếp & thu thập hội thoại thời gian thực qua Mic của Robot</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Trạng thái hoạt động AI Intuitive State Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-full text-xs font-mono">
            {loading ? (
              <span className="flex items-center gap-1.5 text-amber-400 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> 🧠 ĐANG SUY LUẬN (LLM)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> 🎧 ĐANG LẮNG NGHE (MICRO ACTIVE)
              </span>
            )}
          </div>

          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={syncConversations}>
            Đồng bộ ngay
          </Button>
        </div>
      </div>

      <Card className="flex flex-col h-[650px] p-0 overflow-hidden border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        {/* Chat Messages Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${msg.sender === 'user' ? 'bg-primary-600' : 'bg-accent-cyan'}`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[70%] p-3.5 rounded-2xl text-sm relative group ${msg.sender === 'user' ? 'bg-primary-600/20 text-slate-100 border border-primary-500/30' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                <p className="leading-relaxed">{msg.text}</p>
                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-700/40 text-[9px] text-slate-500 font-mono">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && (
                    <button
                      onClick={() => {
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          const utt = new SpeechSynthesisUtterance(msg.text);
                          utt.lang = 'vi-VN';
                          const v = window.speechSynthesis.getVoices().find(voice => voice.lang.includes('vi'));
                          if (v) utt.voice = v;
                          window.speechSynthesis.speak(utt);
                        }
                      }}
                      className="text-accent-cyan hover:text-white transition-colors flex items-center gap-1 font-sans"
                      title="Phát giọng nói ra Loa Bluetooth"
                    >
                      🔊 Phát Loa
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 w-fit animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>⚡ Kim Qui đang truy vấn ShopAIKey Cloud & trả lời...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-dark-border bg-slate-900/60 flex items-center gap-3">
          <input
            type="text"
            placeholder="Nhập câu hỏi hoặc ra lệnh cho Kim Qui (ví dụ: 'Đi thẳng', 'Báo cáo pin')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary-500 placeholder-slate-500"
          />
          <Button variant="primary" isLoading={loading} icon={<Send className="w-4 h-4" />} onClick={handleSend}>
            Gửi
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;
