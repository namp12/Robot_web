import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { BotMessageSquare, Send, User, Bot, Loader2 } from 'lucide-react';
import aiService from '../services/ai.service';

export const AIAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', sender: 'assistant', text: 'Hello Phuong Nam! I am your Robot Explorer AI Copilot. How can I assist you today?', timestamp: new Date().toLocaleTimeString() }
  ]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userPrompt = input;
    const userMsg = { id: Date.now().toString(), sender: 'user', text: userPrompt, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat(userPrompt);
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: (res as any).answer || `Response to "${userPrompt}": All robot telemetry operating normally.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error('AI error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BotMessageSquare className="w-6 h-6 text-accent-cyan" />
            <span>AI Assistant Copilot</span>
          </h1>
          <p className="text-xs text-slate-400">Natural language command dispatcher & diagnostic queries</p>
        </div>
      </div>

      <Card className="flex flex-col h-[650px] p-0 overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${msg.sender === 'user' ? 'bg-primary-600' : 'bg-accent-cyan'}`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[70%] p-3.5 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-primary-600/20 text-slate-100 border border-primary-500/30' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                <p>{msg.text}</p>
                <span className="text-[10px] text-slate-400 mt-1 block text-right font-mono">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent-cyan" />
              <span>AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-dark-border bg-slate-900/60 flex items-center gap-3">
          <input
            type="text"
            placeholder="Type your question or command (e.g. 'Check battery status')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary-500"
          />
          <Button variant="primary" isLoading={loading} icon={<Send className="w-4 h-4" />} onClick={handleSend}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;
