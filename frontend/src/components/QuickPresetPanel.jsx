import React, { useState } from 'react';

const PRESETS = [
  { id: 1, name: '① Bám người', targetMode: 'FOLLOW_PERSON', icon: '👤', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  { id: 2, name: '② Tự hành', targetMode: 'AUTO_EXPLORE', icon: '🤖', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  { id: 3, name: '③ Lái tay', targetMode: 'MANUAL', icon: '🕹️', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { id: 4, name: '④ Lái tay an toàn', targetMode: 'SAFE_MANUAL', icon: '🛡️', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  { id: 5, name: '⑤ Đi tới điểm', targetMode: 'GO_TO_GOAL', icon: '🎯', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { id: 6, name: '⑥ Tuần tra', targetMode: 'PATROL', icon: '🔄', color: 'bg-cyan-600 hover:bg-cyan-700 text-white' },
  { id: 7, name: '⑦ Giao hàng', targetMode: 'DELIVERY', icon: '📦', color: 'bg-orange-600 hover:bg-orange-700 text-white' },
  { id: 8, name: '⑧ Về nhà', targetMode: 'RETURN_HOME', icon: '🏠', color: 'bg-teal-600 hover:bg-teal-700 text-white' },
  { id: 9, name: '⑨ Kiểm tra', targetMode: 'INSPECTION', icon: '🔍', color: 'bg-slate-600 hover:bg-slate-700 text-white' },
  { id: 10, name: '⑩ Trợ lý AI', targetMode: 'VOICE_ASSISTANT', icon: '🗣️', color: 'bg-violet-600 hover:bg-violet-700 text-white' },
  { id: 11, name: '⑪ Bám mục tiêu', targetMode: 'FOLLOW_TARGET', icon: '🏷️', color: 'bg-pink-600 hover:bg-pink-700 text-white' },
  { id: 12, name: '⑫ Sạc', targetMode: 'DOCKING', icon: '🔌', color: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
  { id: 13, name: '⑬ Giả lập', targetMode: 'SIMULATION', icon: '💻', color: 'bg-gray-600 hover:bg-gray-700 text-white' },
  { id: 14, name: '🚨 Dừng khẩn', targetMode: 'EMERGENCY_STOP', icon: '🚨', color: 'bg-red-600 hover:bg-red-700 text-white font-bold' }
];

export default function QuickPresetPanel({ currentPreset = 3, onPresetSelect }) {
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState(currentPreset);

  const handlePresetClick = async (presetId) => {
    setLoading(true);
    setActivePreset(presetId);

    const presetObj = PRESETS.find(p => p.id === presetId);
    const targetMode = presetObj ? presetObj.targetMode : 'MANUAL';

    try {
      // 1. Send to local Vite proxy endpoint
      await fetch('/api/v1/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: presetId, source: 'QUICK_PRESET_PANEL' })
      });
    } catch (err) {
      // 2. Fallback direct request to Pi FastAPI (8000) & HTTP Bridge (8001) if proxy fails
      try {
        await fetch('http://172.16.68.245:8000/api/v1/preset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preset: presetId, source: 'QUICK_PRESET_PANEL' })
        });
      } catch (err2) {
        try {
          await fetch('http://172.16.68.245:8001/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `mode ${presetId}`, command: `mode ${presetId}` })
          });
        } catch (e) {}
      }
    } finally {
      if (onPresetSelect) onPresetSelect(presetId);
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100 mb-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🚀</span>
          <h3 className="font-bold text-base tracking-wide uppercase">QUICK PRESET MODE SYSTEM V1</h3>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-slate-800 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>Preset Active: <strong className="text-indigo-400">Preset #{activePreset}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            disabled={loading}
            onClick={() => handlePresetClick(p.id)}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all transform active:scale-95 shadow-md ${
              activePreset === p.id
                ? 'ring-2 ring-white scale-105 ' + p.color
                : p.color + ' opacity-85 hover:opacity-100'
            }`}
          >
            <span className="text-sm">{p.icon}</span>
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
