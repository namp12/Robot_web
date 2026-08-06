import React, { useState } from 'react';

const MODES = [
  { id: 'EMERGENCY_STOP', name: '🚨 Emergency Stop', icon: '🚨', color: 'bg-red-600 hover:bg-red-700 text-white font-bold', prio: 1 },
  { id: 'SAFE_MANUAL', name: '🛡️ Safe Manual', icon: '🛡️', color: 'bg-amber-600 hover:bg-amber-700 text-white', prio: 2 },
  { id: 'MANUAL', name: '🕹️ Manual Drive', icon: '🕹️', color: 'bg-blue-600 hover:bg-blue-700 text-white', prio: 3 },
  { id: 'GO_TO_GOAL', name: '🎯 Go to Goal', icon: '🎯', color: 'bg-emerald-600 hover:bg-emerald-700 text-white', prio: 4 },
  { id: 'FOLLOW_PERSON', name: '👤 Follow Person', icon: '👤', color: 'bg-purple-600 hover:bg-purple-700 text-white', prio: 5 },
  { id: 'FOLLOW_TARGET', name: '🏷️ Follow Target', icon: '🏷️', color: 'bg-pink-600 hover:bg-pink-700 text-white', prio: 6 },
  { id: 'PATROL', name: '🔄 Patrol Mode', icon: '🔄', color: 'bg-cyan-600 hover:bg-cyan-700 text-white', prio: 7 },
  { id: 'DELIVERY', name: '📦 Delivery', icon: '📦', color: 'bg-orange-600 hover:bg-orange-700 text-white', prio: 8 },
  { id: 'RETURN_HOME', name: '🏠 Return Home', icon: '🏠', color: 'bg-teal-600 hover:bg-teal-700 text-white', prio: 9 },
  { id: 'AUTO_EXPLORE', name: '🤖 Auto Explore', icon: '🤖', color: 'bg-indigo-600 hover:bg-indigo-700 text-white', prio: 10 },
  { id: 'INSPECTION', name: '🔍 Inspection', icon: '🔍', color: 'bg-slate-600 hover:bg-slate-700 text-white', prio: 11 },
  { id: 'VOICE_ASSISTANT', name: '🗣️ Voice Assistant', icon: '🗣️', color: 'bg-violet-600 hover:bg-violet-700 text-white', prio: 12 },
  { id: 'DOCKING', name: '🔌 Auto Docking', icon: '🔌', color: 'bg-yellow-600 hover:bg-yellow-700 text-white', prio: 13 },
  { id: 'SIMULATION', name: '💻 Simulation', icon: '💻', color: 'bg-gray-600 hover:bg-gray-700 text-white', prio: 14 }
];

export default function QuickModePanel({ currentMode = 'MANUAL', onModeChange }) {
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(currentMode);

  const handleSwitchMode = async (modeId) => {
    setLoading(true);
    setActiveMode(modeId);

    try {
      await fetch('/api/v1/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: modeId, source: 'WEB_PANEL' })
      });
      if (onModeChange) onModeChange(modeId);
    } catch (err) {
      console.warn('Mode switch request sent:', modeId, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100 mb-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🎛️</span>
          <h3 className="font-bold text-base tracking-wide uppercase">Quick Mode Control Panel V3.5</h3>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-slate-800 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Active: <strong className="text-emerald-400">{activeMode}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            disabled={loading}
            onClick={() => handleSwitchMode(m.id)}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all transform active:scale-95 shadow-md ${
              activeMode === m.id
                ? 'ring-2 ring-white scale-105 ' + m.color
                : m.color + ' opacity-80 hover:opacity-100'
            }`}
          >
            <span>{m.icon}</span>
            <span className="truncate">{m.name.split(' ')[1] || m.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
